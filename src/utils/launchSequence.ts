import { getIntroReplayMode } from './introMode.ts';

export type TLaunchScreen = 'intro' | 'autumn' | 'none';

interface IInitialLaunchScreenOptions {
  search: string;
  isAutumnPath: boolean;
  introSeen: boolean;
  autumnLaunchSeen: boolean;
}

interface INextLaunchScreenOptions {
  search: string;
  isAutumnPath: boolean;
  autumnLaunchSeen: boolean;
}

/**
 * 根据调试参数和已播放状态确定进入页面前应播放的第一段动画。
 *
 * @param options 当前 URL、页面位置和本地已播放状态
 * @returns 应先展示的开场，或直接进入页面
 */
export function getInitialLaunchScreen({
  search,
  isAutumnPath,
  introSeen,
  autumnLaunchSeen,
}: IInitialLaunchScreenOptions): TLaunchScreen {
  const debugMode = getIntroReplayMode(search);
  if (debugMode === 'initial' || debugMode === 'sequence') return 'intro';
  if (debugMode === 'autumn') return 'autumn';
  if (!introSeen) return 'intro';
  if (isAutumnPath && !autumnLaunchSeen) return 'autumn';
  return 'none';
}

/**
 * 品牌开场结束后，在首次访问秋招页或完整调试模式下衔接秋招开场。
 *
 * @param options 当前 URL、页面位置和秋招开场已播放状态
 * @returns 下一段开场，或直接展示页面
 */
export function getNextLaunchScreen({
  search,
  isAutumnPath,
  autumnLaunchSeen,
}: INextLaunchScreenOptions): TLaunchScreen {
  const debugMode = getIntroReplayMode(search);
  if (debugMode === 'sequence') return 'autumn';
  if (debugMode) return 'none';
  if (isAutumnPath && !autumnLaunchSeen) return 'autumn';
  return 'none';
}
