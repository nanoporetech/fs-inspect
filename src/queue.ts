import { asDefined } from 'ts-runtime-typecheck';
import { deferred } from './deferred';

export function queue ({ concurrency, recover, fn }: { 
  concurrency: number;
  recover?: (error: unknown, location: string) => Promise<void> | void;
  fn: (v: [string, number]) => Promise<void> | void;
}): { add (location: string, depth: number): void; complete: Promise<void> } {
  const { promise, resolve, reject } = deferred<void>();
  const pending: [string, number][] = [];
  let running = 0;
  let stopped = false;

  const runThread = async () => {
    running += 1;
    // threads loop over the pending list until all entries have been removed
    // then exit. The pending list is shared between them so the number of 
    // running threads goes up and down depending on the amount in the queue
    // and thread congestion
    while (pending.length > 0) {
      const next = asDefined(pending.shift()); // we check above, so this will always return a value
      try {
        await fn(next);
      } catch (e: unknown) {
        let err = e;
        let recovered = false;

        if (recover) {
          try {
            await recover(e, next[0]);
            recovered = true;
          } catch (e) {
            err = e;
          }
        }

        if (!recovered) {
          // this may be called as many times as we have active threads if they all fail
          // but the above should mean that they won't continue past their current item
          stopped = true;
          pending.length = 0;
          reject(err);
        }
        
      }
    }
    running -= 1;
    if (running === 0) {
      stopped = true;
      resolve();
    }
  };

  return {
    add (location: string, depth: number) {
      if (stopped) {
        return; // don't add to queue or start threads if we have failed
      }
      // add to queue
      pending.push([location, depth]);
      // if we aren't at our concurrency limit start a new thread
      if (running < concurrency) {
        void runThread();
      }
    },
    complete: promise,
  };
}