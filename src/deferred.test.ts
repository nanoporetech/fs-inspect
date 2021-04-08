import { deferred } from './deferred';

describe('deferred', () => {
  it('throws with a rejection', async () => {
    const n = deferred();
    setTimeout(() => {
      n.reject('oh no');
    }, 1);
    try {
      await n.promise;
    } catch (err) {
      expect(err).toEqual('oh no');
    }
  });
  it('resolves with a resolution', async () => {
    const n = deferred();
    setTimeout(() => {
      n.resolve('yay');
    }, 1);
    expect(await n.promise).toEqual('yay');
  });
});