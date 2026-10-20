import HFXBadges from "./HFXBadges";
import { resetRemoteCaches } from "../../core/Remote";
import { SettingsService } from "../../core/SettingsService";
import { StorageService } from "../../core/StorageService";
import { MemoryStorage } from "../../test-utils/MemoryStorage";

const MINUTE = 60_000;
const UID = 1306528;
const STORAGE_KEY = `${HFXBadges.class}:storage`;

const badges = {
  testers: { description: "HFX Alpha Tester", users: [UID] },
  donators: { description: "HFX Donator", users: [42] },
};

const renderPost = (uid = UID) => {
  document.body.innerHTML = `
    <div class="post">
      <div class="author_information">
        <strong><span class="largetext">
          <a href="https://hackforums.net/member.php?action=profile&uid=${uid}">User</a>
        </span></strong>
      </div>
      <div class="post_myawards"></div>
    </div>`;
};

const badgeImages = () =>
  Array.from(document.querySelectorAll(".post_myawards img")).map((img) =>
    img.getAttribute("title")
  );

describe("HFXBadges", () => {
  let local: MemoryStorage;
  let fetchMock: jest.Mock;

  const storeBadgeMap = (badgeMap: unknown) => {
    local.items[STORAGE_KEY] = { storage_badgeMap: badgeMap };
  };

  beforeEach(() => {
    resetRemoteCaches();
    renderPost();
    HFXBadges.fetchDelay = 15;
    local = new MemoryStorage();
    (HFXBadges as any).settingsService = new SettingsService(
      new StorageService(local, new MemoryStorage())
    );
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it("shows cached badges without fetching when they are fresh", async () => {
    storeBadgeMap({ value: badges, fetchedAt: Date.now() - 5 * MINUTE });

    await HFXBadges.run();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(badgeImages()).toEqual(["HFX Alpha Tester"]);
  });

  it("fetches, shows and caches badges once the cache is 15 minutes old", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => badges });
    storeBadgeMap({ value: {}, fetchedAt: Date.now() - 15 * MINUTE });

    await HFXBadges.run();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(badgeImages()).toEqual(["HFX Alpha Tester"]);
    // Same key and { value, fetchedAt } shape as before getOrFetch
    expect(local.items[STORAGE_KEY]).toEqual({
      storage_badgeMap: { value: badges, fetchedAt: expect.any(Number) },
    });
  });

  it("fetches on every run when fetchDelay is 0", async () => {
    HFXBadges.fetchDelay = 0;
    fetchMock.mockResolvedValue({ ok: true, json: async () => badges });
    storeBadgeMap({ value: badges, fetchedAt: Date.now() });

    await HFXBadges.run();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["the default", {}],
    ["from an older version", { badges }],
    [
      "timestamped in the future",
      { value: {}, fetchedAt: Date.now() + MINUTE },
    ],
  ])("fetches when the cache is %s", async (_label, badgeMap) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => badges });
    if (badgeMap !== undefined) storeBadgeMap(badgeMap);

    await HFXBadges.run();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(badgeImages()).toEqual(["HFX Alpha Tester"]);
  });

  it("falls back to cached badges when the fetch fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const stale = { value: badges, fetchedAt: Date.now() - 20 * MINUTE };
    storeBadgeMap(stale);

    await HFXBadges.run();

    expect(badgeImages()).toEqual(["HFX Alpha Tester"]);
    expect(local.items[STORAGE_KEY].storage_badgeMap).toEqual(stale);
  });

  it("shows nothing when the fetch fails and nothing is cached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(HFXBadges.run()).resolves.toBeUndefined();

    expect(badgeImages()).toEqual([]);
  });

  it("skips posts without an author profile link", async () => {
    document.body.innerHTML = `
      <div class="post">
        <div class="author_information"><strong><span class="largetext">Guest</span></strong></div>
        <div class="post_myawards"></div>
      </div>`;
    storeBadgeMap({ value: badges, fetchedAt: Date.now() });

    await HFXBadges.run();

    expect(document.querySelector(".post_myawards")?.children).toHaveLength(0);
  });
});
