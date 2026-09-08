import assert from 'node:assert/strict';
import test from 'node:test';

import bookmarkData from '../src/bookmarks.json' with { type: 'json' };

test('秋招记录开放日期，实习生分类不记录开放日期', () => {
  const autumn = bookmarkData.categories.find((category) => category.id === 'autumn');
  const internship = bookmarkData.categories.find((category) => category.id === 'campus');
  const blueFocus = autumn?.links.find((link) => link.title === '蓝色光标招聘');
  const xiaohongshu = autumn?.links.find((link) => link.title === '小红书校园招聘');
  const pinduoduo = autumn?.links.find((link) => link.title === '拼多多校园招聘');

  assert.equal(blueFocus?.openedAt, '2026-09-07');
  assert.equal(xiaohongshu?.openedAt, '2026-09-08');
  assert.equal(pinduoduo?.openedAt, '2026-09-01');
  assert.ok(internship?.links.every((link) => !('openedAt' in link)));
});

test('时间线只保留最近七天并按开放日期倒序排列', async () => {
  const { buildRecruitmentTimeline } = await import('../src/utils/recruitmentTimeline.ts');
  const links = [
    { title: '七天前开放', url: 'https://boundary.example', openedAt: '2026-09-01' },
    { title: '超过七天', url: 'https://expired.example', openedAt: '2026-08-31' },
    { title: '今天开放', url: 'https://today.example', openedAt: '2026-09-08' },
    { title: '昨天开放', url: 'https://yesterday.example', openedAt: '2026-09-07' },
    { title: '未知日期', url: 'https://unknown.example' },
    { title: '未来开放', url: 'https://future.example', openedAt: '2026-09-09' },
    { title: '无效日期', url: 'https://invalid.example', openedAt: '2026-9-8' },
  ];

  const items = buildRecruitmentTimeline(links, '2026-09-08');

  assert.deepEqual(
    items.map(({ link, dateLabel }) => [link.title, dateLabel]),
    [
      ['今天开放', '今天'],
      ['昨天开放', '昨天'],
      ['七天前开放', '9月1日'],
    ],
  );
});

test('没有最近七天内开放的秋招公司时返回空时间线', async () => {
  const { buildRecruitmentTimeline } = await import('../src/utils/recruitmentTimeline.ts');

  const items = buildRecruitmentTimeline(
    [{ title: '更早开放', url: 'https://earlier.example', openedAt: '2026-08-31' }],
    '2026-09-08',
  );

  assert.deepEqual(items, []);
});
