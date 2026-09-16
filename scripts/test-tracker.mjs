import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyFlow,
  changeStage,
  currentStage,
  defaultTemplate,
  emptyData,
  importAiRecords,
  makeStages,
  normalizeWebsite,
  outcome,
  parseData,
  positionLabel,
  quickAddApplication,
  quickRemoveApplication,
  compareApplicationsByProgress,
  removeApplications,
  validateFlow,
} from '../src/features/tracker/model.ts';
import { makeCsv, makeHtml } from '../src/features/tracker/export.ts';
import { trackerMotion, trackerTimelineMotion } from '../src/features/tracker/motion.ts';
import { getCompanyIcon } from '../src/utils/getFavicon.ts';

function fixture() {
  const data = emptyData();
  data.companies.push({
    id: 'c1',
    name: '测试公司',
    website: 'https://example.com',
    isCustom: true,
  });
  data.applications.push({
    id: 'a1',
    companyId: 'c1',
    position: '前端开发',
    appliedAt: '2026-09-03',
    note: '私人投递备注',
    stages: makeStages(data.template),
    archived: false,
    withdrawn: false,
    createdAt: '2026-09-03T01:00:00Z',
    updatedAt: '2026-09-03T01:00:00Z',
  });
  return data;
}

test('缓存图标清单使用仓库约定的单引号格式', () => {
  const source = readFileSync(resolve(import.meta.dirname, '../src/companyIcons.ts'), 'utf8');
  const entries = source
    .split('\n')
    .filter((line) => /^\s*["'][^"']+["']:\s*["'][^"']+["'],?$/.test(line));

  assert.ok(entries.length > 0);
  assert.ok(entries.every((line) => line.trimStart().startsWith("'")));
});

