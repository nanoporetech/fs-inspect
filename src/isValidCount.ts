export function isValidCount (n: number) {
  return n === Infinity || (Number.isSafeInteger(n) && n > 0);
}