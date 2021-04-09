# fs-inspect

**fs-inspect** is a library written in TypeScript for Node.js. It searches a location on the file system and return a list of useful files.

Many other similar libraries exist, but most only provide the simplest of APIs and require large amounts of code to get the files you want. Instead our aim is to be simple to use, easy to maintain and to use sensible defaults. For most uses it should be possible to use FS Inspect with either no parameters, or some simple flags and get *exactly* the list of files you want. Unlike some libraries maximum performance is not a primary goal, but it is still a priority so long as it doesn't hinder usability.

## Install

Releases are available on the npm repository and our GitHub releases page. ESM and CJS formats are both included, as well as TypeScript type definition files.

```bash
npm install fs-inspect
```

## Usage

First you must create an inspector, which describes *how* you want to search. This inspector can then be used multiple searches.

```typescript
import { createInspector, filterByExtension } from 'fs-inspect';

async function main() {
  const { search } = createInspector({ filter: filterByExtension(['png', 'jpg'])});
  const imageFiles = await search('~/Pictures');
}
```

By default this will return all files, but not folders within the target folder. Hidden files and folders are skipped by default. In this example the `filterByExtensions` helper is used to include only the PNG and JPG files within the folder.

An inspector returns more than just the file names though, a comprehensive description of each file is returned. This comes at little performance cost as we have all the information already from deciding if the entry is a file or folder via `fstat`. When you actually need this information it will give you a performance improvement versus libraries that only return the filenames, because with those libraries you would have to call `fstat` a second time on each file.

## Filtering, excluding and mapping

There are several ways to manipulate the results as they are being generated with custom functions. These functions can be sync or async, and all receive a FileInfo object as an argument.

### Filtering

Before each item is added to the results it can optionally be omitted using a 'filter' function. If 'includeFolders' is true then folders will be passed to the filter function, but the filter will not prevent the children of the folder from being visited.

```typescript
import { createInspector } from 'fs-inspect';

async function main() {
  const epoch = (new Date('1 January 2021')).getTime();
  // ignore files that were created before this year
  const { search } = createInspector({
    filter: ({ created }) => created > epoch
  });

  const documents = await search('~/Documents');
}
```

### Excluding

When a folder is visited an optional 'exclude' function can be used to indicate that the children of the folder should be skipped, which has obvious performance advantages if you wish to skip large parts of the file tree. If 'includeFolders' is true then excluded folders will not be included in the results, so you will not have to use 'filter' to skip them.

```typescript
import { createInspector } from 'fs-inspect';

async function main() {
  const ignoredFolders = new Set(['dist', 'node_modules']);
  // look for js files, but not in our dist or node_modules folder
  const { search } = createInspector({
    exclude: ({ name }) => ignoredFolders.has(name),
    filter: ({ ext }) => ext === '.js'
  });

  const sources = await search('~/Developer/my_project');
}
```

### Mapping

The output from an inspector is normally composed of FileInfo objects. However, if you wish to transform this in some way you can specify a 'map' function to modify each item as it's emitted. This is handy if you want to add additional information to the output ( such as a hash of the file contents ), convert the file somehow or just emit one part of the FileInfo.

```typescript
import { createInspector } from 'fs-inspect';

async function main() {
  const { search } = createInspector({
    async map ({ absolute: location }) {
      const hash = await hashFile(location);
      return {
        location,
        hash
      };
    }
  });

  const stats = await search('~/Developer/my_project/assets');
}
```

## Concurrency

Performing naive recursive file operations on large directories can cause high resource usage, and in extreme scenarios may fail due to system limitations. To avoid this fs-inspect includes an internal queueing system, restricting how many operations are being performed at once. The limit can be customized, or removed at the user discretion.

Filter, Exclude and Map functions operate within the queue as well as internal logic, allowing you to perform relatively expensive operations within these functions without having to worry about scaling issues with larger file trees.

A side effect of this system is that the results will not be in a consistent order due to small timing variations.

Depending on your requirements and system capabilities increasing the concurrency limit *may* increase throughput. This mostly helps if operations have a high latency; you can start more and have them waiting. However, if one part of the system is bottle necked ( for example a slow mechanical hard drive ) you may be hitting it with a large number of requests that it cannot fulfil negating any benefit.

```typescript
import { createInspector } from 'fs-inspect';

// will process 1 item at a time
const sequential = createInspector({ concurrency: 1 });
// will process items as soon as they are added
const unrestricted = createInspector({ concurrency: Infinity });
// 8 items can be processed at a time, this is the default value
const normal = createInspector({ concurrency: 8 }); 
```

## Depth limiting

If you have a very deep file tree and you are only interested in the top couple of levels you can specify a depth limit with the `maxDepth` option. By default there is no limit (Infinity). The minimum value is 1, which is _just_ the direct children of the target folder.

