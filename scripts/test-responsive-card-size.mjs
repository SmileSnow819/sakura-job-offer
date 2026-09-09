import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getResponsiveCardStageSize,
  getResponsiveCardSize,
  getResponsiveCardVerticalPosition,
} from '../src/utils/responsiveCardSize.ts';

test('矮屏手机缩短卡片，为底部 Dock 保留可操作空间', () => {
  assert.deepEqual(getResponsiveCardSize(432, 667), { width: 248, height: 280 });
});

test('常规手机和桌面继续使用原有卡片尺寸', () => {
  assert.deepEqual(getResponsiveCardSize(432, 800), { width: 248, height: 322 });
  assert.deepEqual(getResponsiveCardSize(1440, 900), { width: 280, height: 390 });
});

test('移动端卡片锚定舞台底边，避免舞台变矮时向下遮住 Dock', () => {
  assert.deepEqual(getResponsiveCardVerticalPosition(432, 280), { bottom: 0, marginTop: 0 });
  assert.deepEqual(getResponsiveCardVerticalPosition(1440, 390), {
    marginTop: -195,
    top: '50%',
  });
});

test('移动端舞台至少容纳完整卡片，内容超高时由页面滚动', () => {
  assert.deepEqual(getResponsiveCardStageSize(432, 280), {
    flex: '0 0 auto',
    minHeight: 280,
  });
  assert.deepEqual(getResponsiveCardStageSize(1440, 390), {
    flex: '1 1 0%',
    minHeight: 0,
  });
});
