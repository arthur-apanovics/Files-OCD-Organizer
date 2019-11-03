import Database, { DatabaseTable } from './database';

interface ILogEntry
{
  timestamp?: Date;

  Write(): unknown;
}

export interface IFileLogEntry extends ILogEntry
{
  file: string;
  operation: 'move' | 'skip';
  originalDirectory: string;
  newDirectory: string;
}

export interface IApplicationLogEntry extends ILogEntry
{
  entry: string;
  additionalInformation?: string;
}

export interface IExceptionLogEntry extends ILogEntry
{
  title: string;
  message: string;
  stackTrace: string;
}

abstract class LogEntry implements ILogEntry
{
  protected constructor(
    protected table: DatabaseTable,
    public timestamp?: Date
  )
  {
    if (!timestamp)
    {
      this.timestamp = new Date();
    }
  }

  public Write()
  {
    // https://stackoverflow.com/a/55309352
    const omit = (prop: string, { [prop]: _, ...rest }) => rest;

    const thisWithoutTable = omit('table', this);

    return (
      Database.get(this.table)
      // @ts-ignore
        .push(thisWithoutTable)
        .write()
    );
  }
}

export class FileLogEntry extends LogEntry implements IFileLogEntry
{
  constructor(
    public file: string,
    public operation: 'move' | 'skip',
    public originalDirectory: string,
    public newDirectory: string,
    timestamp?: Date
  )
  {
    super(DatabaseTable.fileLog, timestamp);
  }
}

export class ExceptionLogEntry extends LogEntry implements IExceptionLogEntry
{
  constructor(
    public title: string,
    public message: string,
    public stackTrace: string,
    timestamp?: Date
  )
  {
    super(DatabaseTable.exceptionLog, timestamp);
  }
}

export class ApplicationLogEntry extends LogEntry implements IApplicationLogEntry
{
  constructor(
    public entry: string,
    public additionalInformation?: string,
    timestamp?: Date
  )
  {
    super(DatabaseTable.appLog, timestamp);
  }
}

export async function Log(entry: ILogEntry): Promise<string>
{
  const entryConcat = Object.values(entry).join(', ');
  console.log(entryConcat);
  entry.Write();

  return entryConcat;
}
