import type { Feature } from "./Feature";
import { MemoryStorage } from "../test-utils/MemoryStorage";
import {
  fetchDocument,
  fetchSharedDocument,
  getOrFetch,
  resetRemoteCaches,
} from "./Remote";
import { SettingsService } from "./SettingsService";
import { StorageService } from "./StorageService";

const feature = {
  class: "RemoteFeature",
  logger: { debug: jest.fn(), warn: jest.fn() },
} as unknown as Feature;

const HOUR = 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("getOrFetch", () => {
  let local: MemoryStorage;
  let settingsService: SettingsService;

  beforeEach(() => {
    resetRemoteCaches();
    local = new MemoryStorage();
    settingsService = new SettingsService(
      new StorageService(local, new MemoryStorage())
    );
    jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const cache = (value: any, fetchedAt: number) => {
    local.items["RemoteFeature:storage"] = {
      storage_badges: { value, fetchedAt },
    };
  };

  it("fetches and stores { value, fetchedAt } when nothing is cached", async () => {
    const fetcher = jest.fn().mockResolvedValue(["a"]);

    await expect(
      getOrFetch(feature, "badges", HOUR, fetcher, settingsService)
    ).resolves.toEqual(["a"]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(local.items["RemoteFeature:storage"]).toEqual({
      storage_badges: { value: ["a"], fetchedAt: NOW },
    });
  });

  it("returns the cached value while it is younger than the TTL", async () => {
    cache(["cached"], NOW - HOUR + 1);
    const fetcher = jest.fn().mockResolvedValue(["fresh"]);

    await expect(
      getOrFetch(feature, "badges", HOUR, fetcher, settingsService)
    ).resolves.toEqual(["cached"]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refetches once the TTL has passed", async () => {
    cache(["cached"], NOW - HOUR);
    const fetcher = jest.fn().mockResolvedValue(["fresh"]);

    await expect(
      getOrFetch(feature, "badges", HOUR, fetcher, settingsService)
    ).resolves.toEqual(["fresh"]);
    expect(local.items["RemoteFeature:storage"].storage_badges).toEqual({
      value: ["fresh"],
      fetchedAt: NOW,
    });
  });

  it("treats a fetchedAt in the future as expired", async () => {
    cache(["cached"], NOW + HOUR);
    const fetcher = jest.fn().mockResolvedValue(["fresh"]);

    await expect(
      getOrFetch(feature, "badges", HOUR, fetcher, settingsService)
    ).resolves.toEqual(["fresh"]);
  });

  it("ignores values stored in an older, non-{ value, fetchedAt } shape", async () => {
    local.items["RemoteFeature:storage"] = { storage_badges: ["legacy"] };
    const fetcher = jest.fn().mockResolvedValue(["fresh"]);

    await expect(
      getOrFetch(feature, "badges", HOUR, fetcher, settingsService)
    ).resolves.toEqual(["fresh"]);
  });

  it("returns the stale value when the refetch fails", async () => {
    cache(["stale"], NOW - 2 * HOUR);
    const fetcher = jest.fn().mockRejectedValue(new Error("offline"));

    await expect(
      getOrFetch(feature, "badges", HOUR, fetcher, settingsService)
    ).resolves.toEqual(["stale"]);
    expect(local.items["RemoteFeature:storage"].storage_badges.fetchedAt).toBe(
      NOW - 2 * HOUR
    );
  });

  it("throws when the fetch fails and nothing is cached", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("offline"));

    await expect(
      getOrFetch(feature, "badges", HOUR, fetcher, settingsService)
    ).rejects.toThrow("offline");
    expect(local.items["RemoteFeature:storage"]).toBeUndefined();
  });

  it("still returns the fetched value when caching it fails", async () => {
    cache(["stale"], NOW - 2 * HOUR);
    jest
      .spyOn(settingsService, "setStorageItem")
      .mockRejectedValue(new Error("quota"));
    const fetcher = jest.fn().mockResolvedValue(["fresh"]);

    await expect(
      getOrFetch(feature, "badges", HOUR, fetcher, settingsService)
    ).resolves.toEqual(["fresh"]);
  });

  it("shares one fetch between concurrent calls", async () => {
    let resolve!: (value: string[]) => void;
    const fetcher = jest.fn(
      () => new Promise<string[]>((r) => (resolve = r))
    );

    const first = getOrFetch(feature, "badges", HOUR, fetcher, settingsService);
    const second = getOrFetch(feature, "badges", HOUR, fetcher, settingsService);
    // Let both calls finish reading storage before the fetch resolves
    await new Promise((r) => setTimeout(r, 0));
    resolve(["once"]);

    await expect(Promise.all([first, second])).resolves.toEqual([
      ["once"],
      ["once"],
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("fetchDocument", () => {
  const response = (body: string, status = 200) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(body),
    }) as Response;

  beforeEach(() => {
    resetRemoteCaches();
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it("parses the response as HTML", async () => {
    (fetch as jest.Mock).mockResolvedValue(
      response("<html><body><div id='x'>hi</div></body></html>")
    );

    const doc = await fetchDocument("/showgroups.php");

    expect(doc.getElementById("x")?.textContent).toBe("hi");
    expect(fetch).toHaveBeenCalledWith("/showgroups.php", {
      credentials: "same-origin",
    });
  });

  it("rejects non-2xx responses instead of parsing them", async () => {
    (fetch as jest.Mock).mockResolvedValue(response("<p>error</p>", 503));

    await expect(fetchDocument("/showgroups.php")).rejects.toThrow("HTTP 503");
  });

  it("shares one fetch per URL and retries after a failure", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(response("", 500))
      .mockResolvedValue(response("<div id='ok'></div>"));

    await expect(fetchSharedDocument("/showgroups.php")).rejects.toThrow();

    const [a, b] = await Promise.all([
      fetchSharedDocument("/showgroups.php"),
      fetchSharedDocument("/showgroups.php"),
    ]);
    expect(a).toBe(b);
    expect(a.getElementById("ok")).not.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
