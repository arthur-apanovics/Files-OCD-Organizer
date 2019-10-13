import database, { IConfig } from "./database";
import { Dirent } from "fs";

export interface IFileMappingConfig {
  type: string;
  targetDirectory: string;
  extensions: string[];
}

type DirentPlus = Dirent & { extension: string };

let __config: IConfig = database.get("config").value();

export class FileUtil {
  static get pathMappings(): IFileMappingConfig[] {
    return (
      this._pathMappings || (this._pathMappings = FileUtil.getConfigFromDb())
    );
  }
  static get unknownPathMapping(): IFileMappingConfig {
    if (!this._unknownPathMapping) {
      let mapping = FileUtil.pathMappings.find(({ type }) => type == "unknown");
      if (!mapping) {
        throw new Error('"unknown" file mapping not defined');
      }
      this._unknownPathMapping = mapping;
    }

    return this._unknownPathMapping;
  }

  public static readonly configKey: string = "fileTypeMappings";

  private static _pathMappings: IFileMappingConfig[];
  private static _unknownPathMapping: IFileMappingConfig;

  public static findConfigForFileExtension(
    extension: string
  ): IFileMappingConfig {
    extension = extension.replace(".", "");

    return (
      FileUtil.pathMappings.find(({ extensions }) =>
        extensions.includes(extension)
      ) || this._unknownPathMapping
    );
  }

  private static getConfigFromDb() {
    return database.get(`config.${FileUtil.configKey}`).value();
  }

  public static addConfig(config: IFileMappingConfig) {
    database
      .get(`config.${FileUtil.configKey}`)
      // @ts-ignore
      .push(config)
      .write();
  }

  public static performInitialSort(files: Dirent[]) {
    let filesPlus: DirentPlus[] = Array.from(files, file => {
      return Object.assign(file, {
        extension: file.name.substr(
          file.name.lastIndexOf(".") + 1,
          file.name.length
        )
      });
    });

    let filesSorted = filesPlus.sort((a, b) => {
      return a.extension.localeCompare(b.extension);
    });

    for (let file of filesSorted) {
      let pathMappingConf = FileUtil.findConfigForFileExtension(file.extension);
      if (pathMappingConf !== this._unknownPathMapping || __config.moveUnknownFiles) {
        FileUtil.moveFileByMappingConfig(file, pathMappingConf);
      } else {
        // todo log skipped file
      }
    }
  }

  public static moveFileByMappingConfig(
    file: Dirent | DirentPlus,
    pathMappingConfig: IFileMappingConfig
  ) {
    console.log(
      `Moved "${file.name}" to "${pathMappingConfig.targetDirectory}"`
    );
  }
}
