import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFlow,
  changeStage,
  currentStage,
  defaultTemplate,
  emptyData,
  makeStages,
  normalizeWebsite,
  outcome,
  parseData,
  validateFlow,
} from '../src/features/tracker/model.ts';
import { makeCsv, makeHtml } from '../src/features/tracker/export.ts';

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
  const records = [{ application: data.applications[0], company: data.companies[0] }];
  const html = makeHtml(records, { title: '<测试>', theme: 'rose', notes: true, websites: false });
  assert.ok(!html.includes('<script>') && !html.includes('<img') && !html.includes('<link'));
  assert.ok(html.includes('&lt;script&gt;') && html.includes('&lt;测试&gt;'));
  assert.ok(makeCsv(records, { notes: false, websites: false }).includes("'="));
});
