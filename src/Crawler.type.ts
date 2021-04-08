import type { FileInfo } from "./FileInfo.type";

export interface CrawlerOptions<T = FileInfo> {
  includeHidden?: boolean;
  includeFolders?: boolean;
  concurrency?: number;
  maxDepth?: number;
  exclude?: (info: FileInfo) => boolean | Promise<boolean>;
  filter?: (info: FileInfo) => boolean | Promise<boolean>;
  map?: (info: FileInfo) => T | Promise<T>;
  catch?: (error: unknown, location: string) => void | Promise<void>; 
}

export interface Crawler<T = FileInfo> {
  crawl: (location: string) => Promise<T[]>;
}