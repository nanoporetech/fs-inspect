# File Scanner ( working name )

File Scanner is a library written in TypeScript for Node.js. It's function is to iterate over a tree of files, and return a list of files that interest the consumer.

It's not the only library of this type, it's API is actually inspired by fdir. It's aim is to be simple to use, easy to maintain and use sensible defaults. As such maximum performance is not a primary goal like fdir, but optimisations will be included if they do not oppose the primary aims.

## Usage

To use File Scanner you first create a "crawler" which defines the behaviour of the file scan. Once you have a crawler you call it with a location and it returns a list of files.

```typescript

import { crawler } from 'file_scanner';

async function main() {
  const my_crawler = crawler();
  const files = await my_crawler.crawl('~/Pictures');
}
```


By default this will return all files, but not folders. Additionally any hidden folder ( e.g. `.git` ) will not be scanned, and hidden files will not be included in the output. Both of these features are configurable.

Crawlers return more than just the file name or the file path, they return a FileInfo object that includes things like the path relative to the root of the scanner, the last modified date, the file extension and more. This comes at little performance cost, as fstat _must_ be called on each entry to discover if it is a folder or not.

In the given example `crawler` is called with no parameters, in this scenario it's because we are relying on the sensible defaults. In most scenarios it will likely be enough, but it is also possible to specify a number of options for modifying the behaviour. We have already mentioned `includeHidden` and `includeFolder`, which include hidden entries and folders into the output respectively. In additon you can also specify an `exlude` function which can be used to exclude folders from the scan, or a `filter` function that can remove files from the output. There are also plans to add a `map` function that transforms the output into a custom format. Any of the function options can be sync or async, allowing more complex operations to be included in the scanner, such as file hashing or checking if a file exists in a database.

## Customisable rate limit

Performing naive recursive file operations on large directories can cause resource congestion, and in extreme scenarios may fail due to file handle limits. To avoid this File Scanner includes an internal concurrent queueing system, allowing a cap on how many operations are being performed at once. The number of concurrent operations can be configured if required, but the default is intended to be sensible. Consumer specified functions are included in this restriction, allowing you to ensure you aren't performing use numbers of DB accesses or file hashes at once, but also not limiting yourself to processing a single item at a time.

## Observing file system changes

At this time File Scanner does not observe real time changes, but it will be considered for a future version.
