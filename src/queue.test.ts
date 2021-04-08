import { queue } from './queue';

function delay (n: number) {
  return new Promise(res => setTimeout(res, n));
}

describe('queue', () => {

  test('unused queue does not resolve', async () => {
    const { complete } = queue({ concurrency: 1, fn () {}});
    const res = await Promise.race([
      complete,
      delay(10).then(() => 'yay'),
    ]);
    expect(res).toEqual('yay');
  });

  test('stops after error', async () => {
    let started = 0;
    const { complete, add } = queue({ concurrency: 1, async fn ([txt]) {
      started += 1;
      if (txt === 'fail') {
        throw new Error('woops');
      }
    }});
    add('pass', 0);
    add('pass', 0);
    add('pass', 0);
    add('fail', 0);
    add('pass', 0);
    add('fail', 0);
    add('pass', 0);
    
    await expect(complete).rejects.toEqual(new Error('woops'));
    expect(started).toEqual(4);
  });

  test('recover option allows continuation when error is thrown', async () => {
    let started = 0;
    let errors = 0;
    const { complete, add } = queue({ concurrency: 1, async fn ([txt]) {
      started += 1;
      if (txt === 'fail') {
        throw new Error('woops');
      }
    }, recover () {
      errors += 1;
    }});
    add('pass', 0);
    add('pass', 0);
    add('pass', 0);
    add('fail', 0);
    add('pass', 0);
    add('fail', 0);
    add('pass', 0);
    
    await complete;
    expect(errors).toEqual(2);
    expect(started).toEqual(7);
  });

  test('recover option can still exit with error', async () => {
    let started = 0;
    const { complete, add } = queue({ concurrency: 1, async fn ([txt]) {
      started += 1;
      if (txt === 'fail') {
        throw new Error('woops');
      }
    }, recover () {
      throw new Error('spam');
    }});
    add('pass', 0);
    add('pass', 0);
    add('pass', 0);
    add('fail', 0);
    add('pass', 0);
    add('fail', 0);
    add('pass', 0);
    
    await expect(complete).rejects.toEqual(new Error('spam'));

    expect(started).toEqual(4);
  });

  test('cannot add more after stopped', async () => {
    let started = 0;
    const { complete, add } = queue({ concurrency: 1, async fn () {
      started += 1;
    }});
    add('pass', 0);
    
    await expect(complete);
    expect(started).toEqual(1);
    add('pass', 0);
    await delay(15);
    expect(started).toEqual(1);
  });

  test('uses correct level of concurrency', async () => {
    const concurrency = 2 + Math.floor(Math.random() * 10);
    let count = 0;
    let max = 0;
    const { complete, add } = queue({ concurrency, async fn () {
        count += 1;
        max = Math.max(count, max);
        await delay(5);
        count -=1; 
      } 
    });
    for (let i = 0; i < concurrency * 5; i += 1) {
      add('fake', 0);
    }
    await complete;
    expect(max).toEqual(concurrency);
    expect(count).toEqual(0);
  });
});