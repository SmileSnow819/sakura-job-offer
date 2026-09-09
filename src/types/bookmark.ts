export interface ILink {
  title: string;
  url: string;
  /** 秋招招聘正式开放日期，使用 YYYY-MM-DD；其他分类不记录。 */
  openedAt?: string;
  referralUrl?: string;
  referralQrCode?: string;
}

export interface ICategory {
  id: string;
  name: string;
  icon: string;
  links: ILink[];
}

export interface IBookmarkData {
  categories: ICategory[];
}
