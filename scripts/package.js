// Zips the build for both stores, with manifest.json at each zip's root and
// forward-slash paths. Run with `npm run package`, which builds first:
//   releases/hfx-<version>-chrome.zip          Chrome Web Store
//   releases/hfx-<version>-firefox.zip         Firefox Add-ons (AMO)
//   releases/hfx-<version>-firefox-source.zip  AMO's "source code" upload
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

function files(dir, prefix = "") {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(dir, entry.name), `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}`]
    );
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return ~crc >>> 0;
}

/** DOS date and time, as zip entries store them. */
function dosTime(date) {
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

function zip(entries) {
  const local = [];
  const central = [];
  let offset = 0;
  const { time, date } = dosTime(new Date());
  for (const { name, data } of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(0x0800, 6); // UTF-8 names
    header.writeUInt16LE(8, 8); // deflate
    header.writeUInt16LE(time, 10);
    header.writeUInt16LE(date, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    local.push(header, nameBytes, compressed);

    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4); // version made by
    record.writeUInt16LE(20, 6); // version needed
    record.writeUInt16LE(0x0800, 8);
    record.writeUInt16LE(8, 10);
    record.writeUInt16LE(time, 12);
    record.writeUInt16LE(date, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(nameBytes.length, 28);
    record.writeUInt32LE(offset, 42);
    central.push(record, nameBytes);

    offset += header.length + nameBytes.length + compressed.length;
  }
  const centralSize = central.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/**
 * Read a manifest as both stores need it: UTF-8 with no byte order mark.
 * (Windows editors' "UTF-8" adds a BOM, which Firefox rejects; their "ANSI"
 * breaks any non-ASCII character for Chrome.)
 */
function readManifest(file) {
  const bytes = fs.readFileSync(file);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    fail(`${file} starts with a byte order mark; save it as UTF-8 without BOM`);
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`${file} isn't valid UTF-8; save it as UTF-8 (not ANSI)`);
  }
  return JSON.parse(text);
}

/**
 * src/manifest.json serves both browsers. Chrome's copy drops the keys only
 * Firefox reads (the gecko settings and the background scripts fallback), so
 * the Chrome package loads without "unrecognized key" warnings.
 */
function chromeManifest(manifest) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { browser_specific_settings, background, ...rest } = manifest;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { scripts, ...chromeBackground } = background;
  return { ...rest, background: chromeBackground };
}

// What AMO reviewers need to rebuild the bundled, minified code
const SOURCE_FILES = [
  /^config\//,
  /^src\//,
  /^(package\.json|package-lock\.json|tsconfig\.json|tsconfig\.jest\.json|jest\.config\.js|setup-tests\.ts|eslint\.config\.mjs|\.prettierrc\.json|\.prettierignore|\.editorconfig|\.gitignore|README\.md|BUILDING\.md|contributing\.md)$/,
];

const manifestPath = path.join(dist, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  fail("No dist/manifest.json; run npm run build first");
}
const manifest = readManifest(manifestPath);
const { version } = require(path.join(root, "package.json"));
if (manifest.version !== version) {
  fail(
    `manifest.json is version ${manifest.version} but package.json is ${version}; make them match`
  );
}
if (!manifest.browser_specific_settings?.gecko?.id) {
  fail("src/manifest.json has no browser_specific_settings.gecko.id for AMO");
}

const names = files(dist);
const unexpected = names.filter((name) => /\.(map|ts)$|^\.|\/\./.test(name));
if (unexpected.length) {
  fail(`Unexpected files in dist/: ${unexpected.join(", ")}`);
}

/** The built extension, with `manifest` written as UTF-8 JSON (no BOM). */
function extension(manifest) {
  return names.map((name) => ({
    name,
    data:
      name === "manifest.json"
        ? Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8")
        : fs.readFileSync(path.join(dist, name)),
  }));
}

/** The source files AMO needs (tracked or new, not ignored), from the working tree. */
function source() {
  const tracked = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root }
  )
    .toString("utf8")
    .split("\0")
    .filter((name) => name && SOURCE_FILES.some((re) => re.test(name)))
    // Skip files deleted from the working tree but not yet from the index
    .filter((name) => fs.existsSync(path.join(root, name)));
  return tracked.map((name) => ({
    name,
    data: fs.readFileSync(path.join(root, name)),
  }));
}

const outDir = path.join(root, "releases");
fs.mkdirSync(outDir, { recursive: true });
const releases = [
  ["chrome", extension(chromeManifest(manifest))],
  ["firefox", extension(manifest)],
  ["firefox-source", source()],
];
for (const [target, entries] of releases) {
  const out = path.join(outDir, `hfx-${version}-${target}.zip`);
  fs.writeFileSync(out, zip(entries));
  console.log(`${path.relative(root, out)}: ${entries.length} files`);
}
