interface IResponsiveCardSize {
  height: number;
  width: number;
}

interface IResponsiveCardVerticalPosition {
  bottom?: number;
  marginTop: number;
  top?: string;
}

interface IResponsiveCardStageSize {
  flex: string;
  minHeight: number;
}

/**
 * 根据视口尺寸计算轮播卡片大小，矮屏手机需要为固定 Dock 留出完整操作空间。
 *
 * @param viewportWidth 视口宽度。
 * @param viewportHeight 视口高度。
 * @returns 当前视口适用的卡片宽高。
 */
export const getResponsiveCardSize = (
  viewportWidth: number,
  viewportHeight: number,
): IResponsiveCardSize => {
  if (viewportWidth <= 768) {
    return {
      width: Math.min(viewportWidth - 56, 248),
      height: viewportHeight < 720 ? 280 : 322,
    };
  }

  return { width: 280, height: viewportHeight <= 820 ? 340 : 390 };
};

/**
 * 计算轮播卡片在舞台中的纵向位置；手机端锚定底边，避免短舞台向 Dock 溢出。
 *
 * @param viewportWidth 视口宽度。
 * @param cardHeight 当前卡片高度。
 * @returns 可直接合并到卡片样式的纵向定位值。
 */
export const getResponsiveCardVerticalPosition = (
  viewportWidth: number,
  cardHeight: number,
): IResponsiveCardVerticalPosition => {
  if (viewportWidth <= 768) return { bottom: 0, marginTop: 0 };
  return { top: '50%', marginTop: -cardHeight / 2 };
};

/**
 * 计算卡片舞台尺寸；手机端不允许舞台被上方内容压缩到小于卡片本身。
 *
 * @param viewportWidth 视口宽度。
 * @param cardHeight 当前卡片高度。
 * @returns 舞台的 flex 与最小高度。
 */
export const getResponsiveCardStageSize = (
  viewportWidth: number,
  cardHeight: number,
): IResponsiveCardStageSize => {
  if (viewportWidth <= 768) return { flex: '0 0 auto', minHeight: cardHeight };
  return { flex: '1 1 0%', minHeight: 0 };
};
