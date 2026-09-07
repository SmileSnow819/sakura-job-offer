const DOCK_ICON_GAP = 8;

/**
 * 根据指针与图标中心的距离计算 macOS Dock 风格的连续缩放。
 *
 * @param pointerX 指针在视口中的横坐标；未悬停时传入 null。
 * @param iconCenterX 图标中心在视口中的横坐标。
 * @param iconSize 图标未放大时的边长。
 * @returns 1–1.65 之间的缩放值。
 */
export const getDockScale = (
  pointerX: number | null,
  iconCenterX: number,
  iconSize: number,
): number => {
  if (pointerX === null) return 1;

  const distance = Math.abs(pointerX - iconCenterX);
  const spacing = iconSize + DOCK_ICON_GAP;
  const stops = [
    { distance: 0, scale: 1.65 },
    { distance: spacing, scale: 1.35 },
    { distance: spacing * 2, scale: 1.08 },
    { distance: spacing * 3, scale: 1 },
  ];

  if (distance >= stops[3].distance) return 1;

  const upperIndex = stops.findIndex((stop) => distance <= stop.distance);
  const upper = stops[upperIndex];
  const lower = stops[upperIndex - 1] ?? stops[0];
  if (upper.distance === lower.distance) return upper.scale;

  const progress = (distance - lower.distance) / (upper.distance - lower.distance);
  return lower.scale + (upper.scale - lower.scale) * progress;
};
