import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BACKGROUND_MARQUEE_ROWS,
  ENTRY_ARTWORK,
  JOURNAL_CARD_REVEAL_ORDER,
  JOURNAL_EXIT_START_SECONDS,
  JOURNAL_INTRO_DURATION_SECONDS,
  JOURNAL_PAGE_REVEAL_SECONDS,
  MARQUEE_DURATION_SECONDS,
  getAutumnArtwork,
} from '../src/utils/launchArtwork.ts';

test('手账开场按上排、主卡、下排的阅读顺序翻开五张卡片', () => {
  assert.deepEqual(JOURNAL_CARD_REVEAL_ORDER, [1, 2, 0, 3, 4]);
});

test('手账开场保留足够时间完成翻页和完整展示', () => {
  assert.equal(JOURNAL_INTRO_DURATION_SECONDS, 4.7);
  assert.equal(JOURNAL_EXIT_START_SECONDS, 4);
  assert.equal(JOURNAL_PAGE_REVEAL_SECONDS, 4.28);
  assert.ok(JOURNAL_PAGE_REVEAL_SECONDS > JOURNAL_EXIT_START_SECONDS);
  assert.ok(JOURNAL_INTRO_DURATION_SECONDS - JOURNAL_EXIT_START_SECONDS >= 0.6);
  assert.ok(JOURNAL_INTRO_DURATION_SECONDS - JOURNAL_PAGE_REVEAL_SECONDS >= 0.4);
});

test('品牌开场为五个入口分别提供插画资源', () => {
  assert.deepEqual(
    ENTRY_ARTWORK.map(({ id }) => id),
    ['autumn', 'internship', 'tools', 'interviews', 'tracker'],
  );
  assert.equal(new Set(ENTRY_ARTWORK.map(({ src }) => src)).size, 5);
});

test('秋招第二幕复用秋招入口的插画资产', () => {
  assert.equal(getAutumnArtwork(), ENTRY_ARTWORK[0]);
});

test('品牌开场保留三条低密度的背景跑马灯', () => {
  assert.deepEqual(BACKGROUND_MARQUEE_ROWS, [
    { direction: 'left', words: ['Dream Job', 'OFFER', '上岸'] },
    { direction: 'right', words: ['OC', '录用意向', 'Sakura'] },
    { direction: 'left', words: ['秋招', '实习', '校园招聘'] },
  ]);
  assert.ok(new Set(BACKGROUND_MARQUEE_ROWS.map(({ direction }) => direction)).size > 1);
});

test('背景跑马灯在五秒内完成一轮', () => {
  assert.equal(MARQUEE_DURATION_SECONDS, 5);
});
