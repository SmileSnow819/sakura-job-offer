import assert from 'node:assert/strict';
import test from 'node:test';

import { getInitialLaunchScreen, getNextLaunchScreen } from '../src/utils/launchSequence.ts';

test('首次进入秋招先播放品牌开场', () => {
  assert.equal(
    getInitialLaunchScreen({
      search: '',
      isAutumnPath: true,
      introSeen: false,
      autumnLaunchSeen: false,
    }),
    'intro',
  );
});

test('品牌开场结束后进入尚未播放的秋招开场', () => {
  assert.equal(getNextLaunchScreen({ isAutumnPath: true, autumnLaunchSeen: false }), 'autumn');
});

test('调试参数只播放指定动画', () => {
  assert.equal(
    getInitialLaunchScreen({
      search: '?debug=-1',
      isAutumnPath: true,
      introSeen: true,
      autumnLaunchSeen: true,
    }),
    'intro',
  );
  assert.equal(
    getInitialLaunchScreen({
      search: '?debug=-2',
      isAutumnPath: true,
      introSeen: true,
      autumnLaunchSeen: true,
    }),
    'autumn',
  );
});
