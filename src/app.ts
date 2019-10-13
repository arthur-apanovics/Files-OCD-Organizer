import { FileUtil } from "./fileUtil";
import fs from "fs";
import database, {IConfig} from "./database";

const config: IConfig = database.get("config").value();

let files = fs
  .readdirSync(config.downloadsDirectory, { withFileTypes: true })
  .filter(f => f.isFile());

//todo !!!!!!!
if (!config.sortExisitngFiles){
  FileUtil.performInitialSort(files);
}

debugger;
