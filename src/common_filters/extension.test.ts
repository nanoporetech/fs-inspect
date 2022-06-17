import { filterByExtension } from './extension';
import { createInspector } from '../inspector';

describe('common filter: extension', () => {
  it('validates extensions', () => {
    expect(() => filterByExtension(['hello.world'])).toThrowError('Incorrectly formatted extension "hello.world"');
  });
  it('normalises start', () => {
    const filter = filterByExtension(['jpg', '.png']);
    expect(filter({ ext: '' })).toBeFalsy();
    expect(filter({ ext: '.jpg' })).toBeTruthy();
    expect(filter({ ext: '.png' })).toBeTruthy();
    expect(filter({ ext: 'png' })).toBeFalsy();
    expect(filter({ ext: '.txt' })).toBeFalsy();
  });
  it('is accepted by createInspector', () => {
    createInspector({ filter: filterByExtension([ 'gz' ])});
  });
  it('accepts extensions with numbers in', () => {
    const filter = filterByExtension(['cr2']);
    expect(filter({ ext: '.cr2' })).toBeTruthy();
    expect(filter({ ext: '.cr' })).toBeFalsy();
  });
});