export interface FileInfo {
  isDirectory: boolean;
  relative: string;
  absolute: string;
  hidden: boolean;
  size: number;
  base: string;
  name: string;
  ext: string; 
  created: number;
  modified: number;
}