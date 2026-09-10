import assert from 'node:assert/strict';
import test from 'node:test';

import bookmarkData from '../src/bookmarks.json' with { type: 'json' };

test('可从小红书原帖 URL 或笔记 ID 还原北京时间创建时间', async () => {
  const { getXiaohongshuNoteCreatedAt } = await import('../src/utils/xiaohongshuNoteTime.ts');
  const noteId = '6aa22879000000002701401c';

  assert.deepEqual(getXiaohongshuNoteCreatedAt(noteId), {
    date: '2026-09-10',
    dateTime: '2026-09-10 11:48:09',
    noteId,
  });
  assert.deepEqual(
    getXiaohongshuNoteCreatedAt(`https://www.xiaohongshu.com/explore/${noteId}?xsec_token=test`),
    {
      date: '2026-09-10',
      dateTime: '2026-09-10 11:48:09',
      noteId,
    },
  );
});

test('小红书笔记 ID 缺失或不合法时不生成创建时间', async () => {
  const { getXiaohongshuNoteCreatedAt } = await import('../src/utils/xiaohongshuNoteTime.ts');

  assert.equal(getXiaohongshuNoteCreatedAt('6aa22879'), null);
  assert.equal(
    getXiaohongshuNoteCreatedAt('https://www.xiaohongshu.com/explore/not-a-note-id'),
    null,
  );
  assert.equal(
    getXiaohongshuNoteCreatedAt('https://example.com/explore/6aa22879000000002701401c'),
    null,
  );
});

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

test('秋招开放日期筛选支持今天、三天内和一周内', async () => {
  const { filterRecruitmentLinksByOpeningRange, getNextRecruitmentOpeningRange } =
    await import('../src/utils/recruitmentTimeline.ts');
  const links = [
    { title: '今天', url: 'https://today.example', openedAt: '2026-09-10' },
    { title: '三天前', url: 'https://three-days.example', openedAt: '2026-09-07' },
    { title: '一周前', url: 'https://week.example', openedAt: '2026-09-03' },
    { title: '更早', url: 'https://earlier.example', openedAt: '2026-09-02' },
    { title: '未知时间', url: 'https://unknown.example' },
  ];

  assert.deepEqual(
    filterRecruitmentLinksByOpeningRange(links, 0, '2026-09-10').map((link) => link.title),
    ['今天'],
  );
  assert.deepEqual(
    filterRecruitmentLinksByOpeningRange(links, 3, '2026-09-10').map((link) => link.title),
    ['今天', '三天前'],
  );
  assert.deepEqual(
    filterRecruitmentLinksByOpeningRange(links, 7, '2026-09-10').map((link) => link.title),
    ['今天', '三天前', '一周前'],
  );
  assert.equal(getNextRecruitmentOpeningRange(0, 0), null);
  assert.equal(getNextRecruitmentOpeningRange(0, 3), 3);
  assert.equal(getNextRecruitmentOpeningRange(null, 7), 7);
});

test('没有最近七天内开放的秋招公司时返回空时间线', async () => {
  const { buildRecruitmentTimeline } = await import('../src/utils/recruitmentTimeline.ts');

  const items = buildRecruitmentTimeline(
    [{ title: '更早开放', url: 'https://earlier.example', openedAt: '2026-08-31' }],
    '2026-09-08',
  );

  assert.deepEqual(items, []);
});
