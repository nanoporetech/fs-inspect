import fs from 'fs';
import path from 'path';
import os from 'os';

import { makeFileInfo } from './FileInfo';

const TIMESTAMP_VARIATION = 1000; // ms
function approximate (expected: number, actual: number, variation: number) {
  const delta = actual - expected;
  expect(Math.abs(delta)).toBeLessThan(variation);
}

describe('FileInfo', () => {
  /*
   Testing folder structure
   > root
     > folder a
     > folder b
       file.txt
     > .hidden folder
     another.file.fasta
     .hidden file

  */
  const root = path.join(os.tmpdir(), 'FileInfo.test-');
  let tmp = '', now = 0;
  beforeAll(async () => {
    tmp = await fs.promises.mkdtemp(root);
    now = Date.now();
    await fs.promises.mkdir(path.join(tmp, 'folder a'));
    await fs.promises.mkdir(path.join(tmp, 'folder b'));
    await fs.promises.mkdir(path.join(tmp, '.hidden folder'));
    
    await fs.promises.writeFile(path.join(tmp, 'folder b', 'file.txt'), 'hello world');
    await fs.promises.writeFile(path.join(tmp, 'another.file.fasta'), 'this is another file with some text in');
    await fs.promises.writeFile(path.join(tmp, '.hidden file'), 'secret');

  });
  it('can read a folder', async () => {
    const info = await makeFileInfo(tmp, 'folder a');

    approximate(now, info.created, TIMESTAMP_VARIATION);
    approximate(now, info.modified, TIMESTAMP_VARIATION);

    expect(info).toStrictEqual(expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: 'folder a',
      absolute: path.join(tmp, 'folder a'),
      size: 0,
      base: 'folder a',
      name: 'folder a',
      ext: '',
    }));
  });
  it('can read a hidden folder', async () => {
    const info = await makeFileInfo(tmp, '.hidden folder');

    approximate(now, info.created, TIMESTAMP_VARIATION);
    approximate(now, info.modified, TIMESTAMP_VARIATION);

    expect(info).toStrictEqual(expect.objectContaining({
      isDirectory: true,
      hidden: true,
      relative: '.hidden folder',
      absolute: path.join(tmp, '.hidden folder'),
      size: 0,
      base: '.hidden folder',
      name: '.hidden folder',
      ext: '',
    }));
  });
  it('can read a file', async () => {
    const info = await makeFileInfo(tmp, 'another.file.fasta');

    approximate(now, info.created, TIMESTAMP_VARIATION);
    approximate(now, info.modified, TIMESTAMP_VARIATION);

    expect(info).toStrictEqual(expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: 'another.file.fasta',
      absolute: path.join(tmp, 'another.file.fasta'),
      size: 38,
      base: 'another.file.fasta',
      name: 'another.file',
      ext: '.fasta',
    }));
  });
  it('can read a hidden file', async () => {
    const info = await makeFileInfo(tmp, '.hidden file');

    approximate(now, info.created, TIMESTAMP_VARIATION);
    approximate(now, info.modified, TIMESTAMP_VARIATION);

    expect(info).toStrictEqual(expect.objectContaining({
      isDirectory: false,
      hidden: true,
      relative: '.hidden file',
      absolute: path.join(tmp, '.hidden file'),
      size: 6,
      base: '.hidden file',
      name: '.hidden file',
      ext: '',
    }));
  });
  it('can read a non root file', async () => {
    const info = await makeFileInfo(tmp, path.join('folder b', 'file.txt'));

    approximate(now, info.created, TIMESTAMP_VARIATION);
    approximate(now, info.modified, TIMESTAMP_VARIATION);

    expect(info).toStrictEqual(expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: path.join('folder b', 'file.txt'),
      absolute: path.join(tmp, 'folder b', 'file.txt'),
      size: 11,
      base: 'file.txt',
      name: 'file',
      ext: '.txt',
    }));
  })
  afterAll(async () => {
    await fs.promises.rm(root, { recursive: true });
  });
});