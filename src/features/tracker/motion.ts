export interface ITrackerMotion {
  enterDuration: number;
  enterOffset: number;
  enterStagger: number;
  contentDuration: number;
  contentOffset: number;
}

export const trackerMotion = (reduced: boolean): ITrackerMotion =>
  reduced
    ? {
        enterDuration: 0,
        enterOffset: 0,
        enterStagger: 0,
        contentDuration: 0,
        contentOffset: 0,
      }
    : {
        enterDuration: 0.42,
        enterOffset: 18,
        enterStagger: 0.055,
        contentDuration: 0.2,
        contentOffset: 8,
      };
