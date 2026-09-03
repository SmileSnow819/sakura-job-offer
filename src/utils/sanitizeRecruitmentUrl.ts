import { IBookmarkData, ILink } from '../types/bookmark';

const REFERRAL_PARAM =
  /^(?:ref(?:errer|eral)?(?:[_-]?(?:code|id))?|recommend(?:ation)?(?:[_-]?(?:code|id))?|invite(?:[_-]?(?:code|id))?|referral(?:[_-]?(?:code|id))?|internal(?:[_-]?(?:referral|recommend(?:ation)?))?|employee(?:[_-]?(?:id|code))?|promoter(?:[_-]?id)?|utm_[a-z_]+|spm)$/i;

const removeReferralParams = (params: URLSearchParams) => {
  // 删除参数会改变迭代器位置，先复制键名，避免相邻的推广参数被漏掉。
  // oxlint-disable-next-line unicorn/no-useless-spread
  for (const key of [...params.keys()]) {
    if (REFERRAL_PARAM.test(key)) params.delete(key);
  }
};

/** Removes referral-only parameters while retaining job, campaign, and filter URLs. */
export const sanitizeRecruitmentUrl = (value: string): string => {
  try {
    const url = new URL(value);
    removeReferralParams(url.searchParams);

    // Some ATS pages keep their route and query string after the hash, e.g. #/jobs?ref=...
    const queryStart = url.hash.indexOf('?');
    if (queryStart >= 0) {
      const hashPath = url.hash.slice(0, queryStart);
      const hashParams = new URLSearchParams(url.hash.slice(queryStart + 1));
      removeReferralParams(hashParams);
      const cleanHashQuery = hashParams.toString();
      url.hash = cleanHashQuery ? `${hashPath}?${cleanHashQuery}` : hashPath;
    }

    return url.toString();
  } catch {
    return value;
  }
};

const sanitizeLink = (link: ILink): ILink => ({
  ...link,
  url: sanitizeRecruitmentUrl(link.url),
});

export const sanitizeBookmarkData = (data: IBookmarkData): IBookmarkData => ({
  ...data,
  categories: data.categories.map((category) => ({
    ...category,
    links: category.links.map(sanitizeLink),
  })),
});
