export function isValidCount (n: number): boolean {
  return n === Infinity || (Number.isSafeInteger(n) && n > 0);
}