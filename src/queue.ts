import { asDefined } from "ts-runtime-typecheck";
import { deferred } from "./deferred";

export function queue<T> (concurrency: number, fn: (v: T) => Promise<void> | void) {
  const { promise, resolve, reject } = deferred<void>();
  const pending: T[] = [];
  let running = 0;
  let failed = false;

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
      } catch (e) {
        failed = true;
        pending.length = 0;
        // this may be called as many times as we have active threads if they all fail
        // but the above should mean that they won't continue past their current item
        reject(e);
      }
    }
    running -= 1;
    if (running === 0) {
      resolve();
    }
  };

  return {
    add (item: T) {
      if (failed) {
        return; // don't add to queue or start threads if we have failed
      }
      // add to queue
      pending.push(item);
      // if we aren't at our concurrency limit start a new thread
      if (running < concurrency) {
        runThread();
      }
    },
    complete: promise,
  };
}