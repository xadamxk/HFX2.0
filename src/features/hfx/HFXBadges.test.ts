import HFXBadges, { isBadgeCacheStale } from "./HFXBadges";

const MINUTE = 60_000;
const UID = 1306528;

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

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("isBadgeCacheStale", () => {
  const now = 1_700_000_000_000;

  it("is stale when nothing has been fetched yet", () => {
    expect(isBadgeCacheStale(undefined, 15, now)).toBe(true);
    expect(isBadgeCacheStale(null, 15, now)).toBe(true);
  });

  it("is fresh until fetchDelay minutes have passed", () => {
    expect(isBadgeCacheStale(now - 14 * MINUTE, 15, now)).toBe(false);
    expect(isBadgeCacheStale(now - 15 * MINUTE + 1, 15, now)).toBe(false);
  });

  it("is stale once fetchDelay minutes have passed", () => {
    expect(isBadgeCacheStale(now - 15 * MINUTE, 15, now)).toBe(true);
    expect(isBadgeCacheStale(now - 16 * MINUTE, 15, now)).toBe(true);
    // The old check waited fetchDelay * fetchDelay minutes (225)
    expect(isBadgeCacheStale(now - 30 * MINUTE, 15, now)).toBe(true);
  });

  it("is always stale when fetchDelay is 0", () => {
    expect(isBadgeCacheStale(now, 0, now)).toBe(true);
    expect(isBadgeCacheStale(now - 1, 0, now)).toBe(true);
  });

  it("is stale when the fetch time is in the future", () => {
    expect(isBadgeCacheStale(now + MINUTE, 15, now)).toBe(true);
  });
});

describe("HFXBadges", () => {
  let fetchMock: jest.Mock;
  let setStorageItem: jest.SpyInstance;

  beforeEach(() => {
    renderPost();
    HFXBadges.fetchDelay = 15;
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    setStorageItem = jest
      .spyOn((HFXBadges as any).settingsService, "setStorageItem")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).fetch;
  });

  it("shows cached badges without fetching when they are fresh", () => {
    HFXBadges.run({
      storage_badgeMap: { value: badges, fetchedAt: Date.now() - 5 * MINUTE },
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(badgeImages()).toEqual(["HFX Alpha Tester"]);
  });

  it("fetches, shows and caches badges in one write when the cache is stale", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => badges });
    const settings = {
      storage_badgeMap: { value: {}, fetchedAt: Date.now() - 20 * MINUTE },
    };
    const before = JSON.stringify(settings);

    HFXBadges.run(settings);
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(badgeImages()).toEqual(["HFX Alpha Tester"]);
    expect(setStorageItem).toHaveBeenCalledTimes(1);
    expect(setStorageItem).toHaveBeenCalledWith(HFXBadges, "badgeMap", {
      value: badges,
      fetchedAt: expect.any(Number),
    });
    // The settings passed to run are left untouched
    expect(JSON.stringify(settings)).toBe(before);
  });

  it("fetches on every run when fetchDelay is 0", async () => {
    HFXBadges.fetchDelay = 0;
    fetchMock.mockResolvedValue({ ok: true, json: async () => badges });

    HFXBadges.run({
      storage_badgeMap: { value: badges, fetchedAt: Date.now() },
    });
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["missing", {}],
    ["null", { storage_badgeMap: null as unknown }],
    ["from an older version", { storage_badgeMap: { badges } }],
  ])("fetches when the cache is %s", async (_label, settings) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => badges });

    HFXBadges.run(settings);
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(badgeImages()).toEqual(["HFX Alpha Tester"]);
  });

  it("falls back to cached badges when the fetch fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    HFXBadges.run({
      storage_badgeMap: { value: badges, fetchedAt: Date.now() - 20 * MINUTE },
    });
    await flushPromises();

    expect(badgeImages()).toEqual(["HFX Alpha Tester"]);
    expect(setStorageItem).not.toHaveBeenCalled();
  });
});
