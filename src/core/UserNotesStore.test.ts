import { StorageService } from "./StorageService";
import { MemoryStorage } from "../test-utils/MemoryStorage";
import { getSyncItemSize, isLocalOnlyKey } from "./constants";
import {
  NoteShard,
  TOMBSTONE_TTL,
  USER_NOTES_BUDGET_BYTES,
  USER_NOTES_KEYS,
  USER_NOTE_MAX_LENGTH,
  UserNotesStore,
  checkNotesFit,
  getNotesBytes,
  getShardKey,
  isUserNotesKey,
  mergeNoteShards,
  normalizeNote,
  sameNoteShard,
} from "./UserNotesStore";

const NOW = 1_800_000_000_000;

/** Note shards filled with 200-character notes until less than 100 bytes of the budget are left. */
function fillToBudget(): { [key: string]: NoteShard } {
  const shards: { [key: string]: NoteShard } = {};
  for (let uid = 1; ; uid++) {
    const key = getShardKey(uid);
    const shard: NoteShard = {
      ...shards[key],
      [uid]: { n: "q".repeat(200), t: 1 },
    };
    if (
      getNotesBytes({ ...shards, [key]: shard }) >
      USER_NOTES_BUDGET_BYTES - 100
    ) {
      return shards;
    }
    shards[key] = shard;
  }
}

describe("UserNotesStore helpers", () => {
  it("shards notes by uid % 16 into hex-suffixed keys", () => {
    expect(getShardKey(1)).toBe("UserNotes:notes:1");
    expect(getShardKey(15)).toBe("UserNotes:notes:f");
    expect(getShardKey(16)).toBe("UserNotes:notes:0");
    expect(getShardKey(1234567)).toBe(
      `UserNotes:notes:${(1234567 % 16).toString(16)}`
    );
    expect(USER_NOTES_KEYS).toHaveLength(16);
    expect(new Set(USER_NOTES_KEYS).size).toBe(16);
  });

  it("treats note shards as synced keys, not local-only cache", () => {
    for (const key of USER_NOTES_KEYS) {
      expect(isUserNotesKey(key)).toBe(true);
      expect(isLocalOnlyKey(key)).toBe(false);
    }
    expect(isUserNotesKey("UserNotes")).toBe(false);
    expect(isUserNotesKey("UserNotes:storage")).toBe(false);
  });

  it("normalizes line endings and trims", () => {
    expect(normalizeNote("  paid fast\r\ntrusted \r ")).toBe(
      "paid fast\ntrusted"
    );
    expect(normalizeNote(" \n ")).toBe("");
  });

  describe("mergeNoteShards", () => {
    it("keeps the record edited last for each uid", () => {
      const local: NoteShard = {
        "1": { n: "old", t: 1 },
        "17": { n: "local only", t: 5 },
      };
      const sync: NoteShard = {
        "1": { n: "new", t: 2 },
        "33": { n: "sync only", t: 3 },
      };

      expect(mergeNoteShards(local, sync, NOW)).toEqual({
        "1": { n: "new", t: 2 },
        "17": { n: "local only", t: 5 },
        "33": { n: "sync only", t: 3 },
      });
      expect(mergeNoteShards(sync, local, NOW)).toEqual(
        mergeNoteShards(local, sync, NOW)
      );
    });

    it("lets a newer tombstone delete a note, and a newer note replace a tombstone", () => {
      expect(
        mergeNoteShards(
          { "1": { n: "note", t: NOW - 10 } },
          { "1": { d: 1, t: NOW - 5 } },
          NOW
        )
      ).toEqual({ "1": { d: 1, t: NOW - 5 } });
      expect(
        mergeNoteShards(
          { "1": { n: "again", t: NOW - 1 } },
          { "1": { d: 1, t: NOW - 5 } },
          NOW
        )
      ).toEqual({ "1": { n: "again", t: NOW - 1 } });
    });

    it("breaks ties the same way whichever side a record is on", () => {
      const a: NoteShard = { "1": { n: "a", t: 7 } };
      const b: NoteShard = { "1": { n: "b", t: 7 } };
      expect(mergeNoteShards(a, b, NOW)).toEqual(mergeNoteShards(b, a, NOW));
    });

    it("prunes expired tombstones and ignores malformed records", () => {
      const shard: any = {
        "1": { d: 1, t: NOW - TOMBSTONE_TTL - 1 },
        "2": { d: 1, t: NOW - 1000 },
        "3": { t: 5 },
        "4": "junk",
      };
      expect(mergeNoteShards(shard, undefined, NOW)).toEqual({
        "2": { d: 1, t: NOW - 1000 },
      });
    });
  });

  it("compares shards by their records", () => {
    expect(sameNoteShard({}, undefined)).toBe(true);
    expect(
      sameNoteShard({ "1": { n: "a", t: 1 } }, { "1": { n: "a", t: 1 } })
    ).toBe(true);
    expect(
      sameNoteShard({ "1": { n: "a", t: 1 } }, { "1": { n: "b", t: 1 } })
    ).toBe(false);
    expect(sameNoteShard({ "1": { n: "a", t: 1 } }, {})).toBe(false);
  });

  describe("checkNotesFit", () => {
    it("rejects a shard over the 8 KB sync item limit", () => {
      const shard: NoteShard = {};
      for (let uid = 0; uid < 40; uid++)
        shard[uid * 16] = { n: "x".repeat(250), t: NOW };
      expect(getSyncItemSize("UserNotes:notes:0", shard)).toBeGreaterThan(8192);
      expect(checkNotesFit({}, "UserNotes:notes:0", shard)).toMatch(
        /too many notes/
      );
    });

    it("rejects notes that would exceed the notes budget", () => {
      const shards = fillToBudget();
      const key = getShardKey(99_999);
      const shard: NoteShard = {
        ...shards[key],
        "99999": { n: "z".repeat(256), t: NOW },
      };

      expect(getSyncItemSize(key, shard)).toBeLessThan(8192);
      expect(checkNotesFit(shards, key, shards[key])).toBeUndefined();
      expect(checkNotesFit(shards, key, shard)).toMatch(
        /used all of its sync storage/
      );
    });
  });
});

