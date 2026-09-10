import type { ILink } from '../types/bookmark';

interface IParsedDateKey {
  day: number;
  dayNumber: number;
  month: number;
}

export interface IRecruitmentTimelineItem {
  dateLabel: string;
  link: ILink;
  openedAt: string;
}

export type TRecruitmentOpeningRange = 0 | 3 | 7 | null;

/** “最近开放”包含今天以及此前七个自然日。 */
const RECENT_OPENING_DAY_LIMIT = 7;

/** 将本地日期转换为不受时区偏移影响的 YYYY-MM-DD。 */
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** 校验秋招开放日期，并转换为可安全比较的自然日序号。 */
const parseDateKey = (value: string): IParsedDateKey | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, dayNumber: timestamp / 86_400_000, month };
};

/** 切换秋招日期筛选；再次点击当前筛选时回到全部公司。 */
export const getNextRecruitmentOpeningRange = (
  current: TRecruitmentOpeningRange,
  next: Exclude<TRecruitmentOpeningRange, null>,
): TRecruitmentOpeningRange => (current === next ? null : next);

/**
 * 按招聘正式开放日筛选秋招公司；没有记录开放时间的公司不能归入任意时间范围。
 *
 * @param links 秋招分类中的公司链接。
 * @param dayLimit 包含今天在内、向前回溯的自然日数；`0` 仅表示今天。
 * @param todayKey 用于比较的本地日期，默认取用户当天。
 * @returns 保持原有顺序的符合时间范围的公司链接。
 */
export const filterRecruitmentLinksByOpeningRange = (
  links: ILink[],
  dayLimit: number,
  todayKey = getLocalDateKey(new Date()),
): ILink[] => {
  const today = parseDateKey(todayKey);
  if (!today || dayLimit < 0) return [];

  return links.filter((link) => {
    if (!link.openedAt) return false;
    const openedAt = parseDateKey(link.openedAt);
    if (!openedAt || openedAt.dayNumber > today.dayNumber) return false;

    return today.dayNumber - openedAt.dayNumber <= dayLimit;
  });
};

/**
 * 生成秋招开放时间线；未知、无效、尚未开放或超过最近七天的记录不会展示。
 *
 * @param links 秋招分类中的公司链接。
 * @param todayKey 用于生成相对日期标签的本地日期，默认取用户当天。
 * @returns 按开放日期从新到旧排列的时间线节点。
 */
export const buildRecruitmentTimeline = (
  links: ILink[],
  todayKey = getLocalDateKey(new Date()),
): IRecruitmentTimelineItem[] => {
  const today = parseDateKey(todayKey);
  if (!today) return [];

  return links
    .flatMap((link) => {
      if (!link.openedAt) return [];
      const openedAt = parseDateKey(link.openedAt);
      if (!openedAt || openedAt.dayNumber > today.dayNumber) return [];

      const dayDifference = today.dayNumber - openedAt.dayNumber;
      if (dayDifference > RECENT_OPENING_DAY_LIMIT) return [];

      const dateLabel =
        dayDifference === 0
          ? '今天'
          : dayDifference === 1
            ? '昨天'
            : `${openedAt.month}月${openedAt.day}日`;
      return [{ dateLabel, link, openedAt: link.openedAt, dayNumber: openedAt.dayNumber }];
    })
    .sort((left, right) => right.dayNumber - left.dayNumber)
    .map(({ dateLabel, link, openedAt }) => ({ dateLabel, link, openedAt }));
};
