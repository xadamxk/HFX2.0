import { globSync } from "fs";
import { sep } from "path";

/**
 * Drop-in for globby's sync(): match files with Node's built-in glob and
 * return sorted, "/"-separated paths (the templates split paths on "/").
 */
export function sync(pattern: string): string[] {
  return globSync(pattern)
    .map((file) => file.split(sep).join("/"))
    .sort();
}
