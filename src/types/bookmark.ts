export interface ILink {
  title: string;
  url: string;
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
