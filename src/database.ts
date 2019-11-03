import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { IFileMappingConfig } from './fileUtil';
import { IApplicationLogEntry, IExceptionLogEntry, IFileLogEntry } from './log';

// todo: filter out unused files? fs.fileStats provides last access,
// last change, last modify times...
export interface IConfig
{
  /**
   * Path do Downloads dir
   * //TODO: get from system automatically
   */
  downloadsDirectory: string;
  /**
   * After moving file to new directory, should the file be further sorted by
   * file creation year
   */
  sortByYear: boolean;
  /**
   * Sort existing files in downloads dir
   */
  sortExisitngFiles: boolean;
  /**
   * Should we move files that don't have a config defined
   */
  moveUnknownFiles: boolean;
  /**
   * Prefix for target directories
   */
  targetDirectoryPrefix: string;
  /**
   * Time to wait, in minutes, before actually moving a file
   */
  moveDelayInMinutes: number;
  /**
   * Mapping configurations
   */
  fileTypeMappings: IFileMappingConfig[];
}

export enum DatabaseTable
{
  config = 'config',
  appLog = 'applicationLog',
  fileLog = 'fileLog',
  exceptionLog = 'exceptionLog',
}

const Database: lowdb.LowdbSync<any> = lowdb(new FileSync('db.json'));

const defaults: {
  config: IConfig;
  applicationLog: IApplicationLogEntry[];
  fileLog: IFileLogEntry[];
  exceptionLog: IExceptionLogEntry[];
} = {
  config: {
    downloadsDirectory: 'D:/Downloads/',
    sortByYear: true,
    sortExisitngFiles: true,
    moveUnknownFiles: true,
    targetDirectoryPrefix: '_',
    moveDelayInMinutes: 5,
    fileTypeMappings:
      [
        {type: 'unknown', targetDirectory: 'unknown', extensions: ['?']},
        {
          type: 'image',
          targetDirectory: 'images',
          extensions: [
            'jpg',
            'png',
            'gif',
            'webp',
            'tiff',
            'psd',
            'raw',
            'bmp',
            'heif',
            'indd',
            'svg',
            'eps',
            'icns',
            'ico',
          ],
        },
        {
          type: 'video',
          targetDirectory: 'videos',
          extensions: [
            '3g2',
            '3gp',
            'avi',
            'flv',
            'h264',
            'm4v',
            'mkv',
            'mov',
            'mp4',
            'mpg',
            'rm',
            'swf',
            'vob',
            'wmv',
          ],
        },
        {
          type: "executable",
          targetDirectory: "executables",
          extensions: [
            "bat",
            "bin",
            "cgi",
            "com",
            // "exe",
            "gadget",
            "jar",
            "py",
            "wsf",
          ]
        },
        {
          type: 'installers',
          targetDirectory: 'installers',
          extensions: ['apk', 'msi', 'exe'],
        },
        {
          type: 'audio',
          targetDirectory: 'audio',
          extensions: [
            'aif',
            'cda',
            'mid',
            'mp3',
            'mpa',
            'ogg',
            'wav',
            'wma',
            'wpl',
          ],
        },
        {
          type: 'archive',
          targetDirectory: 'archives',
          extensions: [
            '7z',
            'arj',
            'deb',
            'pkg',
            'rar',
            'rpm',
            'tar',
            'z',
            'zip',
          ],
        },
        {
          type: 'font',
          targetDirectory: 'fonts',
          extensions: ['fnt', 'fon', 'otf', 'ttf'],
        },
        {
          type: 'source-code',
          targetDirectory: 'source-code',
          extensions: [
            'c',
            'class',
            'cpp',
            'cs',
            'h',
            'java',
            'sh',
            'swift',
            'vb',
            'cfg',
            'ini',
          ],
        },
        {
          type: 'presentation',
          targetDirectory: 'office/presentations',
          extensions: ['key', 'odp', 'pps', 'ppt', 'pptx'],
        },
        {
          type: 'spreadsheet',
          targetDirectory: 'office/spreadsheets',
          extensions: ['ods', 'xlr', 'xls', 'xlsx'],
        },
        {
          type: 'word-processor',
          targetDirectory: 'office/documents',
          extensions: [
            'doc',
            'docx',
            'odt',
            'pdf',
            'rtf',
            'tex',
            'txt',
            'wks',
            'wpd',
          ],
        },
        {
          type: 'system',
          targetDirectory: 'system',
          extensions: [
            'bak',
            'cab',
            'cpl',
            'cur',
            'dll',
            'dmp',
            'drv',
            'lnk',
            'sys',
            'tmp',
          ],
        },
        {
          type: 'p2p',
          targetDirectory: 'arrrgh',
          extensions: ['.torrent'],
        },
      ],
  },
  applicationLog: [],
  fileLog: [],
  exceptionLog: [],
};

// writes defaults if json is empty
Database.defaults(defaults).write();

export default Database;
