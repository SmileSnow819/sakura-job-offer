import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BACKGROUND_MARQUEE_ROWS,
  ENTRY_ARTWORK,
  MARQUEE_DURATION_SECONDS,
  getAutumnArtwork,
} from '../src/utils/launchArtwork.ts';

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
  assert.equal(BACKGROUND_MARQUEE_ROWS.length, 3);
  assert.ok(BACKGROUND_MARQUEE_ROWS.every(({ words }) => words.length >= 3));
  assert.ok(new Set(BACKGROUND_MARQUEE_ROWS.map(({ direction }) => direction)).size > 1);
});

test('背景跑马灯在五秒内完成一轮', () => {
  assert.equal(MARQUEE_DURATION_SECONDS, 5);
});
