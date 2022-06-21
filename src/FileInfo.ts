import path from 'path';
import fs from 'fs';

import type { FileInfo, BasicFileInfo } from './FileInfo.type';

export async function makeFileInfo(root: string, relative: string): Promise<FileInfo> {
  const absolute = path.join(root, relative);
  const { base, name, ext } = path.parse(absolute);
  const info = await fs.promises.stat(absolute);
  const { size, birthtimeMs: created, mtimeMs: modified } = info;
  const isDirectory = info.isDirectory();
  return {
    isDirectory,
    hidden: name.startsWith('.'),
    relative,
    absolute,
    size: isDirectory ? 0 : size,
    base,
    name,
    ext,
    created,
    modified,
  };
}

export async function extendFileInfo(entry: BasicFileInfo): Promise<FileInfo> {
  const { base, name, ext } = path.parse(entry.absolute);
  const info = await fs.promises.stat(entry.absolute);
  const { size, birthtimeMs: created, mtimeMs: modified } = info;
  return {
    ...entry,
    size: entry.isDirectory ? 0 : size,
    base,
    name,
    ext,
    created,
    modified,
  };
}