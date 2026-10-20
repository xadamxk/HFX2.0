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
  static table(data?: any[], properties?: string[]) {
    console.table(data, properties);
  }

  /**
   * Create a logger whose messages are tagged with the given scope (e.g. a feature class).
   */
  static scope(name: string): ScopedLogger {
    return new ScopedLogger(name);
  }
}

type LogLevel = "debug" | "log" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  opts: any[];
}

/**
 * Logger tagged with a scope name. While buffering, entries are held in memory so
 * features can load in parallel and still have their logs printed as one group.
 * Outside of buffering (or after flushing), entries are printed immediately.
 */
export class ScopedLogger {
  private entries: LogEntry[] | null = null;

  constructor(readonly name: string) {}

  debug(message: string, ...opts: any[]) {
    // Skip buffering entries that would never be printed
    if (!Util.isDevelopment()) return;
    this.write("debug", message, opts);
  }
  log(message: string, ...opts: any[]) {
    this.write("log", message, opts);
  }
  warn(message: string, ...opts: any[]) {
    this.write("warn", message, opts);
  }
  error(message: string, ...opts: any[]) {
    this.write("error", message, opts);
  }

  /**
   * Hold entries until flush() is called.
   */
  startBuffering() {
    this.entries ??= [];
  }

  /**
   * Print buffered entries inside a collapsed group, then resume printing immediately.
   */
  flush(label: string) {
    const entries = this.entries ?? [];
    this.entries = null;

    Logger.groupCollapsed(label);
    entries.forEach((entry) => this.print(entry));
    Logger.groupEnd();
  }

  private write(level: LogLevel, message: string, opts: any[]) {
    const entry = { level, message, opts };
    if (this.entries) {
      this.entries.push(entry);
    } else {
      this.print(entry);
    }
  }

  private print({ level, message, opts }: LogEntry) {
    Logger[level](`[${this.name}] ${message}`, ...opts);
  }
}
