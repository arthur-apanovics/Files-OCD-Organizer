import Chokidar from 'chokidar';
import FS from 'fs';
import Database, { IConfig } from './database';
import FileUtil from './fileUtil';
import { ApplicationLogEntry, ExceptionLogEntry, Log } from "./log";

const fileWatchConfig = {
  depth: 0,
  ignoreInitial: true, // todo incorporate with config?
  awaitWriteFinish: {
    pollInterval: 1000, // ms; def: 100
    stabilityThreshold: 4000, // ms; def: 2000
  },
};

try
{
  const config: IConfig = Database.get('config').value();

  // throw new Error('test');

  if (config.sortExisitngFiles)
  {
    console.info('Moving existing files in the background...');

    FS.readdir(config.downloadsDirectory, {
      withFileTypes: true,
    }, (err, files) =>
    {
      if (err)
      {
        throw err;
      }

      files = files.filter(f => f.isFile());
      FileUtil.MoveFilesAsync(files)
        .then((result) =>
        {
          Log(new ApplicationLogEntry
          ('Finished moving existing files',
            `${files.length} total files found`));
        })
        .catch(e => Log(new ExceptionLogEntry(
          'Error while moving existing files',
          `${e.message}`,
          e.stack)));
    });
  }

  const fileWatcher = Chokidar.watch(config.downloadsDirectory,
    fileWatchConfig);
  console.info(
    `Watching directory "${config.downloadsDirectory}" for new files with config:`,
    fileWatchConfig
  );

  fileWatcher.on('add', (file, stats) =>
  {
    FileUtil.ScheduleMoveFileAsync({
        filePath: file,
        stats: stats || FS.statSync(file)
      }
      , config.moveDelayInMinutes);
  });
}
catch (e)
{
  Log(new ExceptionLogEntry('Fatal error', e.message, e.stack));
  process.exit(1);
}