test('公司图标只使用本地 WebP，未知公司回退到本站图标', () => {
  const known = getCompanyIcon('字节跳动', 'https://jobs.bytedance.com/campus/position');
  const fallback = getCompanyIcon('不存在的公司', 'https://example.com');

  assert.match(known, /\.webp$/);
  assert.match(fallback, /sakura-offer-icon\.webp$/);
  assert.ok(!known.includes('google.com') && !fallback.includes('google.com'));
});
test('默认流程复制独立 ID，模板修改不会影响已有投递', () => {
  const data = fixture();
  assert.equal(data.template.length, 8);
  assert.notEqual(data.template[0].id, data.applications[0].stages[0].id);
  data.template.splice(2, 2);
  assert.equal(data.applications[0].stages.length, 8);
});
test('推进、跳过、回退和未通过保持单一当前阶段，回退保留备注', () => {
  let stages = makeStages(defaultTemplate());
  stages[4].note = '三面备忘';
  stages = changeStage(stages, stages[2].id, 'active');
  assert.deepEqual(
    stages.slice(0, 3).map((s) => s.status),
    ['skipped', 'skipped', 'active'],
  );
  stages = changeStage(stages, stages[2].id, 'completed');
  assert.equal(stages[3].status, 'active');
  assert.ok(stages[2].completedAt);
  stages = changeStage(stages, stages[3].id, 'rejected');
  assert.equal(stages.filter((s) => s.status === 'active').length, 0);
  stages = changeStage(stages, stages[1].id, 'active');
  assert.ok(stages.slice(2).every((s) => s.status === 'pending' && s.completedAt === ''));
  assert.equal(stages[4].note, '三面备忘');
});
test('删除当前阶段自动定位未开始阶段并保留其他历史', () => {
  const app = fixture().applications[0];
  app.stages = changeStage(app.stages, app.stages[0].id, 'completed');
  app.stages = applyFlow(
    app.stages,
    app.stages.filter((_, i) => i !== 1),
  );
  assert.equal(currentStage(app)?.name, '一面');
  assert.equal(app.stages[0].status, 'completed');
});
test('最后一轮完成不等于 offer，只有明确的 offer 阶段完成才计数', () => {
  const app = fixture().applications[0];
  app.stages = [{ ...app.stages[0], status: 'completed' }];
  assert.equal(outcome(app), 'completed');
  app.stages[0].isOffer = true;
  assert.equal(outcome(app), 'offer');
  app.withdrawn = true;
  assert.equal(outcome(app), 'withdrawn');
  app.withdrawn = false;
  app.stages[0].status = 'skipped';
  assert.equal(outcome(app), 'completed');
});
test('流程校验拒绝空流程、重复名称和非末尾 offer', () => {
  assert.throws(() => validateFlow([]));
  assert.throws(() =>
    validateFlow([
      { id: '1', name: '一面', isOffer: false },
      { id: '2', name: '一面 ', isOffer: false },
    ]),
  );
  const flow = defaultTemplate();
  flow.reverse();
  assert.throws(() => validateFlow(flow));
});
test('官网补全协议、移除路径、拒绝危险协议和凭据', () => {
  assert.equal(normalizeWebsite('example.com/jobs?token=x'), 'https://example.com');
  assert.equal(normalizeWebsite(''), '');
  for (const website of [
    'javascript:alert(1)',
    'data:text/html,a',
    'file:///etc/passwd',
    'https://user:pass@example.com',
    'invalid',
  ])
    assert.throws(() => normalizeWebsite(website));
});
test('快捷添加只创建一条待设置岗位的投递，并能持久化读取', () => {
  const initial = emptyData();
  const first = quickAddApplication(initial, {
    name: '测试公司招聘',
    website: 'https://example.com/campus',
  });
  const duplicate = quickAddApplication(first, {
    name: '测试公司招聘',
    website: 'https://example.com/campus',
  });

  assert.equal(first.companies.length, 1);
  assert.equal(first.companies[0].name, '测试公司');
  assert.equal(first.applications.length, 1);
  assert.equal(first.applications[0].position, '待设置岗位');
  assert.equal(duplicate.applications.length, 1);
  assert.deepEqual(parseData(JSON.stringify(first)), first);
});
test('快捷移除仅删除来源匹配的投递，保留同公司手动添加的其他职位', () => {
  const added = quickAddApplication(emptyData(), {
    name: '测试公司',
    website: 'https://example.com/jobs',
  });
  const manual = {
    ...added.applications[0],
    id: 'manual-position',
    position: '后端开发',
    sourceKey: undefined,
  };
  const removed = quickRemoveApplication(
    { ...added, applications: [...added.applications, manual] },
    { name: '测试公司', website: 'https://example.com/jobs' },
  );

  assert.deepEqual(
    removed.applications.map((application) => application.id),
    ['manual-position'],
  );
  assert.equal(removed.companies.length, 1);
});
test('AI 轻量 JSON 追加记录并使用指定当前阶段', () => {
  const initial = fixture();
  const imported = importAiRecords(
    JSON.stringify([
      {
        companyName: '新公司',
        website: 'https://example.com/jobs?recommendCode=remove-me',
        appliedAt: '2026-09-16',
        position: '前端工程师',
        status: 'active',
        currentStage: '一面',
      },
    ]),
    initial,
  );

  assert.equal(imported.applications.length, initial.applications.length + 1);
  assert.equal(imported.companies.at(-1)?.website, 'https://example.com');
  const application = imported.applications.at(-1);
  assert.equal(currentStage(application)?.name, '一面');
  assert.equal(application?.position, '前端工程师');
});
test('未设置岗位时统一显示待设置岗位', () => {
  assert.equal(positionLabel(''), '待设置岗位');
  assert.equal(positionLabel('  '), '待设置岗位');
  assert.equal(positionLabel('前端开发'), '前端开发');
});
test('表格操作列提供纵向详情和删除入口', () => {
  const source = readFileSync(
    resolve(import.meta.dirname, '../src/features/tracker/ApplicationTable.tsx'),
    'utf8',
  );

  assert.match(source, /className="tracker-card-actions tracker-table-actions"/);
  assert.match(source, /<span>详情<\/span>/);
  assert.match(source, /<span>删除<\/span>/);
  assert.match(source, /onDelete\(application\.id\)/);
});
test('详情弹窗将公司岗位状态合并到头部并移除重复进度标题', () => {
  const source = readFileSync(
    resolve(import.meta.dirname, '../src/features/tracker/RecordDialogs.tsx'),
    'utf8',
  );

  assert.match(source, /tracker-dialog-title-inline/);
  assert.match(source, /OUTCOME_LABELS\[outcome\(draft\)\]/);
  assert.doesNotMatch(source, /<h3>招聘进度<\/h3>/);
});
test('默认排序按流程阶段倒序，同阶段按最近更新时间倒序', () => {
  const data = fixture();
  const makeApplication = (id, stageName, updatedAt, stageStatus = 'active') => {
    const application = structuredClone(data.applications[0]);
    application.id = id;
    application.updatedAt = updatedAt;
    application.stages = application.stages.map((stage) => ({
      ...stage,
      status: stage.name === stageName ? stageStatus : 'pending',
    }));
    return application;
  };
  const firstInterview = makeApplication('a-first', '一面', '2026-09-16T08:00:00Z');
  const secondInterview = makeApplication('a-second', '二面', '2026-09-15T08:00:00Z');
  const newerFirstInterview = makeApplication('a-newer-first', '一面', '2026-09-17T08:00:00Z');

  const sorted = [firstInterview, secondInterview, newerFirstInterview].sort((left, right) =>
    compareApplicationsByProgress(left, right, data.template, false),
  );

  assert.deepEqual(
    sorted.map((application) => application.id),
    ['a-second', 'a-newer-first', 'a-first'],
  );
});
test('全部状态时未通过排在最后，未通过内部仍按阶段倒序', () => {
  const data = fixture();
  const makeApplication = (id, stageName, status) => {
    const application = structuredClone(data.applications[0]);
    application.id = id;
    application.updatedAt = '2026-09-16T08:00:00Z';
    application.stages = application.stages.map((stage) => ({
      ...stage,
      status: stage.name === stageName ? status : 'pending',
    }));
    return application;
  };
  const activeFirstInterview = makeApplication('a-active-first', '一面', 'active');
  const rejectedFirstInterview = makeApplication('a-rejected-first', '一面', 'rejected');
  const rejectedSecondInterview = makeApplication('a-rejected-second', '二面', 'rejected');

  const allStatuses = [activeFirstInterview, rejectedFirstInterview, rejectedSecondInterview].sort(
    (left, right) => compareApplicationsByProgress(left, right, data.template, true),
  );
  assert.deepEqual(
    allStatuses.map((application) => application.id),
    ['a-active-first', 'a-rejected-second', 'a-rejected-first'],
  );

  const rejectedOnly = [rejectedFirstInterview, rejectedSecondInterview].sort((left, right) =>
    compareApplicationsByProgress(left, right, data.template, false),
  );
  assert.deepEqual(
    rejectedOnly.map((application) => application.id),
    ['a-rejected-second', 'a-rejected-first'],
  );
});
test('批量删除投递记录并清理不再使用的自定义公司', () => {
  const data = fixture();
  data.companies.push({
    id: 'c2',
    name: '待删除公司',
    website: 'https://unused.example.com',
    isCustom: true,
  });
  const second = structuredClone(data.applications[0]);
  second.id = 'a2';
  second.companyId = 'c2';
  data.applications.push(second);

  const removed = removeApplications(data, ['a1', 'a2']);

  assert.equal(removed.applications.length, 0);
  assert.equal(removed.companies.length, 0);
  assert.equal(data.applications.length, 2);
});
test('投递页动效区分分层进入、内容切换和减少动态效果', () => {
  assert.deepEqual(trackerMotion(false), {
    enterDuration: 0.56,
    enterOffset: 24,
    enterStagger: 0.075,
    contentDuration: 0.28,
    contentOffset: 10,
    itemDuration: 0.42,
    itemOffset: 14,
    itemStagger: 0.045,
  });
  assert.deepEqual(trackerMotion(true), {
    enterDuration: 0,
    enterOffset: 0,
    enterStagger: 0,
    contentDuration: 0,
    contentOffset: 0,
    itemDuration: 0,
    itemOffset: 0,
    itemStagger: 0,
  });
});
test('表格展开动效在正常模式下有过渡，减少动态效果时立即完成', () => {
  const motion = trackerTimelineMotion(false);
  assert.ok(motion.expandDuration > 0 && motion.stageDuration > 0 && motion.stageStagger > 0);
  assert.deepEqual(trackerTimelineMotion(true), {
    expandDuration: 0,
    stageDuration: 0,
    stageOffset: 0,
    stageStagger: 0,
  });
});
test('JSON 备份完整往返，忽略额外字段', () => {
  const data = fixture();
  assert.deepEqual(parseData(JSON.stringify({ ...data, exportedAt: '2026-09-03' })), data);
});
test('导入拒绝损坏 JSON、不支持的版本、缺失公司和重复 ID', () => {
  assert.throws(() => parseData('{'));
  for (const mutate of [
    (d) => {
      d.version = 2;
    },
    (d) => {
      d.companies = [];
    },
    (d) => {
      d.applications.push(d.applications[0]);
    },
    (d) => {
      d.applications[0].stages[1].status = 'active';
    },
    (d) => {
      d.applications[0].appliedAt = '2026-02-30';
    },
    (d) => {
      d.applications[0].stages[0].status = '__proto__';
    },
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(() => parseData(JSON.stringify(data)));
  }
});
test('CSV 支持不同公司流程并默认排除私人备注和官网', () => {
  const data = fixture();
  const second = structuredClone(data.applications[0]);
  second.id = 'a2';
  second.stages[1].name = '四面';
  const records = [data.applications[0], second].map((application) => ({
    application,
    company: data.companies[0],
  }));
  const csv = makeCsv(records, { notes: false, websites: false });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('四面 · 状态') && csv.includes('不适用'));
  assert.ok(!csv.includes('私人投递备注') && !csv.includes('example.com'));
  assert.ok(makeCsv(records, { notes: true, websites: true }).includes('私人投递备注'));
});
test('导出转义 HTML 注入和 CSV 公式，HTML 不含外部依赖', () => {
  const data = fixture();
  data.companies[0].name = '<script>alert(1)</script>';
  data.applications[0].position = '=HYPERLINK("https://evil.test")';
  data.applications[0].stages[0].note = '<img src=x onerror=alert(1)>';
  const offerStage = data.applications[0].stages.at(-1);
  assert.ok(offerStage);
  data.applications[0].stages = changeStage(
    data.applications[0].stages,
    offerStage.id,
    'completed',
  );
  const records = [{ application: data.applications[0], company: data.companies[0] }];
  const html = makeHtml(records, { title: '<测试>', theme: 'rose', notes: true, websites: false });
  assert.ok(!html.includes('<script>') && !html.includes('<img') && !html.includes('<link'));
  assert.ok(!html.includes('share-cover'));
  assert.ok(html.includes('&lt;script&gt;') && html.includes('&lt;测试&gt;'));
  assert.ok(makeCsv(records, { notes: false, websites: false }).includes("'="));
});
test('HTML 导出只展示 offer 公司与三项统计，并使用不同语义色', () => {
  const data = fixture();
  data.companies.push({
    id: 'c2',
    name: 'Offer 公司',
    website: '',
    isCustom: true,
  });
  const offerApplication = structuredClone(data.applications[0]);
  offerApplication.id = 'a2';
  offerApplication.companyId = 'c2';
  const offerStage = offerApplication.stages.at(-1);
  assert.ok(offerStage);
  offerApplication.stages = changeStage(offerApplication.stages, offerStage.id, 'completed');
  const html = makeHtml(
    [
      { application: data.applications[0], company: data.companies[0] },
      { application: offerApplication, company: data.companies[1] },
    ],
    { title: '秋招进度', theme: 'rose', notes: false, websites: false },
  );

  assert.ok(html.includes('<b>2</b>投递数量'));
  assert.ok(html.includes('<b>1</b>进行中'));
  assert.ok(html.includes('<b>1</b>Offer 数量'));
  assert.ok(html.includes('Offer 公司'));
  assert.ok(!html.includes('测试公司'));
  assert.equal(html.match(/进行中/g)?.length, 1);
  assert.ok(!html.includes('测试岗位'));
  assert.ok(!html.includes('投递于'));
  assert.ok(html.includes('.stat.total{color:#a23f65'));
  assert.ok(html.includes('.stat.active{color:#8a5700'));
  assert.ok(html.includes('.stat.offer{color:#087a4c'));
});
