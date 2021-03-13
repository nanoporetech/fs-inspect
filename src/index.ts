import fs from 'fs/promises';
import path from 'path';
import type { Crawler, CrawlerOptions } from './Crawler.type';
import { makeFileInfo } from './FileInfo';
import type { FileInfo } from './FileInfo.type';
import { queue } from './queue';

// T is intended to be inferred, specifying a type argument without `map` breaks the contract
export function crawler <T = FileInfo>(options: CrawlerOptions<T> = {}): Crawler<T> {
  const {
    exclude,
    filter,
    map,
    includeFolders = false,
    includeHidden = false
  } = options;

  return {
    async crawl (location: string): Promise<T[]> {
      const results: T[] = [];
      const root = path.resolve(location);

      const { add, complete } = queue(8, async (relative: string) => {
        const info = await makeFileInfo(root, relative);
        if (info.hidden && !includeHidden) {
          return; // this is a "hidden" dot file/folder, skip it unless we've been configured to include it
        }
        if (info.isDirectory) {
          if (exclude && await exclude(info)) {
            return; // if the exclusion folder indicates we should ignore this folder then exit here
          }
          // add all the entries of the folder to the queue
          for (const entry of await fs.readdir(info.absolute)) {
            add(path.join(relative, entry));
          }
          if (!includeFolders) {
            return; // unless we are set to include folders in the result exit before we get to the filter stage
          }
        }
        // decide if we should include this entry in the result list
        if (!filter || await filter(info)) {
          if (map) {
            results.push(await map(info));
          } else {
            // if map is not specified T will be FileInfo
            results.push(info as unknown as T);
          }
        }
      });

      // add the entry location to the queue to kick us off
      add('.');
      // waits until the queue is empty, or an error occurs
      await complete;
      return results;
    }
  };
}
