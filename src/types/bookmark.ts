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

export interface IInterview {
  id: string;
  company: string;
  department: string;
  time: string;       // 格式: "2025_0123_19:00"
  author: string;
  tags: string[];
  content: string;    // Markdown 格式
}
