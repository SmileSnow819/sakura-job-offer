import test from 'node:test';
import assert from 'node:assert/strict';

import {
  diffCandidates,
  fetchNowcoderCandidates,
  fetchFeishuCandidates,
  normalizeCandidate,
  runAggregation,
  applyReportToBookmarks,
} from './recruitment-aggregation.mjs';

const response = (payload, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  statusText: ok ? 'OK' : 'Error',
  json: async () => payload,
});

test('按招聘入口 URL 匹配已有书签并识别新增记录', () => {
  const candidates = [
    normalizeCandidate({
      source: 'nowcoder',
      company: '示例科技',
      title: '示例科技 2027 校园招聘',
      recruitmentUrl: 'https://jobs.example.com/campus',
      openedAt: '2026-09-18',
    }),
    normalizeCandidate({
      source: 'feishu',
      company: '新公司',
      title: '新公司 2027 校招',
      recruitmentUrl: 'https://new.example.com/campus',
    }),
  ];

  const report = diffCandidates(candidates, [
    { title: '示例科技校园招聘', url: 'https://jobs.example.com/campus' },
  ]);

  assert.equal(report.enrichments.length, 1);
  assert.equal(report.enrichments[0].openedAt, '2026-09-18');
  assert.equal(report.additions.length, 1);
  assert.equal(report.additions[0].company, '新公司');
});

test('按公司名兜底匹配并合并重复来源', () => {
  const candidates = [
    normalizeCandidate({
      source: 'nowcoder',
      company: '同一公司',
      title: '同一公司校招',
      recruitmentUrl: 'https://a.example.com',
    }),
    normalizeCandidate({
      source: 'feishu',
      company: '同一公司',
      title: '同一公司 2027 校招正式启动',
      recruitmentUrl: 'https://b.example.com',
    }),
  ];

  const report = diffCandidates(candidates, [
    { title: '同一公司', url: 'https://old.example.com' },
  ]);

  assert.equal(report.additions.length, 0);
  assert.equal(report.duplicates.length, 1);
  assert.deepEqual(report.duplicates[0].sources, ['nowcoder', 'feishu']);
});

test('缺少公司或招聘入口的记录进入跳过列表', () => {
  const candidate = normalizeCandidate({ source: 'feishu', title: '无入口公告' });

  assert.equal(candidate.valid, false);
  assert.match(candidate.reason, /公司|入口/);
});

test('牛客适配器映射校招卡片字段', async () => {
  const candidates = await fetchNowcoderCandidates({
    pageSize: 20,
    fetchImpl: async () =>
      response({
        code: 0,
        data: {
          totalCount: 1,
          datas: [
            {
              name: '牛客示例',
              batchName: '27届秋招',
              customWangshenLink: 'https://jobs.example.com/campus',
              wangshenBeginDate: 1789689600000,
              sourceInformation: 'https://mp.weixin.qq.com/s/example',
            },
          ],
        },
      }),
  });

  assert.deepEqual(candidates[0], {
    source: 'nowcoder',
    company: '牛客示例',
    title: '牛客示例 27届秋招',
    recruitmentUrl: 'https://jobs.example.com/campus',
    openedAt: '2026-09-18',
    sourceUrl: 'https://mp.weixin.qq.com/s/example',
    reason: '',
    valid: true,
  });
});

test('飞书适配器读取记录并清理内推参数', async () => {
  const candidates = await fetchFeishuCandidates({
    execFileImpl: async () => ({
      stdout: JSON.stringify({ ok: true, data: { data: [[
        '飞书示例', [], [], '技术岗', '上海', 'https://jobs.example.com/campus?recommendCode=secret&channel=x', 'secret',
      ]] } }),
      stderr: '',
    }),
  });

  assert.equal(candidates[0].company, '飞书示例');
  assert.equal(candidates[0].recruitmentUrl, 'https://jobs.example.com/campus');
});

test('聚合报告保留三个来源状态并合并小红书 runner', async () => {
  const report = await runAggregation({
    fetchImpl: async (url) => {
      if (url.startsWith('https://www.nowcoder.com')) {
        return response({ code: 0, data: { datas: [] } });
      }
      return response({ code: 200001, data: { plans: [] } });
    },
    xiaohongshuRunner: async () => [
      {
        company: '小红书示例',
        title: '小红书示例校招',
        recruitmentUrl: 'https://xiaohongshu.example.com/campus',
      },
    ],
  });

  assert.deepEqual(report.sources, { nowcoder: 'fulfilled', feishu: 'fulfilled', xiaohongshu: 'fulfilled' });
  assert.equal(report.additions[0].source, 'xiaohongshu');
  assert.deepEqual(report.errors, []);
});

test('写入模式只加入明确有招聘入口的候选并补齐日期', () => {
  const data = { categories: [{ id: 'autumn', links: [{ title: '已有公司校园招聘', url: 'https://old.example.com' }] }] };
  applyReportToBookmarks(data, {
    additions: [{ company: '新公司', recruitmentUrl: 'https://new.example.com/campus', openedAt: '2026-09-18' }],
    enrichments: [{ existing: data.categories[0].links[0], openedAt: '2026-09-17' }],
  });
  assert.equal(data.categories[0].links.length, 2);
  assert.equal(data.categories[0].links[1].title, '新公司校园招聘');
  assert.equal(data.categories[0].links[0].openedAt, '2026-09-17');
});
