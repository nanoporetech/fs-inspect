import { isValidCount } from './isValidCount';

describe('isValidCount', () => {
  it('accepts postive integers', () => {
    expect(isValidCount(1)).toBeTruthy();
    expect(isValidCount(2)).toBeTruthy();
    expect(isValidCount(10000)).toBeTruthy();
    expect(isValidCount(Number.MAX_SAFE_INTEGER)).toBeTruthy();
    expect(isValidCount(Number.MAX_SAFE_INTEGER + 2)).toBeFalsy();
  });
  it('does not accept negative integers', () => {
    expect(isValidCount(-1)).toBeFalsy();
    expect(isValidCount(-2)).toBeFalsy();
    expect(isValidCount(-10000)).toBeFalsy();
    expect(isValidCount(Number.MIN_SAFE_INTEGER)).toBeFalsy();
    expect(isValidCount(Number.MIN_SAFE_INTEGER - 2)).toBeFalsy();
  });
  it('does accept zero values', () => {
    expect(isValidCount(0)).toBeFalsy();
    expect(isValidCount(-0)).toBeFalsy();
  });
  it('accepts positive Infinity', () => {
    expect(isValidCount(Infinity)).toBeTruthy();
    expect(isValidCount(-Infinity)).toBeFalsy();
  });
  it('does not accept floating point values', () => {
    expect(isValidCount(-0.2)).toBeFalsy();
  });
})