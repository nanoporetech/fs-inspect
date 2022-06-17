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
  let rootFolder = '';
  let folderA = '';
  let folderN = '';
  let folderB = '';
  let folderHidden = '';

  let filePNG = '';
  let fileTXT = '';
  let fileFQ = '';
  let fileHidden = '';
  let fileObscured = '';

  let rootDescription = expect.objectContaining({}) as Partial<FileInfo>;
  let folderADescription = expect.objectContaining({}) as Partial<FileInfo>;
  let folderNDescription = expect.objectContaining({}) as Partial<FileInfo>;
  let folderBDescription = expect.objectContaining({}) as Partial<FileInfo>;
  let folderHiddenDescription = expect.objectContaining({}) as Partial<FileInfo>;

  let filePNGDescription = expect.objectContaining({}) as Partial<FileInfo>;
  let fileTXTDescription = expect.objectContaining({}) as Partial<FileInfo>;
  let fileFQDescription = expect.objectContaining({}) as Partial<FileInfo>;
  let fileHiddenDescription = expect.objectContaining({}) as Partial<FileInfo>;
  let fileObscuredDescription = expect.objectContaining({}) as Partial<FileInfo>;

  beforeAll(async () => {

    rootFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'FileInfo_test-'));
    folderA = path.join(rootFolder, 'folder a');
    folderN = path.join(folderA, 'folder n');
    folderB = path.join(rootFolder, 'folder b');
    folderHidden = path.join(rootFolder, '.hidden folder');

    filePNG = path.join(folderN, 'example.png');
    fileTXT = path.join(folderB, 'file.txt');
    fileFQ = path.join(rootFolder, 'another.file.fastq');
    fileHidden = path.join(rootFolder, '.hidden file.json');
    fileObscured = path.join(folderHidden, 'obscured file.tar.gz');
    
    await fs.promises.mkdir(folderA);
    await fs.promises.mkdir(folderB);
    await fs.promises.mkdir(folderHidden);
    await fs.promises.mkdir(folderN);
  
    await fs.promises.writeFile(fileTXT, 'hello world');
    await fs.promises.writeFile(fileFQ, 'this is another file with some text in');
    await fs.promises.writeFile(fileHidden, 'secret');
    await fs.promises.writeFile(filePNG, 'not actually a PNG');
    await fs.promises.writeFile(fileObscured, 'not actually a tarball');

    rootDescription = expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: '',
      absolute: rootFolder,
      size: 0,
    }) as Partial<FileInfo>;
    folderADescription = expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: 'folder a',
      absolute: folderA,
      size: 0,
      base: 'folder a',
      name: 'folder a',
      ext: '',
    }) as Partial<FileInfo>;
    folderNDescription = expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: 'folder a/folder n',
      absolute: folderN,
      size: 0,
      base: 'folder n',
      name: 'folder n',
      ext: '',
    }) as Partial<FileInfo>;
    folderBDescription = expect.objectContaining({
      isDirectory: true,
      hidden: false,
      relative: 'folder b',
      absolute: folderB,
      size: 0,
      base: 'folder b',
      name: 'folder b',
      ext: '',
    }) as Partial<FileInfo>;
    folderHiddenDescription = expect.objectContaining({
      isDirectory: true,
      hidden: true,
      relative: '.hidden folder',
      absolute: folderHidden,
      size: 0,
      base: '.hidden folder',
      name: '.hidden folder',
      ext: '',
    }) as Partial<FileInfo>;
  
    filePNGDescription = expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: 'folder a/folder n/example.png',
      absolute: filePNG,
      size: 18,
      base: 'example.png',
      name: 'example',
      ext: '.png',
    }) as Partial<FileInfo>;
    fileTXTDescription = expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: 'folder b/file.txt',
      absolute: fileTXT,
      size: 11,
      base: 'file.txt',
      name: 'file',
      ext: '.txt',
    }) as Partial<FileInfo>;
    fileFQDescription = expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: 'another.file.fastq',
      absolute: fileFQ,
      size: 38,
      base: 'another.file.fastq',
      name: 'another.file',
      ext: '.fastq',
    }) as Partial<FileInfo>;
    fileHiddenDescription = expect.objectContaining({
      isDirectory: false,
      hidden: true,
      relative: '.hidden file.json',
      absolute: fileHidden,
      size: 6,
      base: '.hidden file.json',
      name: '.hidden file',
      ext: '.json',
    }) as Partial<FileInfo>;
    fileObscuredDescription = expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: '.hidden folder/obscured file.tar.gz',
      absolute: fileObscured,
      size: 22,
      base: 'obscured file.tar.gz',
      name: 'obscured file.tar',
      ext: '.gz',
    }) as Partial<FileInfo>;

  });
  afterAll(async () => {
    await fs.promises.rm(rootFolder, { recursive: true });
  });

  it('default behavior', async () => {
    const { search } = createInspector();
    const files = await search(rootFolder);

    expect(files.length).toEqual(3);

    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileFQDescription);
    expect(files).toContainEqual(filePNGDescription);
  });

  it('does not accept invalid concurrency value', () => {
    expect(() => createInspector({ concurrency: 0 })).toThrowError('Invalid concurrency value 0. Expected either a positive non-zero integer, or Infinity.');
  });

  it('does not accept invalid maxDepth value', () => {
    expect(() => createInspector({ maxDepth: 0 })).toThrowError('Invalid maxDepth value 0. Expected either a positive non-zero integer, or Infinity.');
  });

  it('does not accept invalid minDepth value', () => {
    expect(() => createInspector({ minDepth: 3.14 })).toThrowError('Invalid minDepth value 3.14. Expected either a positive integer, or Infinity.');
  });

  it('does not accept overlapping maxDepth/minDepth values', () => {
    expect(() => createInspector({ maxDepth: 2, minDepth: 3 })).toThrowError('Invalid depth range. Expected minDepth to be less than or equal to maxDepth.');
  });

  it('can conditionally include folders', async () => {
    const { search } = createInspector({ includeFolders: true });
    const files = await search(rootFolder);

    expect(files.length).toEqual(7);
    expect(files).toContainEqual(rootDescription);

    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileFQDescription);
    expect(files).toContainEqual(filePNGDescription);

    expect(files).toContainEqual(folderADescription);
    expect(files).toContainEqual(folderBDescription);
    expect(files).toContainEqual(folderNDescription);
  });

  it('type: "all" includes folders and files', async () => {
    const { search } = createInspector({ type: 'all' });
    const files = await search(rootFolder);

    expect(files.length).toEqual(7);
    expect(files).toContainEqual(rootDescription);

    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileFQDescription);
    expect(files).toContainEqual(filePNGDescription);

    expect(files).toContainEqual(folderADescription);
    expect(files).toContainEqual(folderBDescription);
    expect(files).toContainEqual(folderNDescription);
  });

  it('type: "folders" includes only folders', async () => {
    const { search } = createInspector({ type: 'folders' });
    const files = await search(rootFolder);

    expect(files.length).toEqual(4);
    expect(files).toContainEqual(rootDescription);

    expect(files).toContainEqual(folderADescription);
    expect(files).toContainEqual(folderBDescription);
    expect(files).toContainEqual(folderNDescription);
  });

  it('type: "files" includes only files', async () => {
    const { search } = createInspector({ type: 'files' });
    const files = await search(rootFolder);

    expect(files.length).toEqual(3);

    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileFQDescription);
    expect(files).toContainEqual(filePNGDescription);
  });

  it('does not allow both type and includeFolder to be specified', () => {
    expect(() => createInspector({ type: 'all', includeFolders: true })).toThrow('Clashing arguments "type" and "includeFolder" specified. Use "type: all" to include files and folders in your output.');
  });

  it('can conditionally include hidden files/folders', async () => {
    const { search } = createInspector({ includeFolders: true, includeHidden: true });
    const files = await search(rootFolder);

    expect(files.length).toEqual(10);
    expect(files).toContainEqual(rootDescription);

    expect(files).toContainEqual(fileObscuredDescription);
    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileHiddenDescription);
    expect(files).toContainEqual(fileFQDescription);
    expect(files).toContainEqual(filePNGDescription);

    expect(files).toContainEqual(folderADescription);
    expect(files).toContainEqual(folderHiddenDescription);
    expect(files).toContainEqual(folderBDescription);
    expect(files).toContainEqual(folderNDescription);
  });

  it('can conditionally include hidden files', async () => {
    const { search } = createInspector({ includeHidden: true });
    const files = await search(rootFolder);

    expect(files.length).toEqual(5);

    expect(files).toContainEqual(fileObscuredDescription);
    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileHiddenDescription);
    expect(files).toContainEqual(fileFQDescription);
    expect(files).toContainEqual(filePNGDescription);
  });

  it('can accept a file as an entry point', async() => {
    const { search } = createInspector();
    const files = await search(filePNG);

    expect(files.length).toEqual(1);

    expect(files).toContainEqual(expect.objectContaining({
      isDirectory: false,
      hidden: false,
      relative: '',
      absolute: filePNG,
      size: 18,
      base: 'example.png',
      name: 'example',
      ext: '.png',
    }));
  });

  it('can accept a max depth limit', async() => {
    const { search } = createInspector({ maxDepth: 2 });
    const files = await search(rootFolder);

    expect(files.length).toEqual(2);

    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileFQDescription);
  });

  it('can accept a min depth limit', async() => {
    const { search } = createInspector({ minDepth: 2 });
    const files = await search(rootFolder);

    expect(files.length).toEqual(2);

    expect(files).toContainEqual(filePNGDescription);
    expect(files).toContainEqual(fileTXTDescription);
  });

  it('can accept a max depth limit of 1', async() => {
    const { search } = createInspector({ maxDepth: 1 });
    const files = await search(rootFolder);

    expect(files.length).toEqual(1);

    expect(files).toContainEqual(fileFQDescription);
  });

  it('can filter results using a custom fn', async() => {
    const filter = ({ name }: FileInfo) => name.includes('file');
    const { search } = createInspector({ includeFolders: true, includeHidden: true, filter });
    const files = await search(rootFolder);

    expect(files.length).toEqual(4);

    expect(files).toContainEqual(fileObscuredDescription);
    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileHiddenDescription);
    expect(files).toContainEqual(fileFQDescription);
  });

  it('can exclude folders using a custom fn', async() => {
    const exclude = ({ name }: FileInfo) => name === 'folder a';
    const { search } = createInspector({ includeFolders: true, includeHidden: true, exclude });
    const files = await search(rootFolder);

    expect(files.length).toEqual(7);
    expect(files).toContainEqual(rootDescription);

    expect(files).toContainEqual(fileObscuredDescription);
    expect(files).toContainEqual(fileTXTDescription);
    expect(files).toContainEqual(fileHiddenDescription);
    expect(files).toContainEqual(fileFQDescription);

    expect(files).toContainEqual(folderHiddenDescription);
    expect(files).toContainEqual(folderBDescription);
  });

  it('can map results using a custom fn', async() => {
    const map = ({ absolute }: FileInfo) => absolute;
    const { search } = createInspector({ map });
    const files = await search(rootFolder);

    expect(files.length).toEqual(3);

    expect(files).toContainEqual(fileTXT);
    expect(files).toContainEqual(fileFQ);
    expect(files).toContainEqual(filePNG);
  });
});