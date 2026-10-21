import {
  GROUP_MAP_RETRY_DELAY,
  GROUP_MAP_TTL,
  groupIdOf,
  parseGroupMap,
  resolveGroupMap,
} from "./GroupMap";

const doc = (html: string) =>
  new DOMParser().parseFromString(html, "text/html");

describe("parseGroupMap", () => {
  it("reads class → name pairs from showgroups.php", () => {
    const map = parseGroupMap(
      doc(`
        <div class="groupName"><span><strong><span class="group68">Brotherhood</span></strong></span></div>
        <div class="groupName"><span><strong><span class="group52"> Guardians </span></strong></span></div>
        <div class="groupName"><span>no name</span></div>`)
    );
    expect(map).toEqual({ group68: "Brotherhood", group52: "Guardians" });
  });
});

describe("groupIdOf", () => {
  it("reads the id from a username class", () => {
    expect(groupIdOf("group68")).toBe(68);
    expect(groupIdOf("gradient-blue")).toBe(0);
  });
});

describe("resolveGroupMap", () => {
  const stored = { group1: "Stored" };

  it("uses a fresh stored map without fetching", async () => {
    const fetchMap = jest.fn();
    const save = jest.fn();
    await expect(
      resolveGroupMap({ stored, nextFetch: Date.now() + 1000, save }, fetchMap)
    ).resolves.toEqual(stored);
    expect(fetchMap).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("refetches a stale map and saves it for a day", async () => {
    const fetched = { group2: "New" };
    const save = jest.fn(async () => undefined);
    const before = Date.now();
    await expect(
      resolveGroupMap({ stored, nextFetch: 0, save }, async () => fetched)
    ).resolves.toEqual(fetched);
    const [map, next] = save.mock.calls[0] as unknown as [unknown, number];
    expect(map).toEqual(fetched);
    expect(next).toBeGreaterThanOrEqual(before + GROUP_MAP_TTL);
  });

  it("keeps the stored map and waits an hour after a failed fetch", async () => {
    const save = jest.fn(async () => undefined);
    const before = Date.now();
    await expect(
      resolveGroupMap({ stored, nextFetch: 0, save }, async () => null)
    ).resolves.toEqual(stored);
    const [map, next] = save.mock.calls[0] as unknown as [unknown, number];
    expect(map).toBeNull();
    expect(next).toBeGreaterThanOrEqual(before + GROUP_MAP_RETRY_DELAY);
  });

  it("is null with no map at all", async () => {
    await expect(
      resolveGroupMap(
        { stored: {}, nextFetch: 0, save: async () => undefined },
        async () => null
      )
    ).resolves.toBeNull();
  });
});
