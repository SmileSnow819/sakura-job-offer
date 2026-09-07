import assert from 'node:assert/strict';
import test from 'node:test';

import { getDockScale } from '../src/utils/dockMagnification.ts';

test('指针位于图标中心时放大到 Dock 峰值', () => {
  assert.equal(getDockScale(100, 100, 44), 1.65);
});

test('图标随指针距离增加逐级恢复原尺寸', () => {
  assert.equal(getDockScale(100, 152, 44), 1.35);
  assert.equal(getDockScale(100, 204, 44), 1.08);
  assert.equal(getDockScale(100, 260, 44), 1);
});

test('没有指针位置时图标保持原尺寸', () => {
  assert.equal(getDockScale(null, 100, 44), 1);
});
