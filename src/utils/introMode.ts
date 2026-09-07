/**
 * 解析启动动画的调试参数，避免不同动画共用一个调试开关。
 *
 * @param search 当前页面的查询字符串
 * @returns `initial` 表示重播品牌开场，`autumn` 表示重播秋招开场，未知值返回 null
 */
export function getIntroReplayMode(search: string): 'initial' | 'autumn' | null {
  const debug = new URLSearchParams(search).get('debug');
  if (debug === '-1') return 'initial';
  if (debug === '-2') return 'autumn';
  return null;
}
