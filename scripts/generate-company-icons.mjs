import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const OUTPUT_DIR = resolve('public/assets/company-icons');
const MANIFEST_PATH = resolve('src/companyIcons.ts');
const FALLBACK_SOURCE = resolve('public/sakura-offer-icon.svg');
const FETCH_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const CONCURRENCY = 12;
const FALLBACK_FILENAME = 'sakura-offer-icon.webp';
const retryFallback = process.argv.includes('--retry-fallback');

const normalizeCompanyName = (name) =>
  name
    .replace(/(?:2027|2026|校园招聘|校招|招聘官网|招聘|实习生招聘|实习生|秋季|秋招)/gi, '')
    .replace(/[\s/·-]+/g, '')
    .toLocaleLowerCase();

const fetchBuffer = async (url, accept) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { accept, 'user-agent': 'Mozilla/5.0 SakuraJobOfferIconBot/1.0' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error('invalid image size');
    return { buffer, finalUrl: response.url };
  } finally {
    clearTimeout(timer);
  }
};

const iconCandidates = (html, pageUrl) => {
  const candidates = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/rel\s*=\s*["'][^"']*(?:icon|apple-touch-icon)/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href || href.startsWith('data:')) continue;
    try {
      candidates.push(new URL(href.replace(/&amp;/g, '&'), pageUrl).href);
    } catch {
      // 忽略页面中的非法图标 URL，继续尝试标准 favicon 路径。
    }
  }
  const origin = new URL(pageUrl).origin;
  candidates.push(`${origin}/favicon.ico`, `${origin}/favicon.png`);
  return [...new Set(candidates)];
};

const fetchIcon = async (url) => {
  let pageUrl = url;
  let candidates = [];
  try {
    const page = await fetchBuffer(url, 'text/html,application/xhtml+xml');
    pageUrl = page.finalUrl;
    candidates = iconCandidates(page.buffer.toString('utf8'), pageUrl);
  } catch {
    candidates = iconCandidates('', pageUrl);
  }
  // 仅生成阶段使用第三方补齐难以直接抓取的 SPA / 反爬站点；线上页面不会请求该服务。
  candidates.push(`https://icon.horse/icon/${new URL(pageUrl).hostname}`);
  for (const candidate of candidates) {
    try {
      const image = await fetchBuffer(
        candidate,
        'image/avif,image/webp,image/png,image/*,*/*;q=0.5',
      );
      const output = await sharp(image.buffer, { animated: false })
        .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 82, alphaQuality: 90 })
        .toBuffer();
      const metadata = await sharp(output).metadata();
      if (metadata.width === 64 && metadata.height === 64) return output;
    } catch {
      // 当前候选无效时继续尝试同站点的下一个候选。
    }
  }
  return null;
};

const runPool = async (entries, callback) => {
  const results = Array.from({ length: entries.length });
  let index = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, entries.length) }, async () => {
    while (index < entries.length) {
      const current = index++;
      results[current] = await callback(entries[current]);
    }
  });
  await Promise.all(workers);
  return results;
};

const bookmarkData = JSON.parse(await readFile(resolve('src/bookmarks.json'), 'utf8'));
const links = bookmarkData.categories.flatMap((category) => category.links);
let previousManifest = {};
if (retryFallback) {
  const source = await readFile(MANIFEST_PATH, 'utf8');
  previousManifest = Object.fromEntries(
    [...source.matchAll(/^\s*(['"])(.*?)\1:\s*(['"])(.*?)\3,?$/gm)].map((match) => [
      match[2],
      match[4],
    ]),
  );
} else {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
}
await mkdir(OUTPUT_DIR, { recursive: true });
const fallback = await sharp(FALLBACK_SOURCE).resize(64, 64).webp({ quality: 88 }).toBuffer();
await writeFile(resolve(OUTPUT_DIR, FALLBACK_FILENAME), fallback);

const selectedLinks = retryFallback
  ? links.filter(
      (link) => previousManifest[`name:${normalizeCompanyName(link.title)}`] === FALLBACK_FILENAME,
    )
  : links;

const results = await runPool(selectedLinks, async (link) => {
  const icon = await fetchIcon(link.url);
  const filename = icon
    ? `${createHash('sha1').update(icon).digest('hex').slice(0, 12)}.webp`
    : FALLBACK_FILENAME;
  if (icon) await writeFile(resolve(OUTPUT_DIR, filename), icon);
  return { link, filename: icon ? filename : 'sakura-offer-icon.webp', cached: Boolean(icon) };
});

const manifest = { ...previousManifest };
const hostCounts = new Map();
for (const { link } of results) {
  try {
    const host = new URL(link.url).hostname.toLocaleLowerCase();
    hostCounts.set(host, (hostCounts.get(host) ?? 0) + 1);
  } catch {
    // 非网页入口只使用名称映射。
  }
}
for (const { link, filename } of results) {
  manifest[`name:${normalizeCompanyName(link.title)}`] = filename;
  try {
    const host = new URL(link.url).hostname.toLocaleLowerCase();
    // 只有域名唯一时才允许按域名回退，避免飞书、Moka 等公共平台串用公司图标。
    if (hostCounts.get(host) === 1) manifest[`host:${host}`] = filename;
  } catch {
    // 非网页入口只使用名称映射。
  }
}
await writeFile(
  MANIFEST_PATH,
  `// 此文件由 pnpm icons:generate 生成，请勿手工编辑。\nexport const COMPANY_ICONS = ${JSON.stringify(manifest, null, 2)} as const;\n`,
);
const cached = results.reduce((sum, result) => sum + (result.cached ? 1 : 0), 0);
console.log(
  JSON.stringify(
    {
      mode: retryFallback ? 'retry-fallback' : 'full',
      attempted: results.length,
      cached,
      fallback: results.length - cached,
      output: OUTPUT_DIR,
    },
    null,
    2,
  ),
);