describe("UserNotesStore", () => {
  let local: MemoryStorage;
  let store: UserNotesStore;
  let now: number;

  beforeEach(() => {
    (chrome.storage as any).onChanged = { addListener: jest.fn() };
    local = new MemoryStorage();
    now = NOW;
    store = new UserNotesStore(
      new StorageService(local, new MemoryStorage()),
      () => now
    );
  });

  afterEach(() => {
    delete (chrome.storage as any).onChanged;
  });

  it("saves a note in the member's shard with the username and time", async () => {
    await expect(
      store.save(17, "  paid fast  ", "Stanley")
    ).resolves.toMatchObject({
      ok: true,
    });

    expect(local.items["UserNotes:notes:1"]).toEqual({
      "17": { n: "paid fast", u: "Stanley", t: NOW },
    });
    expect((await store.getAll()).get(17)).toEqual({
      uid: 17,
      note: "paid fast",
      username: "Stanley",
      updatedAt: NOW,
    });
  });

  it(`accepts ${USER_NOTE_MAX_LENGTH} characters and refuses more without writing`, async () => {
    await expect(
      store.save(1, "a".repeat(USER_NOTE_MAX_LENGTH))
    ).resolves.toMatchObject({ ok: true });

    const result = await store.save(2, "b".repeat(USER_NOTE_MAX_LENGTH + 1));
    expect(result).toEqual({
      ok: false,
      error: expect.stringMatching(/256 characters/),
    });
    expect(local.items["UserNotes:notes:2"]).toBeUndefined();
  });

  it("deletes with a tombstone, and an empty save deletes too", async () => {
    await store.save(5, "note");
    now += 1000;
    await store.delete(5);
    expect(local.items["UserNotes:notes:5"]).toEqual({
      "5": { d: 1, t: NOW + 1000 },
    });
    expect((await store.getAll()).has(5)).toBe(false);

    await store.save(21, "note");
    await store.save(21, "   ");
    expect(local.items["UserNotes:notes:5"]["21"]).toEqual({
      d: 1,
      t: NOW + 1000,
    });
  });

  it("doesn't write a tombstone for a member without a note", async () => {
    await store.delete(9);
    expect(local.items).toEqual({});
  });

  it("refuses a save that would exceed the budget and leaves storage intact", async () => {
    const full = fillToBudget();
    local.items = JSON.parse(JSON.stringify(full));
    const { usage } = await store.getSnapshot();
    expect(usage.bytes).toBeLessThanOrEqual(USER_NOTES_BUDGET_BYTES);

    const result = await store.save(1000 * 16, "r".repeat(256));
    expect(result.ok).toBe(false);
    expect(local.items).toEqual(full);
  });

  /** Notes already over the budget, as a merge from another browser can leave them. */
  function overBudget(): { [key: string]: NoteShard } {
    const shards = fillToBudget();
    shards[getShardKey(5)] = {
      ...shards[getShardKey(5)],
      "99989": { n: "o".repeat(256), t: 1 },
    };
    expect(getNotesBytes(shards)).toBeGreaterThan(USER_NOTES_BUDGET_BYTES);
    return shards;
  }

  it("still deletes when storage is over the budget", async () => {
    local.items = overBudget();
    await store.delete(99_989);
    expect(local.items[getShardKey(5)]["99989"]).toEqual({ d: 1, t: NOW });
  });

  it("allows shortening a note when storage is over the budget, but not growing one", async () => {
    local.items = overBudget();

    await expect(store.save(99_989, "short")).resolves.toMatchObject({
      ok: true,
    });
    expect(local.items[getShardKey(5)]["99989"]).toMatchObject({ n: "short" });

    local.items = overBudget();
    const grown = await store.save(5 + 16 * 70_000, "new note");
    expect(grown.ok).toBe(false);
  });

  it("allows shortening a note in a shard over the 8 KB limit", async () => {
    const shard: NoteShard = {};
    for (let i = 1; i <= 31; i++)
      shard[`${i * 16}`] = { n: "x".repeat(256), t: 1 };
    expect(getSyncItemSize("UserNotes:notes:0", shard)).toBeGreaterThan(8192);
    local.items = { "UserNotes:notes:0": shard };

    await expect(store.save(16, "short")).resolves.toMatchObject({ ok: true });
    await expect(store.save(16 * 99, "new")).resolves.toMatchObject({
      ok: false,
    });
  });

  it("returns the saved note, and none when saving deleted it", async () => {
    await expect(store.save(3, " hi ", "Bob")).resolves.toEqual({
      ok: true,
      note: { uid: 3, note: "hi", username: "Bob", updatedAt: NOW },
    });
    await expect(store.save(3, "  ")).resolves.toEqual({ ok: true });
  });

  it("skips malformed records when reading", async () => {
    local.items = {
      "UserNotes:notes:1": {
        "1": { n: "ok", t: 1 },
        "17": { t: 2 },
        "33": "junk",
      },
    };
    const { notes, usage } = await store.getSnapshot();
    expect([...notes.keys()]).toEqual([1]);
    expect(usage.count).toBe(1);
  });

  it("reports usage, counting notes but not tombstones", async () => {
    await store.save(1, "one");
    await store.save(2, "two");
    await store.delete(2);

    const { usage } = await store.getSnapshot();
    expect(usage.count).toBe(1);
    expect(usage.budget).toBe(USER_NOTES_BUDGET_BYTES);
    expect(usage.bytes).toBe(
      getSyncItemSize("UserNotes:notes:1", local.items["UserNotes:notes:1"]) +
        getSyncItemSize("UserNotes:notes:2", local.items["UserNotes:notes:2"])
    );
  });

  it("exports notes as JSON", async () => {
    await store.save(2, "<b>two</b>", "Two");
    await store.save(1, "one");

    const exported = JSON.parse(await store.exportJson());
    expect(exported.version).toBe(1);
    expect(exported.notes.map((n: any) => n.uid)).toEqual([1, 2]);
    expect(exported.notes[1].note).toBe("<b>two</b>");
  });
});
