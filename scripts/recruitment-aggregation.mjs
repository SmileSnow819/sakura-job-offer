import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

const BOOKMARKS_PATH = new URL('../src/bookmarks.json', import.meta.url);
const NOWCODER_URL = 'https://www.nowcoder.com/np-api/u/school-schedule/list-card';
const execFileAsync = promisify(execFile);
const FEISHU_URL =
  'https://my.feishu.cn/wiki/TfJkwz7yIil5qvktSKOcBJj8nFd?table=tblzpVqcTKlokUA6&view=vewG7JtQCU';
const FEISHU_BASE_TOKEN = 'IH8ObhOTMaqWGNslZArcMGsInNX';
const FEISHU_TABLE_ID = 'tblzpVqcTKlokUA6';
const FEISHU_VIEW_ID = 'vewG7JtQCU';

const normalizeText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeUrl = (value) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    for (const key of [
      'recommendCode',
      'spread',
      'shareId',
      'shareSource',
      'channel',
      'source',
      'ref',
      'qr',
      'memory',
      'silence',
    ]) {
      url.searchParams.delete(key);
    }
    url.hash = '';
    return url.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return '';
  }
};

const isDirectRecruitmentUrl = (url) => url && !/mp\.weixin\.qq\.com|公众号|weixin\.com/i.test(url);

/** 将平台原始记录转换为统一候选格式。 */
export const normalizeCandidate = (raw = {}) => {
  const candidate = {
    source: normalizeText(raw.source),
    company: normalizeText(raw.company),
    title: normalizeText(raw.title),
    recruitmentUrl: normalizeUrl(raw.recruitmentUrl),
    openedAt: normalizeText(raw.openedAt) || undefined,
    sourceUrl: normalizeUrl(raw.sourceUrl),
    reason: normalizeText(raw.reason),
  };

  if (!candidate.company) {
    return { ...candidate, valid: false, reason: candidate.reason || '缺少公司名' };
  }
  if (!candidate.recruitmentUrl) {
    return { ...candidate, valid: false, reason: candidate.reason || '缺少招聘入口' };
  }
  if (!isDirectRecruitmentUrl(candidate.recruitmentUrl)) {
    return {
      ...candidate,
      valid: false,
      reason: candidate.reason || '链接是公告/公众号，不是直接招聘入口',
    };
  }
  return { ...candidate, valid: true };
};

const companyKey = (value) =>
  normalizeText(value)
    .replace(/招聘官网|校园招聘|招聘/g, '')
    .toLowerCase();

/** 比较候选记录与现有秋招书签，生成新增、补全、重复和跳过报告。 */
export const diffCandidates = (candidates, bookmarks) => {
  const validCandidates = [];
  const skipped = [];
  const byUrl = new Map();
  const byCompany = new Map();

  for (const raw of candidates) {
    const candidate = raw?.valid === undefined ? normalizeCandidate(raw) : raw;
    if (!candidate.valid) {
      skipped.push(candidate);
      continue;
    }
    const key = candidate.recruitmentUrl || `company:${companyKey(candidate.company)}`;
    const existing = byUrl.get(key) || byCompany.get(companyKey(candidate.company));
    if (existing) {
      existing.sources = [...new Set([...existing.sources, candidate.source])];
      existing.sourceRecords = [...(existing.sourceRecords || []), candidate];
      continue;
    }
    const merged = { ...candidate, sources: [candidate.source], sourceRecords: [candidate] };
    byUrl.set(candidate.recruitmentUrl, merged);
    byCompany.set(companyKey(candidate.company), merged);
    validCandidates.push(merged);
  }

  const bookmarkByUrl = new Map(
    bookmarks.map((bookmark) => [normalizeUrl(bookmark.url), bookmark]),
  );
  const bookmarkByCompany = new Map(
    bookmarks.map((bookmark) => [companyKey(bookmark.title), bookmark]),
  );
  const additions = [];
  const enrichments = [];
  const duplicates = [];

  for (const candidate of validCandidates) {
    const existing =
      bookmarkByUrl.get(candidate.recruitmentUrl) ||
      bookmarkByCompany.get(companyKey(candidate.company));
    if (!existing) {
      additions.push(candidate);
      continue;
    }
    if (candidate.openedAt && !existing.openedAt) {
      enrichments.push({ ...candidate, existing });
    }
    if (candidate.sources.length > 1) duplicates.push(candidate);
  }

  return { additions, enrichments, duplicates, skipped };
};

