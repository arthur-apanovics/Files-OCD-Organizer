import chokidar from 'chokidar';
import { FileUtil } from './fileUtil';
import fs from 'fs';
import database, { IConfig } from './database';

const config: IConfig = database.get('config').value();

let files = fs
  .readdirSync(config.downloadsDirectory, { withFileTypes: true })
  .filter(f => f.isFile());

if (config.sortExisitngFiles) {
  FileUtil.performInitialSort(files);
}

const fileWatcher = chokidar.watch(config.downloadsDirectory, {
  depth: 0,
  ignoreInitial: true, // todo incorporate with config?
  awaitWriteFinish: {
    pollInterval: 100, //def: 100
    stabilityThreshold: 2000 //def: 2000
  }
});

fileWatcher.on('add', (file, stats) => {
  console.log('File added?', file);
});
