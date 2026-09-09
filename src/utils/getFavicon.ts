import { COMPANY_ICONS } from '../companyIcons.ts';

const CONFIGURED_BASE_URL = import.meta.env?.BASE_URL ?? '/sakura-job-offer/';
// GitHub Pages 使用仓库子路径，Edge Pages / 自定义域名通常部署在根路径。
const BASE_URL =
  typeof window === 'undefined' || window.location.pathname.startsWith(CONFIGURED_BASE_URL)
    ? CONFIGURED_BASE_URL
    : '/';
const FALLBACK_ICON = `${BASE_URL}assets/company-icons/sakura-offer-icon.webp`;

const normalizeCompanyName = (name: string): string =>
  name
    .replace(/(?:2027|2026|校园招聘|校招|招聘官网|招聘|实习生招聘|实习生|秋季|秋招)/gi, '')
    .replace(/[\s/·-]+/g, '')
    .toLocaleLowerCase();

const websiteKey = (url: string): string => {
  try {
    return new URL(url).hostname.toLocaleLowerCase();
  } catch {
    return '';
  }
};

/**
 * 返回随站点部署的公司 WebP 图标，避免客户端依赖境外 favicon 服务。
 *
 * @param name 公司或入口名称。
 * @param url 公司招聘入口 URL。
 * @returns 本地公司图标；没有匹配项时返回 Sakura 兜底图标。
 */
export const getCompanyIcon = (name: string, url: string): string => {
  const manifest = COMPANY_ICONS as Record<string, string>;
  const icon =
    manifest[`name:${normalizeCompanyName(name)}`] ?? manifest[`host:${websiteKey(url)}`];
  return icon ? `${BASE_URL}assets/company-icons/${icon}` : FALLBACK_ICON;
};

/** @deprecated 使用 getCompanyIcon，以便公共招聘平台可以按公司名称区分图标。 */
export const getFavicon = (url: string): string => getCompanyIcon('', url);

export const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
  const target = e.target as HTMLImageElement;
  if (target.src.endsWith('/assets/company-icons/sakura-offer-icon.webp')) return;
  target.onerror = null;
  target.src = FALLBACK_ICON;
};

export const handleFaviconLoad = (e: React.SyntheticEvent<HTMLImageElement>): void => {
  const target = e.target as HTMLImageElement;
  if (!target.naturalWidth || !target.naturalHeight) target.src = FALLBACK_ICON;
};