## Hidden files/folders

Hidden files/folders ( ones whose name starts with a full stop ) are skipped by default, in the case of folders the children will also not be visited. The option `includeHidden` can be used to disable this behavior, ensuring all files are visited.

## Folders in output

Folders are not added to the output by default, you can include them using the `includeFolders` option.

## Root entry

If the target location for the search is a file, then only that file will be included in the output. Providing that it passes any filters you have specified. If it's a folder and `includeFolders` is set then it will be included in the output. In both cases the relative path will be an empty string, indicating that it is the root of the tree.

## Error recovery

If for some reason an error is thrown, either in internal logic or in a map/exclude/filter function, then the inspector will halt and throw the error. Any entries which are being processed will run to completion but no new ones will be started. In most cases this is the expected behavior, such as permission errors. It's possible to define your own recovery function using the `catch` option, the error and the relative location of the failed entry will be passed to the function where you can decide what to do. Throwing an error within this function will cause the search to stop, much as if you hadn't specified the option, anything else will allow the search to continue but that entry will halt wherever it failed and will not be added to the result list.

```typescript
import { createInspector } from 'fs-inspect';

const ignoreError = createInspector({
  catch (err, location) {
    // just log out the error and continue
    console.warn(`Issue with file  ${location} > ${err.message}`);
  }
});

const ignorePermissionError = createInspector({ catch (err, location) {
  if (err?.code !== 'EACCES') {
    throw err; // rethrow the error if it wasn't permissions, which will halt the search
  }
  console.warn(`Permission error with file ${location}`); // otherwise just log it and let the search continue
}});

```

## Reference

### Function: createInspector

  Function that accepts an optional `InspectorOptions` object and returns an new Inspector whose configuration is defined by the options object.

### Interface: Inspector

- ### Inspector.search

  Method that accepts a location on the filesystem as a string and returns an array of all matched items based on the options given to `createInspector`. Items will be `FileInfo` objects, unless a `map` option was specified in which case they will be the return value of the `map` function.

### Interface: InspectorOptions

- ### InspectorOptions.includeHidden

  An optional boolean flag that causes files and folders whose name begins with full stop should be visited while searching. Default value is false.

- ### InspectorOptions.includeFolders
  
  An optional boolean flag that causes folders to be included in the output. Default value is false.

- ### InspectorOptions.concurrency
  
  An optional positive non-zero integer which specifies that maximum number of items that can be processed at once. Infinity indicates no limit. Default value is 8.

- ### InspectorOptions.maxDepth

  An optional positive non-zero integer which specified the maximum search depth through the folder tree. Infinity indicates no limit. Default value is Infinity.

- ### InspectorOptions.exclude

  An optional function which is called with a FileInfo object as an argument for each folder ( including the root ), returning a truthy value will cause the folder and it's contents to not be visited or included in the result. Async functions are allowed. This is called before `filter`. Default value is undefined.

- ### InspectorOptions.filter

  An optional function which is called with a FileInfo object as an argument for each item, returning a falsey value will cause the item to not be included in the result. Async functions are allowed. This is called before `map`. Default value is undefined.

- ### InspectorOptions.map

  An optional function which is called with a FileInfo object as an argument for each item, the returned value will be added to the results instead of a FileInfo object. Async functions are allowed. This is called after `filter`. Default value is undefined.

- ### InspectorOptions.catch

  An optional function which is called with an error value and the relative path of the current item when an error is thrown. The source of this error can be FS operations or user defined `filter`/`exclude`/`map` functions. If this function is defined the default behavior of stopping the search is disabled, but throwing within this function will stop the search. Allowing for conditional recovery of certain errors. Async functions are allowed. No return value is expected.

### Interface: FileInfo

- ### FileInfo.isDirectory

  A boolean indicating if the item is a directory, and not a file.

- ### FileInfo.relative

  A string containing the location of the item relative to the entry point.

- ### FileInfo.absolute

  A string containing the absolute location of the file/folder.

- ### FileInfo.hidden

  A boolean indicating if the item is a hidden file/folder ( name begins with a full stop ). e.g. `.gitignore`.

- ### FileInfo.size

  A number containing the size of the item in bytes, folders have a size of 0.

- ### FileInfo.base

  A string containing the last portion of the location, including the name and extension. e.g. `profile_picture.jpg`.

- ### FileInfo.name

  A string containing the last portion of the location, without the extension. e.g. `profile_picture`.

- ### FileInfo.ext

  A string containing the extension of the location, including the preceding full stop. e.g. `.jpg`.

- ### FileInfo.created

  A number containing the time of file/folder creation in milliseconds.

- ### FileInfo.modified

  A number containing the last modified time of file/folder in milliseconds.
