export interface ITrackerMotion {
  enterDuration: number;
  enterOffset: number;
  enterStagger: number;
  contentDuration: number;
  contentOffset: number;
  itemDuration: number;
  itemOffset: number;
  itemStagger: number;
}

export const trackerMotion = (reduced: boolean): ITrackerMotion =>
  reduced
    ? {
        enterDuration: 0,
        enterOffset: 0,
        enterStagger: 0,
        contentDuration: 0,
        contentOffset: 0,
        itemDuration: 0,
        itemOffset: 0,
        itemStagger: 0,
      }
    : {
        enterDuration: 0.56,
        enterOffset: 24,
        enterStagger: 0.075,
        contentDuration: 0.28,
        contentOffset: 10,
        itemDuration: 0.42,
        itemOffset: 14,
        itemStagger: 0.045,
      };

export interface ITrackerTimelineMotion {
  expandDuration: number;
  stageDuration: number;
  stageOffset: number;
  stageStagger: number;
}

/** 提供表格流程展开与阶段错峰进入的统一节奏。 */
export const trackerTimelineMotion = (reduced: boolean): ITrackerTimelineMotion =>
  reduced
    ? { expandDuration: 0, stageDuration: 0, stageOffset: 0, stageStagger: 0 }
    : { expandDuration: 0.46, stageDuration: 0.34, stageOffset: 12, stageStagger: 0.045 };
