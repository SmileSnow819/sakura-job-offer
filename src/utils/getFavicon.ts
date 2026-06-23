const FALLBACK_ICON = `${import.meta.env.BASE_URL}sakura-offer-icon.svg`;

export const getFavicon = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  } catch {
    return FALLBACK_ICON;
  }
};

export const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
  const target = e.target as HTMLImageElement;
  target.onerror = null;
  target.src = FALLBACK_ICON;
};

export const handleFaviconLoad = (e: React.SyntheticEvent<HTMLImageElement>): void => {
  const target = e.target as HTMLImageElement;
  if (target.src.endsWith('/sakura-offer-icon.svg')) return;

  const renderedEmpty = target.naturalWidth <= 16 || target.naturalHeight <= 16;
  if (renderedEmpty) {
    target.src = FALLBACK_ICON;
  }
};
