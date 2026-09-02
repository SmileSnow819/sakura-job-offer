import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_INPUT = 'data/autumn-watchlist.json';
const FETCH_TIMEOUT_MS = 12_000;
const MAX_BODY_BYTES = 768 * 1024;
const CONCURRENCY = 5;

const args = new Set(process.argv.slice(2));
const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const companiesArg = process.argv.find((arg) => arg.startsWith('--companies='));
const inputPath = resolve(inputArg?.slice('--input='.length) || DEFAULT_INPUT);
const limit = Number(limitArg?.slice('--limit='.length) || Number.POSITIVE_INFINITY);
const companies = new Set(
  companiesArg
    ?.slice('--companies='.length)
    .split(',')
    .filter(Boolean) ?? [],
);
const shouldWrite = args.has('--write');

const decodeHtml = (value) => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#(?:x27|39);/gi, "'")
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getPageText = (html) => decodeHtml(
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' '),
);

const fetchPage = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'SakuraJobOfferWatchlist/1.0',
      },
    });
    const buffer = Buffer.from(await response.arrayBuffer()).subarray(0, MAX_BODY_BYTES);
    return {
      status: response.status,
      finalUrl: response.url,
      text: buffer.toString('utf8'),
    };
  } finally {
    clearTimeout(timer);
  }
};

const verifyEntry = async (entry, checkedAt) => {
  try {
    const page = await fetchPage(entry.officialUrl);
    const text = getPageText(page.text);
    const contentHash = createHash('sha256').update(text).digest('hex');
    const hasYear = /(?:2027\s*(?:届|年)?|27届)/.test(text);
    const hasCampusRecruiting = /(?:校园招聘|秋招|应届生招聘|应届生)/.test(text);
    const keywordMatched = hasYear && hasCampusRecruiting;
    const matchAt = keywordMatched
      ? text.search(/(?:2027\s*(?:届|年)?|27届).{0,160}(?:校园招聘|秋招|应届生招聘|应届生)|(?:校园招聘|秋招|应届生招聘|应届生).{0,160}(?:2027\s*(?:届|年)?|27届)/)
      : -1;
    const excerpt = matchAt >= 0 ? text.slice(matchAt, matchAt + 260) : null;

    return {
      company: entry.company,
      officialUrl: entry.officialUrl,
      finalUrl: page.finalUrl,
      status: page.status,
      changed: entry.lastContentHash !== contentHash,
      keywordMatched,
      excerpt,
      checkedAt,
      contentHash,
      error: null,
    };
  } catch (error) {
    return {
      company: entry.company,
      officialUrl: entry.officialUrl,
      finalUrl: null,
      status: null,
      changed: false,
      keywordMatched: false,
      excerpt: null,
      checkedAt,
      contentHash: entry.lastContentHash ?? null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const runPool = async (entries, callback) => {
  const results = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, entries.length) }, async () => {
    while (index < entries.length) {
      const entry = entries[index++];
      results.push(await callback(entry));
    }
  });
  await Promise.all(workers);
  return results;
};

const data = JSON.parse(await readFile(inputPath, 'utf8'));
const eligible = data.pending
  .filter((entry) => entry.status === 'pending' && entry.officialUrl && (!companies.size || companies.has(entry.company)))
  .slice(0, Number.isFinite(limit) ? limit : undefined);
const checkedAt = new Date().toISOString();
const results = await runPool(eligible, (entry) => verifyEntry(entry, checkedAt));

for (const result of results) {
  const entry = data.pending.find((candidate) => candidate.company === result.company);
  if (!entry) continue;
  entry.lastCheckedAt = result.checkedAt;
  entry.lastContentHash = result.contentHash;
  entry.lastHttpStatus = result.status;
  entry.lastVerification = {
    finalUrl: result.finalUrl,
    changed: result.changed,
    keywordMatched: result.keywordMatched,
    excerpt: result.excerpt,
    error: result.error,
  };
}

if (shouldWrite && results.length > 0) {
  await writeFile(inputPath, `${JSON.stringify(data, null, 2)}\n`);
}

const report = {
  checkedAt,
  input: inputPath,
  eligible: eligible.length,
  matched: results.filter((result) => result.keywordMatched).length,
  changed: results.filter((result) => result.changed).length,
  failed: results.filter((result) => result.error).length,
  review: results.filter((result) => result.keywordMatched || result.changed || result.error),
};

console.log(JSON.stringify(report, null, 2));
