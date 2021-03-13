import type { FileInfo } from "./FileInfo.type";

export interface CrawlerOptions<T = FileInfo> {
  includeHidden?: boolean;
  includeFolders?: boolean;
  exclude?: (info: FileInfo) => boolean | Promise<boolean>;
  filter?: (info: FileInfo) => boolean | Promise<boolean>;
  map?: (info: FileInfo) => Promise<T> | T;
}

export interface Crawler<T = FileInfo> {
  crawl: (location: string) => Promise<T[]>;
}