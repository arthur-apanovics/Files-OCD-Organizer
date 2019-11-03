import FS, { Dirent, Stats } from 'fs';
import Database, { DatabaseTable, IConfig } from './database';
import './extensions';
import {
  ApplicationLogEntry,
  ExceptionLogEntry,
  FileLogEntry,
  Log
} from './log';
import Timeout = NodeJS.Timeout;

export interface IFileMappingConfig
{
  type: string;
  targetDirectory: string;
  extensions: string[];
}

type FileAddedEventData = { filePath: string, stats: Stats };

const config: IConfig = Database.get('config').value();

export default class FileUtil
{
  public static readonly ConfigKey: string = 'fileTypeMappings';

  private static _pathMappings: IFileMappingConfig[];

  private static get pathMappings(): IFileMappingConfig[]
  {
    return (
      this._pathMappings ||
      (this._pathMappings =
        Database.get(`config.${FileUtil.ConfigKey}`).value()) ||
      new Error('No path mappings defined!')
    );
  }

  private static _unknownPathMapping: IFileMappingConfig;

  private static get unknownPathMapping(): IFileMappingConfig
  {
    if (!this._unknownPathMapping)
    {
      const mapping = FileUtil.pathMappings.find(
        ({type}) => type === 'unknown'
      );
      if (!mapping)
      {
        throw new Error('"unknown" file mapping not defined');
      }

      this._unknownPathMapping = mapping;
    }

    return this._unknownPathMapping;
  }

  public static GetConfigForExtension(
    extension: string
  ): IFileMappingConfig
  {
    extension = extension.replace('.', '');

    return (
      FileUtil.pathMappings.find(({extensions}) =>
        extensions.includes(extension)
      ) || this.unknownPathMapping
    );
  }

  public static AddConfig(mappingConfig: IFileMappingConfig): Promise<any>
  {
    // TODO Check return of write()
    return Database.get(`config.${FileUtil.ConfigKey}`)
    // @ts-ignore
      .push(mappingConfig)
      .write();
  }

  public static async MoveFilesAsync(files: Dirent[]): Promise<void>
  {
    try
    {
      const filesSortedByExtension = files.sort((a, b) =>
      {
        return a.extension.localeCompare(b.extension);
      });

      for (const file of filesSortedByExtension)
      {
        const pathMappingConf = FileUtil.GetConfigForExtension(
          file.extension
        );

        // TODO Batch move
        await FileUtil.MoveFileByMappingConfig(file, pathMappingConf);
      }
    }
    catch (e)
    {
      throw e;
    }
  }

  public static async ScheduleMoveFileAsync(
    direntOrEventData: Dirent | FileAddedEventData,
    delayInMinutes: number,
    mappingConfig?: IFileMappingConfig
  ): Promise<Timeout>
  {
    const filePath = FileUtil.IsDirent(direntOrEventData)
      ? config.downloadsDirectory + direntOrEventData.name
      : direntOrEventData.filePath;
    const extension = Dirent.prototype.getExtension(filePath);

    Log(new ApplicationLogEntry(
      `Scheduling file move in ${delayInMinutes} minutes for file`, filePath));

    return setTimeout(() =>
    {
      mappingConfig =
        mappingConfig || FileUtil.GetConfigForExtension(extension);

      FileUtil.MoveFileByMappingConfig(direntOrEventData, mappingConfig);
    }, delayInMinutes /** 1000*/); //todo!!!!!!!!!!!!!!!!!!!!!!!!!
  }

  public static MoveFileByMappingConfig(
    direntOrEventData: Dirent | FileAddedEventData,
    mappingConfig: IFileMappingConfig
  ): void
  {
    let filename, oldPath;
    if (FileUtil.IsDirent(direntOrEventData))
    {
      filename = direntOrEventData.name;
      oldPath = config.downloadsDirectory + direntOrEventData.name;
    }
    else
    {
      filename = FileUtil.GetFilenameFromPath(direntOrEventData.filePath);
      oldPath = direntOrEventData.filePath;
    }

    FileUtil.EnsureTargetDirExists(mappingConfig);

    const newPathBase = FileUtil.GetNewPathBase(mappingConfig);
    let newPath: string;

    if (mappingConfig !== this.unknownPathMapping || config.moveUnknownFiles)
    {
      if (config.sortByYear)
      {
        const fileStats = FileUtil.IsDirent(direntOrEventData)
          ? FS.statSync(oldPath)
          : direntOrEventData.stats;
        const year = fileStats.birthtime.getFullYear();
        const yearDirFullPath = newPathBase + year;

        FileUtil.EnsureDirExists(yearDirFullPath);
        newPath = `${yearDirFullPath}/${filename}`;
      }
      else
      {
        newPath = `${newPathBase}/${filename}`;
      }

      FileUtil.MoveFile(oldPath, newPath);

      Log(new FileLogEntry(filename, 'move', oldPath, newPath));
    }
    else
    {
      Log(new FileLogEntry(filename, 'skip', oldPath, ''));
    }
  }

  public static CheckPathEndsWithSlash(path: string): string
  {
    // TODO support backslashes
    return path.lastIndexOf('/') === path.length - 1 ? path : path + '/';
  }

  private static MoveFile(oldPath: string, newPath: string): boolean
  {
    try
    {
      FS.renameSync(oldPath, newPath);

      return true;
    }
    catch (e)
    {
      Log(new ExceptionLogEntry('Unable to move file', e.message, e.stack));

      return false;
    }
  }

  private static GetNewPathBase(mappingConfig: IFileMappingConfig): string
  {
    return config.downloadsDirectory
      + FileUtil.GetTargetDirectoryName(mappingConfig)
      + '/';
  }

  private static GetTargetDirectoryName(mappingConfig: IFileMappingConfig): string
  {
    return config.targetDirectoryPrefix + mappingConfig.targetDirectory;
  }

  private static EnsureDirExists(fullDirPath: string): void
  {
    if (!FS.existsSync(fullDirPath))
    {
      FS.mkdirSync(fullDirPath, {recursive: true});

      Log(new ApplicationLogEntry('Created new directory', fullDirPath));
    }
  }

  private static EnsureTargetDirExists(mappingConfig: IFileMappingConfig): void
  {
    const targetDir = FileUtil.GetTargetDirectoryName(mappingConfig);
    const fullPath = config.downloadsDirectory + targetDir;

    FileUtil.EnsureDirExists(fullPath);
  }

  private static IsDirent(file: Dirent | unknown): file is Dirent
  {
    return file instanceof Dirent;
  }

  //todo suppoert windows forward-slash
  private static GetFilenameFromPath(fullPath: string): string
  {
    const startIndex = (fullPath.indexOf('\\') >= 0
      ? fullPath.lastIndexOf('\\')
      : fullPath.lastIndexOf('/'));
    let filename = fullPath.substring(startIndex);
    if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0)
    {
      filename = filename.substring(1);
    }

    return filename;
  }
}

// do some maintenance work with path
Database.get(DatabaseTable.config)
// @ts-ignore
  .assign({
    downloadsDirectory:
      FileUtil.CheckPathEndsWithSlash(
        Database.get(`${DatabaseTable.config}.downloadsDirectory`)
          .value()),
  })
  .write();
