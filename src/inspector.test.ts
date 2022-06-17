import path from 'path';
import fs from 'fs';
import os from 'os';

import { createInspector } from './inspector';
import type { FileInfo } from './FileInfo.type';

describe('inspector', () => {
  /*
   Testing folder structure
   > root
     > folder a
       > folder n
         example.png
     > folder b
       file.txt
     > .hidden folder
       obscured file.tar.gz
     another.file.fasta
     .hidden file

  */
  let ROOT = '';
  let FOLDER_A = '';
  let FOLDER_N = '';
  let FOLDER_B = '';
  let FOLDER_HIDDEN = '';

  let FILE_PNG = '';
  let FILE_TXT = '';
  let FILE_FQ = '';
  let FILE_HIDDEN = '';
  let FILE_OBSCURED = '';

  let ROOT_DESCRIPTION = expect.objectContaining({});
  let FOLDER_A_DESCRIPTION = expect.objectContaining({});
  let FOLDER_N_DESCRIPTION = expect.objectContaining({});
  let FOLDER_B_DESCRIPTION = expect.objectContaining({});
  let FOLDER_HIDDEN_DESCRIPTION = expect.objectContaining({});

  let FILE_PNG_DESCRIPTION = expect.objectContaining({});
  let FILE_TXT_DESCRIPTION = expect.objectContaining({});
  let FILE_FQ_DESCRIPTION = expect.objectContaining({});
  let FILE_HIDDEN_DESCRIPTION = expect.objectContaining({});
  let FILE_OBSCURED_DESCRIPTION = expect.objectContaining({});

  beforeAll(async () => {

    ROOT = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'FileInfo_test-'));
    FOLDER_A = path.join(ROOT, 'folder a');
    FOLDER_N = path.join(FOLDER_A, 'folder n');
    FOLDER_B = path.join(ROOT, 'folder b');
    FOLDER_HIDDEN = path.join(ROOT, '.hidden folder');

    FILE_PNG = path.join(FOLDER_N, 'example.png');
    FILE_TXT = path.join(FOLDER_B, 'file.txt');
    FILE_FQ = path.join(ROOT, 'another.file.fastq');
    FILE_HIDDEN = path.join(ROOT, '.hidden file.json');
    FILE_OBSCURED = path.join(FOLDER_HIDDEN, 'obscured file.tar.gz')
    
    await fs.promises.mkdir(FOLDER_A);
    await fs.promises.mkdir(FOLDER_B);
    await fs.promises.mkdir(FOLDER_HIDDEN);
    await fs.promises.mkdir(FOLDER_N);
  
    await fs.promises.writeFile(FILE_TXT, 'hello world');
    await fs.promises.writeFile(FILE_FQ, 'this is another file with some text in');
    await fs.promises.writeFile(FILE_HIDDEN, 'secret');
    await fs.promises.writeFile(FILE_PNG, 'not actually a PNG');
    await fs.promises.writeFile(FILE_OBSCURED, 'not actually a tarball');

    ROOT_DESCRIPTION = expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: '',
      absolute: ROOT,
      size: 0,
    });
    FOLDER_A_DESCRIPTION = expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: 'folder a',
      absolute: FOLDER_A,
      size: 0,
      base: 'folder a',
      name: 'folder a',
      ext: '',
    });
    FOLDER_N_DESCRIPTION = expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: 'folder a/folder n',
      absolute: FOLDER_N,
      size: 0,
      base: 'folder n',
      name: 'folder n',
      ext: '',
    });
    FOLDER_B_DESCRIPTION = expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: 'folder b',
      absolute: FOLDER_B,
      size: 0,
      base: 'folder b',
      name: 'folder b',
      ext: '',
    });
    FOLDER_HIDDEN_DESCRIPTION = expect.objectContaining({
      isDirectory: true,
      hidden: true,
      relative: '.hidden folder',
      absolute: FOLDER_HIDDEN,
      size: 0,
      base: '.hidden folder',
      name: '.hidden folder',
      ext: '',
    });
  
    FILE_PNG_DESCRIPTION = expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: 'folder a/folder n/example.png',
      absolute: FILE_PNG,
      size: 18,
      base: 'example.png',
      name: 'example',
      ext: '.png',
    });
    FILE_TXT_DESCRIPTION = expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: 'folder b/file.txt',
      absolute: FILE_TXT,
      size: 11,
      base: 'file.txt',
      name: 'file',
      ext: '.txt',
    });
    FILE_FQ_DESCRIPTION = expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: 'another.file.fastq',
      absolute: FILE_FQ,
      size: 38,
      base: 'another.file.fastq',
      name: 'another.file',
      ext: '.fastq',
    });
    FILE_HIDDEN_DESCRIPTION = expect.objectContaining({
      isDirectory: false,
      hidden: true,
      relative: '.hidden file.json',
      absolute: FILE_HIDDEN,
      size: 6,
      base: '.hidden file.json',
      name: '.hidden file',
      ext: '.json',
    });
    FILE_OBSCURED_DESCRIPTION = expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: '.hidden folder/obscured file.tar.gz',
      absolute: FILE_OBSCURED,
      size: 22,
      base: 'obscured file.tar.gz',
      name: 'obscured file.tar',
      ext: '.gz',
    });

  });
  afterAll(async () => {
    await fs.promises.rm(ROOT, { recursive: true });
  });

  it('default behavior', async () => {
    const { search } = createInspector();
    const files = await search(ROOT);

    expect(files.length).toEqual(3);

    expect(files).toContainEqual(FILE_TXT_DESCRIPTION);
    expect(files).toContainEqual(FILE_FQ_DESCRIPTION);
    expect(files).toContainEqual(FILE_PNG_DESCRIPTION);
  });

  it('does not accept invalid concurrency value', () => {
    expect(() => createInspector({ concurrency: 0 })).toThrowError('Invalid concurrency value 0. Expected either a positive non-zero integer, or Infinity.')
  });

  it('does not accept invalid maxDepth value', () => {
    expect(() => createInspector({ maxDepth: 0 })).toThrowError('Invalid maxDepth value 0. Expected either a positive non-zero integer, or Infinity.')
  });

  it('does not accept invalid minDepth value', () => {
    expect(() => createInspector({ minDepth: 3.14 })).toThrowError('Invalid minDepth value 3.14. Expected either a positive integer, or Infinity.')
  });

  it('does not accept overlapping maxDepth/minDepth values', () => {
    expect(() => createInspector({ maxDepth: 2, minDepth: 3 })).toThrowError('Invalid depth range. Expected minDepth to be less than or equal to maxDepth.')
  });

  it('can conditionally include folders', async () => {
    const { search } = createInspector({ includeFolders: true });
    const files = await search(ROOT);

    expect(files.length).toEqual(7);
    expect(files).toContainEqual(ROOT_DESCRIPTION);

    expect(files).toContainEqual(FILE_TXT_DESCRIPTION);
    expect(files).toContainEqual(FILE_FQ_DESCRIPTION);
    expect(files).toContainEqual(FILE_PNG_DESCRIPTION);

    expect(files).toContainEqual(FOLDER_A_DESCRIPTION);
    expect(files).toContainEqual(FOLDER_B_DESCRIPTION);
    expect(files).toContainEqual(FOLDER_N_DESCRIPTION);
  });

  it('can conditionally include hidden files/folders', async () => {
    const { search } = createInspector({ includeFolders: true, includeHidden: true });
    const files = await search(ROOT);

    expect(files.length).toEqual(10);
    expect(files).toContainEqual(ROOT_DESCRIPTION);

    expect(files).toContainEqual(FILE_OBSCURED_DESCRIPTION);
    expect(files).toContainEqual(FILE_TXT_DESCRIPTION);
    expect(files).toContainEqual(FILE_HIDDEN_DESCRIPTION);
    expect(files).toContainEqual(FILE_FQ_DESCRIPTION);
    expect(files).toContainEqual(FILE_PNG_DESCRIPTION);

    expect(files).toContainEqual(FOLDER_A_DESCRIPTION);
    expect(files).toContainEqual(FOLDER_HIDDEN_DESCRIPTION);
    expect(files).toContainEqual(FOLDER_B_DESCRIPTION);
    expect(files).toContainEqual(FOLDER_N_DESCRIPTION);
  });

  it('can conditionally include hidden files', async () => {
    const { search } = createInspector({ includeHidden: true });
    const files = await search(ROOT);

    expect(files.length).toEqual(5);

    expect(files).toContainEqual(FILE_OBSCURED_DESCRIPTION);
    expect(files).toContainEqual(FILE_TXT_DESCRIPTION);
    expect(files).toContainEqual(FILE_HIDDEN_DESCRIPTION);
    expect(files).toContainEqual(FILE_FQ_DESCRIPTION);
    expect(files).toContainEqual(FILE_PNG_DESCRIPTION);
  });

  it('can accept a file as an entry point', async() => {
    const { search } = createInspector();
    const files = await search(FILE_PNG);

    expect(files.length).toEqual(1);

    expect(files).toContainEqual(expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: '',
      absolute: FILE_PNG,
      size: 18,
      base: 'example.png',
      name: 'example',
      ext: '.png',
    }));
  });

  it('can accept a max depth limit', async() => {
    const { search } = createInspector({ maxDepth: 2 });
    const files = await search(ROOT);

    expect(files.length).toEqual(2);

    expect(files).toContainEqual(FILE_TXT_DESCRIPTION);
    expect(files).toContainEqual(FILE_FQ_DESCRIPTION);
  });

  it('can accept a min depth limit', async() => {
    const { search } = createInspector({ minDepth: 2 });
    const files = await search(ROOT);

    expect(files.length).toEqual(2);

    expect(files).toContainEqual(FILE_PNG_DESCRIPTION);
    expect(files).toContainEqual(FILE_TXT_DESCRIPTION);
  });

  it('can accept a max depth limit of 1', async() => {
    const { search } = createInspector({ maxDepth: 1 });
    const files = await search(ROOT);

    expect(files.length).toEqual(1);

    expect(files).toContainEqual(FILE_FQ_DESCRIPTION);
  });

  it('can filter results using a custom fn', async() => {
    const filter = ({ name }: FileInfo) => name.includes('file');
    const { search } = createInspector({ includeFolders: true, includeHidden: true, filter });
    const files = await search(ROOT);

    expect(files.length).toEqual(4);

    expect(files).toContainEqual(FILE_OBSCURED_DESCRIPTION);
    expect(files).toContainEqual(FILE_TXT_DESCRIPTION);
    expect(files).toContainEqual(FILE_HIDDEN_DESCRIPTION);
    expect(files).toContainEqual(FILE_FQ_DESCRIPTION);
  });

  it('can exclude folders using a custom fn', async() => {
    const exclude = ({ name }: FileInfo) => name === 'folder a';
    const { search } = createInspector({ includeFolders: true, includeHidden: true, exclude });
    const files = await search(ROOT);

    expect(files.length).toEqual(7);
    expect(files).toContainEqual(ROOT_DESCRIPTION);

    expect(files).toContainEqual(FILE_OBSCURED_DESCRIPTION);
    expect(files).toContainEqual(FILE_TXT_DESCRIPTION);
    expect(files).toContainEqual(FILE_HIDDEN_DESCRIPTION);
    expect(files).toContainEqual(FILE_FQ_DESCRIPTION);

    expect(files).toContainEqual(FOLDER_HIDDEN_DESCRIPTION);
    expect(files).toContainEqual(FOLDER_B_DESCRIPTION);
  });

  it('can map results using a custom fn', async() => {
    const map = ({ absolute }: FileInfo) => absolute;
    const { search } = createInspector({ map });
    const files = await search(ROOT);

    expect(files.length).toEqual(3);

    expect(files).toContainEqual(FILE_TXT);
    expect(files).toContainEqual(FILE_FQ);
    expect(files).toContainEqual(FILE_PNG);
  });
});