import * as fs from "fs";
import * as path from "path";

/**
 * Some files in the repo root aren't bundled but are fetched from GitHub at
 * runtime (raw.githubusercontent.com/xadamxk/HFX2.0/develop/...). Moving,
 * renaming or breaking them affects every installed copy of HFX, so guard
 * against them being removed as "unused".
 */
const repoRoot = path.resolve(__dirname, "..");

const readRootJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, file), "utf8"));

/** Files named in the current features' raw.githubusercontent.com URLs. */
const fetchedFiles = (sourceFile: string): string[] => {
  const source = fs.readFileSync(path.join(__dirname, sourceFile), "utf8");
  const urls = source.match(
    /raw\.githubusercontent\.com\/xadamxk\/HFX2\.0\/develop\/[^"'?`]+/g
  );
  return (urls ?? []).map((url) => url.split("/develop/")[1]);
};

describe("runtime-fetched repo files", () => {
  it.each([
    ["features/hfx/HFXAlerts.ts", "alert.json"],
    ["features/hfx/HFXBadges.ts", "badges.json"],
  ])("%s fetches %s from the repo root", (sourceFile, file) => {
    expect(fetchedFiles(sourceFile)).toEqual([file]);
    expect(fs.existsSync(path.join(repoRoot, file))).toBe(true);
  });

  it("alert.json has the fields HFXAlerts reads", () => {
    const alert = readRootJson("alert.json");
    expect(typeof alert.AlertKey).toBe("number");
    expect(typeof alert.AlertTitle).toBe("string");
    expect(typeof alert.AlertValue).toBe("string");
  });

  it("badges.json is valid JSON", () => {
    expect(typeof readRootJson("badges.json")).toBe("object");
  });

  // Fetched by HFX 2.x releases (EmoteLibrary, LegacyReputation)
  it.each(["emotes.json", "reputationArchive.json"])(
    "legacy %s is still valid JSON",
    (file) => {
      expect(typeof readRootJson(file)).toBe("object");
    }
  );
});
