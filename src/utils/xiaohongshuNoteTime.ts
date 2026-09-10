const XIAOHONGSHU_HOST = 'xiaohongshu.com';
const NOTE_ID_PATTERN = /^[0-9a-f]{24}$/i;
const CHINA_TIME_ZONE = 'Asia/Shanghai';

export interface IXiaohongshuNoteCreatedAt {
  date: string;
  dateTime: string;
  noteId: string;
}

/** 从小红书笔记地址中提取 24 位笔记 ID。 */
const getNoteId = (input: string): string | null => {
  const value = input.trim();
  if (NOTE_ID_PATTERN.test(value)) return value.toLowerCase();

  try {
    const url = new URL(value);
    const isXiaohongshu =
      url.hostname === XIAOHONGSHU_HOST || url.hostname.endsWith(`.${XIAOHONGSHU_HOST}`);
    const segments = url.pathname.split('/').filter(Boolean);
    const noteId = segments.at(-1);
    if (
      !isXiaohongshu ||
      segments.at(-2) !== 'explore' ||
      !noteId ||
      !NOTE_ID_PATTERN.test(noteId)
    ) {
      return null;
    }

    return noteId.toLowerCase();
  } catch {
    return null;
  }
};

/** 将日期格式化为中国时区的固定日期和时间文本。 */
const formatChinaDateTime = (date: Date): Pick<IXiaohongshuNoteCreatedAt, 'date' | 'dateTime'> => {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      second: '2-digit',
      timeZone: CHINA_TIME_ZONE,
      year: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  const dateKey = `${values.year}-${values.month}-${values.day}`;

  return { date: dateKey, dateTime: `${dateKey} ${values.hour}:${values.minute}:${values.second}` };
};

/**
 * 从小红书笔记 ID 的前八位时间戳还原原帖创建时间。
 *
 * 小红书页面的“编辑于”反映最后编辑时间，校招开放日期应以原帖创建时刻为准；
 * 本函数仅负责解析时间，不替代对官方账号和公告内容的人工核验。
 *
 * @param input 小红书 `/explore/<笔记 ID>` 原帖 URL，或 24 位笔记 ID。
 * @returns 中国时区的日期、完整时间和标准化笔记 ID；输入不合法时返回 `null`。
 */
export const getXiaohongshuNoteCreatedAt = (input: string): IXiaohongshuNoteCreatedAt | null => {
  const noteId = getNoteId(input);
  if (!noteId) return null;

  const timestampSeconds = Number.parseInt(noteId.slice(0, 8), 16);
  const createdAt = new Date(timestampSeconds * 1_000);
  if (Number.isNaN(createdAt.getTime())) return null;

  return { noteId, ...formatChinaDateTime(createdAt) };
};
