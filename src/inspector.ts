import fs from 'fs';
import path from 'path';
import { makeFileInfo } from './FileInfo';
import { queue } from './queue';
import { isValidCount } from './isValidCount';

import type { Inspector, InspectorOptions } from './inspector.type';
import type { FileInfo } from './FileInfo.type';

// T is intended to be inferred, specifying a type argument without `map` breaks the contract
export function createInspector <T = FileInfo>(options: InspectorOptions<T> = {}): Inspector<T> {
  const {
    exclude,
    filter,
    map,
    concurrency = 8,
    maxDepth = Infinity,
    catch: recover,
    includeFolders = false,
    includeHidden = false
  } = options;

  if (!isValidCount(concurrency)) {
    throw new Error(`Invalid concurrency value ${concurrency}. Expected either a positive non-zero integer, or Infinity.`);
  }

  if (!isValidCount(maxDepth)) {
    throw new Error(`Invalid maxDepth value ${maxDepth}. Expected either a positive non-zero integer, or Infinity.`);
  }

  return {
    async search (location: string): Promise<T[]> {
      const results: T[] = [];
      const root = path.resolve(location);

      const processEntry = async ([relative, depth]: [string, number]) => {
        const info = await makeFileInfo(root, relative);
        if (info.hidden && !includeHidden) {
          return; // this is a "hidden" dot file/folder, skip it unless we've been configured to include it
        }
        if (info.isDirectory) {
          // if we have reached the max depth then don't visit the contents of this folder
          if (depth < maxDepth) {
            if (exclude && await exclude(info)) {
              return; // if the exclusion folder indicates we should ignore this folder then exit here
            }
            // add all the entries of the folder to the queue
            for (const entry of await fs.promises.readdir(info.absolute)) {
              add(path.join(relative, entry), depth + 1);
            }
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
      };

      const { add, complete } = queue({ concurrency, fn: processEntry, recover });

      // add the entry location to the queue to kick us off
      add('', 0);
      // waits until the queue is empty, or an error occurs
      await complete;
      return results;
    }
  };
}