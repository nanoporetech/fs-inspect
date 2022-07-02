import type { BasicFileInfo, FileInfo } from './FileInfo.type';


export interface CoreInspectorOptions {
  includeHidden?: boolean;
  /** 
   * @deprecated use `type: 'all'` instead
   */
  includeFolders?: boolean;
  type?: 'files' | 'folders' | 'all';
  concurrency?: number;
  minDepth?: number;
  maxDepth?: number;
  catch?: (error: unknown, location: string) => void | Promise<void>; 
}

export interface SimpleInspectorOptions<T = BasicFileInfo> extends CoreInspectorOptions {
  simpleMode: true; 
  exclude?: (info: BasicFileInfo) => boolean | Promise<boolean>;
  filter?: (info: BasicFileInfo) => boolean | Promise<boolean>;
  map?: (info: BasicFileInfo) => T | Promise<T>;
}

export interface NormalInspectorOptions<T = FileInfo> extends CoreInspectorOptions {
  simpleMode?: false; 
  exclude?: (info: FileInfo) => boolean | Promise<boolean>;
  filter?: (info: FileInfo) => boolean | Promise<boolean>;
  map?: (info: FileInfo) => T | Promise<T>;
}

export type InspectorOptions<T = BasicFileInfo> = NormalInspectorOptions<T> | SimpleInspectorOptions<T>;

export interface Inspector<T = FileInfo> {
  search: (location: string) => Promise<T[]>;
}