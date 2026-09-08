/**
 * 解析启动动画的调试参数，避免不同动画共用一个调试开关。
 *
 * @param search 当前页面的查询字符串
 * @returns `initial` 表示品牌开场，`autumn` 表示秋招开场，`sequence` 表示依次重播两幕
 */
export function getIntroReplayMode(search: string): 'initial' | 'autumn' | 'sequence' | null {
  const debug = new URLSearchParams(search).get('debug');
  if (debug === '-1') return 'initial';
  if (debug === '-2') return 'autumn';
  if (debug === '-3') return 'sequence';
  return null;
}
