import * as fs from "fs";
import * as path from "path";

const srcDir = __dirname;
const manifest = JSON.parse(
  fs.readFileSync(path.join(srcDir, "manifest.json"), "utf8")
);

// Every non-test .ts file under dir, recursively
const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [fullPath]
      : [];
  });

/**
 * Assets the content script hands to hackforums.net pages via Util.getURL().
 * The options page (src/configuration) runs on the extension's own origin,
 * so its assets don't need to be web accessible.
 */
const pageAssets = (): string[] => {
  const assets = new Set<string>();
  const configurationDir = path.join(srcDir, "configuration");
  sourceFiles(srcDir)
    .filter((file) => !file.startsWith(configurationDir))
    .forEach((file) => {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(/getURL\(\s*["'`]\/?(assets\/[^"'`]+)["'`]/g)) {
        assets.add(match[1]);
      }
    });
  return [...assets].sort();
};

describe("manifest.json", () => {
  const war = manifest.web_accessible_resources;
  const resources: string[] = war.flatMap((entry: any) => entry.resources);

  it("does not request host permissions beyond the content script match", () => {
    expect(manifest.host_permissions).toBeUndefined();
  });

  it("only exposes specific files to the page, not whole asset folders", () => {
    resources.forEach((resource) => expect(resource).not.toContain("*"));
    war.forEach((entry: any) => expect(entry.use_dynamic_url).toBe(true));
  });

  it("exposes exactly the assets the content script loads on the page", () => {
    const used = pageAssets();
    expect(used.length).toBeGreaterThan(0);
    expect([...resources].sort()).toEqual(used);
  });

  it("only lists web accessible resources that exist", () => {
    resources.forEach((resource) =>
      expect(fs.existsSync(path.join(srcDir, resource))).toBe(true)
    );
  });

  it("keeps both background keys (Chrome service worker, Firefox scripts)", () => {
    expect(manifest.background.service_worker).toBe("serviceWorker.js");
    expect(manifest.background.scripts).toEqual(["serviceWorker.js"]);
  });
});
