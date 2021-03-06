export function deferred<T> (): { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void } {
  // we unfortunately have to set dummy values here, assigning to null causes the
  // checker to strip the real type and if we define later the compiler produces
  // a "not yet defined style error"
  let resolve: ((v: T) => void);
  let reject: ((v: unknown) => void);
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  // resolve/reject are "potentially" not assigned to, but always are
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore 
  return { promise, resolve, reject };
}