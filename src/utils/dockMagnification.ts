const DOCK_ICON_GAP = 8;

/**
 * 为放大的图标预留横向布局空间，避免 transform 仅改变视觉尺寸而覆盖相邻项目。
 *
 * @param iconSize 图标未放大时的边长。
 * @param scale 当前图标缩放倍数。
 * @returns 图标项目在 Dock 中应占据的宽度。
 */
export const getDockItemWidth = (iconSize: number, scale: number): number => iconSize * scale;

/**
 * 计算 Dock 提示气泡的底部位置，让它始终贴近放大后图标的顶部。
 *
 * @param iconSize 图标未放大时的边长。
 * @param scale 当前图标缩放倍数。
 * @param verticalLift 图标每增加一倍缩放时向上移动的距离。
 * @param gap 提示尾巴与图标之间保留的视觉间距。
 * @returns 相对图标项目底部的提示气泡位置。
 */
export const getDockTooltipBottom = (
  iconSize: number,
  scale: number,
  verticalLift: number,
  gap = 0,
): number => iconSize - 8 + (scale - 1) * (iconSize + verticalLift) + gap;

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
