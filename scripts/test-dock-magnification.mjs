import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDockItemWidth,
  getDockScale,
  getDockTooltipBottom,
} from '../src/utils/dockMagnification.ts';

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

test('放大图标为自身额外占据横向空间，避免覆盖相邻图标', () => {
  assert.equal(getDockItemWidth(44, 1), 44);
  assert.equal(getDockItemWidth(44, 1.65), 72.6);
});

test('提示气泡随放大图标上移，并保留指定的图标间距', () => {
  assert.equal(getDockTooltipBottom(44, 1, 22, 8), 44);
  assert.ok(Math.abs(getDockTooltipBottom(44, 1.65, 22, 8) - 86.9) < 0.001);
});
