export interface BasicFileInfo {
  isDirectory: boolean;
  relative: string;
  absolute: string;
  hidden: boolean;
}

export interface FileInfo extends BasicFileInfo {
  size: number;
  base: string;
  name: string;
  ext: string; 
  created: number;
  modified: number;
}