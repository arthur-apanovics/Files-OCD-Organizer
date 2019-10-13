import lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import { IFileMappingConfig } from "./fileUtil";

export interface IConfig {
  downloadsDirectory: string;
  sortExisitngFiles: boolean;
  moveUnknownFiles: boolean;
  fileTypeMappings: IFileMappingConfig[];
}

export interface FileLogEntry {
  timestamp: Date;
  file: string;
  originalDirectory: string;
  newDirectory: string;
}

let Database: lowdb.LowdbSync<any>;
const adapter = new FileSync("build/db.json");
Database = lowdb(adapter);

let defaults: { config: IConfig; fileLogs: FileLogEntry[] } = {
  config: {
    downloadsDirectory: "D:/Downloads",
    sortExisitngFiles: false,
    moveUnknownFiles: false,
    fileTypeMappings: [
      { type: "unknown", targetDirectory: "unknown", extensions: ["?"] },
      {
        type: "image",
        targetDirectory: "images",
        extensions: [
          "jpg",
          "png",
          "gif",
          "webp",
          "tiff",
          "psd",
          "raw",
          "bmp",
          "heif",
          "indd",
          "svg",
          "eps",
          "icns",
          "ico"
        ]
      },
      {
        type: "video",
        targetDirectory: "videos",
        extensions: [
          "3g2",
          "3gp",
          "avi",
          "flv",
          "h264",
          "m4v",
          "mkv",
          "mov",
          "mp4",
          "mpg",
          "rm",
          "swf",
          "vob",
          "wmv"
        ]
      },
      {
        type: "executable",
        targetDirectory: "executables",
        extensions: [
          "bat",
          "bin",
          "cgi",
          "com",
          "exe",
          "gadget",
          "jar",
          "py",
          "wsf"
        ]
      },
      {
        type: "installers",
        targetDirectory: "installers",
        extensions: ["apk", "msi"]
      },
      {
        type: "audio",
        targetDirectory: "audio",
        extensions: [
          "aif",
          "cda",
          "mid",
          "mp3",
          "mpa",
          "ogg",
          "wav",
          "wma",
          "wpl"
        ]
      },
      {
        type: "archive",
        targetDirectory: "archives",
        extensions: ["7z", "arj", "deb", "pkg", "rar", "rpm", "tar", "z", "zip"]
      },
      {
        type: "font",
        targetDirectory: "fonts",
        extensions: ["fnt", "fon", "otf", "ttf"]
      },
      {
        type: "source-code",
        targetDirectory: "source-code",
        extensions: [
          "c",
          "class",
          "cpp",
          "cs",
          "h",
          "java",
          "sh",
          "swift",
          "vb",
          "cfg",
          "ini"
        ]
      },
      {
        type: "presentation",
        targetDirectory: "office/presentations",
        extensions: ["key", "odp", "pps", "ppt", "pptx"]
      },
      {
        type: "spreadsheet",
        targetDirectory: "office/spreadsheets",
        extensions: ["ods", "xlr", "xls", "xlsx"]
      },
      {
        type: "word-processor",
        targetDirectory: "office/documents",
        extensions: [
          "doc",
          "docx",
          "odt",
          "pdf",
          "rtf",
          "tex",
          "txt",
          "wks",
          "wpd"
        ]
      },
      {
        type: "system",
        targetDirectory: "system",
        extensions: [
          "bak",
          "cab",
          "cpl",
          "cur",
          "dll",
          "dmp",
          "drv",
          "lnk",
          "sys",
          "tmp"
        ]
      },
      {
        type: "p2p",
        targetDirectory: "arrrgh",
        extensions: [".torrent"]
      }
    ]
  },
  fileLogs: []
};

Database.defaults(defaults).write();

export default Database;
