import { Dirent } from "fs";

declare module 'fs'
{
  interface Dirent
  {
    extension: string;
    getExtension(file: string): string;
  }
}

Object.defineProperty(Dirent.prototype, 'extension', {
  get(): string
  {
    return Dirent.prototype.getExtension(this.name);
  },
});

Dirent.prototype.getExtension =
  file => file.substr(file.lastIndexOf('.') + 1, file.length);

export {};
