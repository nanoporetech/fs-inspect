import path from 'path';
import fs from 'fs';
import type { FileInfo } from './FileInfo.type';

export async function makeFileInfo(root: string, relative: string): Promise<FileInfo> {
  const absolute = path.join(root, relative);
  const { base, name, ext } = path.parse(relative);
  const info = await fs.promises.stat(absolute);
  const { size, birthtimeMs: created, mtimeMs: modified } = info;

  return {
    isDirectory: info.isDirectory(),
    hidden: name.startsWith('.'),
    relative,
    absolute,
    size,
    base,
    name,
    ext,
    created,
    modified,
  };
}