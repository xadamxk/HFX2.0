import { Util } from "./Util";

export class Logger {
  static debug(message: string, ...opts: any[]) {
    if (Util.isDevelopment()) {
      console.log(`%c[GES] DEBUG: ${message}`, "color: #87CEEB", ...opts);
    }
  }
  static log(message: string, ...opts: any[]) {
    console.log(...[`[GES] ${message}`, ...opts]);
  }
  static error(message: string, ...opts: any[]) {
    console.error(...[`[GES] ${message}`, ...opts]);
  }
  static warn(message: string, ...opts: any[]) {
    console.warn(...[`[GES] ${message}`, ...opts]);
  }
  static group(label?: string) {
    console.group(`[GES] ${label}`);
  }
  static groupCollapsed(label?: string) {
    console.groupCollapsed(`[GES] ${label}`);
  }
  static groupEnd() {
    console.groupEnd();
  }
  static time(label?: string) {
    console.time(`[GES] ${label}`);
  }
  static timeEnd(label?: string) {
    console.timeEnd(`[GES] ${label}`);
  }
  static timeLog(label?: string) {
    console.timeLog(`[GES] ${label}`);
  }
  static profile(label?: string) {
    console.profile(`[GES] ${label}`);
  }
  static profileEnd(label?: string) {
    console.profileEnd(`[GES] ${label}`);
  }
  static table(data?: any[], properties?: string[]) {
    console.table(data, properties);
  }
}
