const EXT_REGEX = /^\.?[a-z]+$/i;

export function filterByExtension(extensions: Iterable<string>): (info: { ext: string }) => boolean {
  const list = new Set();
  for (const ext of extensions) {
    if (!EXT_REGEX.test(ext)) {
      throw new Error(`Incorrectly formatted extension "${ext}"`);
    }
    list.add(ext[0] === '.' ? ext : '.' + ext);
  }
  return ({ ext }: { ext: string }) => list.has(ext);
}