const requestJson = async (url, options = {}, fetchImpl = fetch) => {
  const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return response.json();
};

/** 获取牛客校招日程并转换为统一候选记录。 */
export const fetchNowcoderCandidates = async ({
  fetchImpl = fetch,
  page = 1,
  pageSize = 100,
} = {}) => {
  const params = new URLSearchParams({
    query: '',
    propertyId: '',
    page: String(page),
    pageSize: String(pageSize),
    tab: '3',
  });
  const payload = await requestJson(
    `${NOWCODER_URL}?_=${Date.now()}`,
    {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body: params,
    },
    fetchImpl,
  );
  if (payload.code !== 0) throw new Error(`Nowcoder API error: ${payload.msg || payload.code}`);
  return (payload.data?.datas || []).map((item) =>
    normalizeCandidate({
      source: 'nowcoder',
      company: item.name,
      title: `${item.name} ${item.batchName || '校园招聘'}`,
      recruitmentUrl: item.customWangshenLink,
      openedAt: item.wangshenBeginDate
        ? new Date(item.wangshenBeginDate).toISOString().slice(0, 10)
        : undefined,
      sourceUrl: item.sourceInformation,
    }),
  );
};

/** 通过官方 lark-cli 读取飞书多维表格视图并转换为统一候选记录。 */
export const fetchFeishuCandidates = async ({ execFileImpl = execFileAsync, limit = 200 } = {}) => {
  const { stdout, stderr } = await execFileImpl('lark-cli', [
    'base',
    '+record-list',
    '--base-token',
    FEISHU_BASE_TOKEN,
    '--table-id',
    FEISHU_TABLE_ID,
    '--view-id',
    FEISHU_VIEW_ID,
    '--limit',
    String(limit),
    '--format',
    'json',
    '--as',
    'user',
  ]);
  if (stderr?.trim()) console.error(`lark-cli: ${stderr.trim()}`);
  const payload = JSON.parse(stdout);
  if (!payload.ok)
    throw new Error(`Feishu API error: ${payload.error?.message || 'unknown error'}`);
  return (payload.data?.data || []).map((row) =>
    normalizeCandidate({
      source: 'feishu',
      company: row[0],
      title: row[0],
      recruitmentUrl: row[5],
      sourceUrl: FEISHU_URL,
    }),
  );
};

/** 读取当前仓库中的秋招书签。 */
export const loadAutumnBookmarks = async () => {
  const data = JSON.parse(await readFile(BOOKMARKS_PATH, 'utf8'));
  return data.categories.find((category) => category.id === 'autumn')?.links || [];
};

/** 将可确认的候选写入秋招书签，并补齐已有书签的开放日期。 */
export const applyReportToBookmarks = (data, report) => {
  const categories = data.categories || [];
  const autumn = categories.find((category) => category.id === 'autumn');
  if (!autumn) throw new Error('bookmarks.json 缺少 autumn 分类');
  const links = autumn.links || [];
  const byUrl = new Map(links.map((link) => [normalizeUrl(link.url), link]));
  const byCompany = new Map(links.map((link) => [companyKey(link.title), link]));

  for (const candidate of report.additions) {
    const link = {
      title: `${candidate.company}校园招聘`,
      url: candidate.recruitmentUrl,
      ...(candidate.openedAt ? { openedAt: candidate.openedAt } : {}),
    };
    links.push(link);
    byUrl.set(normalizeUrl(link.url), link);
    byCompany.set(companyKey(link.title), link);
  }
  for (const candidate of report.enrichments) {
    const existing =
      byUrl.get(normalizeUrl(candidate.existing.url)) ||
      byCompany.get(companyKey(candidate.existing.title));
    if (existing && candidate.openedAt && !existing.openedAt)
      existing.openedAt = candidate.openedAt;
  }
  return data;
};

