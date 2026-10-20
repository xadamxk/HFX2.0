import { TextDecoder, TextEncoder } from "util";
import BanReason from "./BanReason";

// jsdom doesn't provide these; the legacy base64 cache is UTF-8 encoded
Object.assign(global, { TextDecoder, TextEncoder });

const HOUR = 60 * 60 * 1000;
const STORAGE_KEY = "storage_banReasons";

const renderProfile = ({ banned = true } = {}) => {
  window.history.pushState({}, "", "/member.php?action=profile&uid=123");
  document.body.innerHTML = `
    <div class="pro-adv-content-info">
      <div class="pro-adv-card">
        <span class="largetext"><strong><span class="${
          banned ? "group7" : "group2"
        }">User</span></strong></span>
      </div>
    </div>`;
};

const bansPage = (rows: { uid: number; reason: string }[]) => `
  <table class="tborder">
    ${rows
      .map(
        ({ uid, reason }) => `
      <tr class="mobile-no-padding">
        <td><a href="https://hackforums.net/member.php?action=profile&uid=${uid}">User ${uid}</a></td>
        <td>${reason}</td>
        <td><a href="https://hackforums.net/member.php?action=profile&uid=1">Staff</a></td>
        <td>Oct 1, 2026</td>
        <td>Never</td>
      </tr>`
      )
      .join("")}
  </table>`;

const entry = (banReason: string, seenAt = Date.now()) => ({
  banReason,
  bannedByUID: 1,
  bannedByUsername: "Staff",
  bannedAt: "Sep 1, 2026",
  expiresAt: "Never",
  seenAt,
});

// Matches the encoder older versions used to store the map
const encodeLegacy = (map: object) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(map))));

const shownReason = () =>
  document
    .querySelector("[data-hfx-ban-reason='true']")
    ?.textContent?.match(/Reason: (.*?)Banned By/)?.[1]
    ?.trim();

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("BanReason", () => {
  let fetchMock: jest.Mock;
  let setStorageItem: jest.SpyInstance;

  const mockBansPage = (html: string) =>
    fetchMock.mockResolvedValue({ ok: true, text: async () => html });

  const savedCache = () =>
    setStorageItem.mock.calls[setStorageItem.mock.calls.length - 1]?.[2];

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    setStorageItem = jest
      .spyOn((BanReason as any).settingsService, "setStorageItem")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches bans.php once and caches the parsed map with its fetch time", async () => {
    renderProfile();
    mockBansPage(bansPage([{ uid: 123, reason: "Scamming" }]));

    BanReason.run({ [STORAGE_KEY]: { fetchedAt: 0, map: {} } });
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(shownReason()).toBe("Scamming");
    const cache = savedCache();
    expect(Date.now() - cache.fetchedAt).toBeLessThan(1000);
    expect(cache.map[123].banReason).toBe("Scamming");
  });

  it("doesn't refetch a banned profile missing from a fresh snapshot", async () => {
    renderProfile();

    BanReason.run({
      [STORAGE_KEY]: { fetchedAt: Date.now() - HOUR / 2, map: {} },
    });
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(shownReason()).toBeUndefined();
  });

  it("shows a fresh cached ban without fetching", async () => {
    renderProfile();

    BanReason.run({
      [STORAGE_KEY]: { fetchedAt: Date.now(), map: { 123: entry("Spam") } },
    });
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(shownReason()).toBe("Spam");
  });

  it("refetches an expired snapshot, replacing the user's stale ban", async () => {
    renderProfile();
    mockBansPage(bansPage([{ uid: 123, reason: "Re-banned" }]));

    BanReason.run({
      [STORAGE_KEY]: {
        fetchedAt: Date.now() - 2 * HOUR,
        map: { 123: entry("Old ban") },
      },
    });
    expect(shownReason()).toBe("Old ban");
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(shownReason()).toBe("Re-banned");
    expect(savedCache().map[123].banReason).toBe("Re-banned");
  });

  it("merges new bans into the map and drops long-unlisted ones", async () => {
    renderProfile();
    mockBansPage(bansPage([{ uid: 456, reason: "New ban" }]));
    const yearAgo = Date.now() - 365 * 24 * HOUR;

    BanReason.run({
      [STORAGE_KEY]: {
        fetchedAt: Date.now() - 2 * HOUR,
        map: { 123: entry("Older ban"), 789: entry("Ancient", yearAgo) },
      },
    });
    await flush();

    const cache = savedCache();
    expect(Object.keys(cache.map).sort()).toEqual(["123", "456"]);
    expect(cache.map[123].banReason).toBe("Older ban");
    expect(shownReason()).toBe("Older ban");
  });

  it("keeps the cache when bans.php can't be fetched", async () => {
    renderProfile();
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    BanReason.run({
      [STORAGE_KEY]: { fetchedAt: Date.now() - 2 * HOUR, map: {} },
    });
    await flush();

    expect(setStorageItem).not.toHaveBeenCalled();
  });

  it("converts the legacy base64 value once and treats it as stale", async () => {
    renderProfile({ banned: false });
    const legacy = encodeLegacy({ 123: entry("Legacy ban – café") });

    BanReason.run({ [STORAGE_KEY]: legacy });
    await flush();

    expect(setStorageItem).toHaveBeenCalledTimes(1);
    const cache = savedCache();
    expect(typeof cache).toBe("object");
    expect(cache.fetchedAt).toBe(0);
    expect(cache.map[123].banReason).toBe("Legacy ban – café");
    // Not banned, so nothing is fetched or shown
    expect(fetchMock).not.toHaveBeenCalled();
    expect(shownReason()).toBeUndefined();
  });

  it("shows a legacy cached ban, then refreshes it", async () => {
    renderProfile();
    mockBansPage(bansPage([]));

    BanReason.run({
      [STORAGE_KEY]: encodeLegacy({ 123: entry("Legacy ban") }),
    });
    expect(shownReason()).toBe("Legacy ban");
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const cache = savedCache();
    expect(cache.fetchedAt).toBeGreaterThan(0);
    expect(cache.map[123].banReason).toBe("Legacy ban");
  });

  it("does nothing on profiles that aren't banned", async () => {
    renderProfile({ banned: false });

    BanReason.run({ [STORAGE_KEY]: { fetchedAt: 0, map: {} } });
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(setStorageItem).not.toHaveBeenCalled();
  });
});
