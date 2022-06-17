import type { FileInfo } from "./FileInfo.type";

export interface InspectorOptions<T = FileInfo> {
  includeHidden?: boolean;
  /** 
   * @deprecated use `type: 'all'` instead
   */
  includeFolders?: boolean;
  type?: 'files' | 'folders' | 'all';
  concurrency?: number;
  minDepth?: number;
  maxDepth?: number;
  exclude?: (info: FileInfo) => boolean | Promise<boolean>;
  filter?: (info: FileInfo) => boolean | Promise<boolean>;
  map?: (info: FileInfo) => T | Promise<T>;
  catch?: (error: unknown, location: string) => void | Promise<void>; 
}

export interface Inspector<T = FileInfo> {
  search: (location: string) => Promise<T[]>;
}