const reportLines = (report) => {
  const lines = [
    `- 来源状态：牛客 ${report.sources.nowcoder}，飞书 ${report.sources.feishu}，小红书 ${report.sources.xiaohongshu}。`,
    `- 调用工具：牛客校招 API；lark-cli base +record-list（飞书视图）；Spider_XHS 小红书 runner。`,
    `- 返回候选：牛客 ${report.sourceCounts?.nowcoder ?? '未知'}，飞书 ${report.sourceCounts?.feishu ?? '未知'}，小红书 ${report.sourceCounts?.xiaohongshu ?? '未知'}。`,
    `- 结果：新增 ${report.additions.length}，补充开放日期 ${report.enrichments.length}，多来源重复 ${report.duplicates.length}，待人工确认 ${report.skipped.length}。`,
  ];
  if (report.additions.length) {
    lines.push('- 自动加入书签：');
    lines.push(
      ...report.additions.map(
        (item) => `  - ${item.company}（${item.source}）：${item.recruitmentUrl}`,
      ),
    );
  }
  if (report.errors.length) {
    lines.push('- 运行疑问/错误：');
    lines.push(...report.errors.map((item) => `  - ${item.source}：${item.message}`));
  }
  if (report.skipped.length) {
    lines.push('- 待人工确认（未自动写入）：');
    lines.push(
      ...report.skipped.map(
        (item) =>
          `  - ${item.company || item.title || '未命名'}（${item.source || '未知来源'}）：${item.reason || '未知原因'}`,
      ),
    );
  }
  return lines;
};

/** 将每轮采集摘要追加到仓库内的日记，便于换电脑后追溯。 */
export const appendRunLog = async (report, { logPath, timestamp = new Date().toISOString() }) => {
  await mkdir(new URL('.', logPath), { recursive: true });
  await appendFile(
    logPath,
    `\n## 聚合运行 ${timestamp}\n\n${reportLines(report).join('\n')}\n`,
    'utf8',
  );
};

/** 将现有 Spider_XHS runner 返回的官方笔记转换为候选记录。 */
export const collectXiaohongshuCandidates = async ({ runner } = {}) => {
  if (!runner) throw new Error('未配置 Spider_XHS runner');
  const notes = await runner();
  return (notes || []).map((note) =>
    normalizeCandidate({
      source: 'xiaohongshu',
      company: note.company || note.title,
      title: note.title,
      recruitmentUrl: note.recruitmentUrl,
      openedAt: note.openedAt,
      sourceUrl: note.sourceUrl,
      reason: note.reason,
    }),
  );
};

/** 聚合三个来源并返回可审阅的差异报告，不修改任何仓库文件。 */
export const runAggregation = async ({
  fetchImpl = fetch,
  xiaohongshuRunner,
  nowcoderPageSize = 100,
  feishuLimit = 100,
} = {}) => {
  const sourceResults = await Promise.allSettled([
    fetchNowcoderCandidates({ fetchImpl, pageSize: nowcoderPageSize }),
    fetchFeishuCandidates({ limit: feishuLimit }),
    collectXiaohongshuCandidates({ runner: xiaohongshuRunner }),
  ]);
  const candidates = [];
  const errors = [];
  for (const [index, result] of sourceResults.entries()) {
    const source = ['nowcoder', 'feishu', 'xiaohongshu'][index];
    if (result.status === 'fulfilled') candidates.push(...result.value);
    else errors.push({ source, message: result.reason?.message || String(result.reason) });
  }
  const bookmarks = await loadAutumnBookmarks();
  return {
    generatedAt: new Date().toISOString(),
    sources: {
      nowcoder: sourceResults[0].status,
      feishu: sourceResults[1].status,
      xiaohongshu: sourceResults[2].status,
    },
    sourceCounts: Object.fromEntries(
      sourceResults.map((result, index) => [
        ['nowcoder', 'feishu', 'xiaohongshu'][index],
        result.status === 'fulfilled' ? result.value.length : 0,
      ]),
    ),
    errors,
    ...diffCandidates(candidates, bookmarks),
  };
};

const isMain = process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url;
if (isMain) {
  try {
    const xiaohongshuRunner = process.env.XIAOHONGSHU_CANDIDATES_FILE
      ? async () => JSON.parse(await readFile(process.env.XIAOHONGSHU_CANDIDATES_FILE, 'utf8'))
      : undefined;
    const report = await runAggregation({ xiaohongshuRunner });
    if (process.argv.includes('--write')) {
      const data = JSON.parse(await readFile(BOOKMARKS_PATH, 'utf8'));
      applyReportToBookmarks(data, report);
      await writeFile(BOOKMARKS_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(
        new Date(),
      );
      const logPath = new URL(`../logs/${date}.md`, import.meta.url);
      await appendRunLog(report, { logPath, timestamp: new Date().toISOString() });
      report.written = { bookmarks: BOOKMARKS_PATH.pathname, log: logPath.pathname };
    }
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.errors.length ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
