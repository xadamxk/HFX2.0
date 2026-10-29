import { StorageService } from "./StorageService";
import { SYNC_QUOTA_BYTES_PER_ITEM, getSyncItemSize } from "./constants";

/**
 * User Notes data: a private note per HF member, keyed by uid.
 *
 * Notes are synced settings, not cached data, so they live in their own
 * chrome.storage.local keys that StorageSyncService mirrors to sync. They are
 * spread over 16 shards (`UserNotes:notes:0` … `UserNotes:notes:f`, by
 * `uid % 16`) because a sync item is limited to 8 KB.
 *
 * A deleted note is kept as a tombstone (`{ t, d: 1 }`) so merging two
 * devices' copies of a shard can't bring it back; tombstones are pruned once
 * they are older than TOMBSTONE_TTL.
 */

/** Shard key prefix. Never change it once released: notes would be lost. */
export const USER_NOTES_KEY_PREFIX = "UserNotes:notes:";

export const USER_NOTES_SHARD_COUNT = 16;

/** Most characters a note may have (UTF-16 units, as a textarea's maxlength counts). */
export const USER_NOTE_MAX_LENGTH = 256;

/**
 * Sync bytes all note shards may use together. The rest of the 100 KB sync
 * quota is left for feature settings.
 */
export const USER_NOTES_BUDGET_BYTES = 64 * 1024;

/** How long a deleted note's tombstone is kept: 90 days. */
export const TOMBSTONE_TTL = 90 * 24 * 60 * 60 * 1000;

/** A stored note. Field names are short because every byte counts in sync. */
export interface NoteEntry {
  /** Note text */
  n: string;
  /** Username when the note was last saved, for display only */
  u?: string;
  /** Last edited, ms since epoch */
  t: number;
}

/** A deleted note */
export interface NoteTombstone {
  d: 1;
  t: number;
}

export type NoteRecord = NoteEntry | NoteTombstone;

/** One shard's value, keyed by uid */
export type NoteShard = { [uid: string]: NoteRecord };

/** A note as features and the options page use it */
export interface UserNote {
  uid: number;
  note: string;
  username?: string;
  updatedAt: number;
}

export type SaveNoteResult = { ok: true } | { ok: false; error: string };

export interface NotesUsage {
  bytes: number;
  budget: number;
  count: number;
}

export function getShardKey(uid: number): string {
  return `${USER_NOTES_KEY_PREFIX}${(uid % USER_NOTES_SHARD_COUNT).toString(16)}`;
}

export const USER_NOTES_KEYS: string[] = Array.from(
  { length: USER_NOTES_SHARD_COUNT },
  (_, shard) => `${USER_NOTES_KEY_PREFIX}${shard.toString(16)}`
);

export function isUserNotesKey(key: string): boolean {
  return key.startsWith(USER_NOTES_KEY_PREFIX);
}

export function isTombstone(
  record: NoteRecord | undefined
): record is NoteTombstone {
  return !!record && "d" in record;
}

/**
 * Note text as it is stored: line endings normalized and surrounding
 * whitespace trimmed. An empty result means "delete the note".
 */
export function normalizeNote(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim();
}

/**
 * Merge two copies of a shard: per uid, the record edited last wins.
 * Tombstones older than TOMBSTONE_TTL are dropped. Ties are broken by
 * comparing the serialized records, so every device merges to the same result.
 */
export function mergeNoteShards(
  a: NoteShard | undefined,
  b: NoteShard | undefined,
  now: number = Date.now()
): NoteShard {
  const merged: NoteShard = {};
  for (const shard of [a ?? {}, b ?? {}]) {
    for (const uid of Object.keys(shard)) {
      const record = shard[uid];
      if (!isValidRecord(record)) continue;
      const current = merged[uid];
      if (!current || isNewer(record, current)) {
        merged[uid] = record;
      }
    }
  }
  return pruneTombstones(merged, now);
}

function isNewer(record: NoteRecord, current: NoteRecord): boolean {
  if (record.t !== current.t) return record.t > current.t;
  return JSON.stringify(record) > JSON.stringify(current);
}

function isValidRecord(record: unknown): record is NoteRecord {
  if (!record || typeof record !== "object") return false;
  const { t, n, d } = record as { t?: unknown; n?: unknown; d?: unknown };
  return typeof t === "number" && (d === 1 || typeof n === "string");
}

export function pruneTombstones(
  shard: NoteShard,
  now: number = Date.now()
): NoteShard {
  const result: NoteShard = {};
  for (const uid of Object.keys(shard)) {
    const record = shard[uid];
    if (isTombstone(record) && now - record.t > TOMBSTONE_TTL) continue;
    result[uid] = record;
  }
  return result;
}

/** Whether two shard values hold the same records. */
export function sameNoteShard(
  a: NoteShard | undefined,
  b: NoteShard | undefined
): boolean {
  const aKeys = Object.keys(a ?? {});
  if (aKeys.length !== Object.keys(b ?? {}).length) return false;
  return aKeys.every(
    (uid) => JSON.stringify(a![uid]) === JSON.stringify(b?.[uid])
  );
}

/** Bytes the given shards (keyed by shard key) use in sync. Empty shards count as 0. */
export function getNotesBytes(shards: {
  [key: string]: NoteShard | undefined;
}): number {
  let bytes = 0;
  for (const key of Object.keys(shards)) {
    const shard = shards[key];
    if (shard && Object.keys(shard).length > 0) {
      bytes += getSyncItemSize(key, shard);
    }
  }
  return bytes;
}

/**
 * Check that writing `shard` under `key` keeps it within the sync item limit
 * and keeps all notes within the notes budget. Returns an error message for
 * the user, or undefined if it fits.
 */
export function checkNotesFit(
  shards: { [key: string]: NoteShard | undefined },
  key: string,
  shard: NoteShard
): string | undefined {
  if (getSyncItemSize(key, shard) > SYNC_QUOTA_BYTES_PER_ITEM) {
    return "Not saved: too many notes are stored for members like this one. Shorten or delete some notes and try again.";
  }
  if (getNotesBytes({ ...shards, [key]: shard }) > USER_NOTES_BUDGET_BYTES) {
    return "Not saved: User Notes has used all of its sync storage. Shorten or delete some notes and try again.";
  }
  return undefined;
}

function toUserNote(uid: string, record: NoteRecord): UserNote | undefined {
  if (isTombstone(record)) return undefined;
  return {
    uid: Number(uid),
    note: record.n,
    username: record.u,
    updatedAt: record.t,
  };
}

/**
 * Reads and writes notes through StorageService (chrome.storage.local), from
 * content scripts and the options page. StorageSyncService does the syncing.
 */
export class UserNotesStore {
  constructor(
    private storage: StorageService = StorageService.getInstance(),
    private now: () => number = Date.now
  ) {}

  /** Every note, by uid. */
  async getAll(): Promise<Map<number, UserNote>> {
    const shards = await this.storage.getMany(USER_NOTES_KEYS);
    const notes = new Map<number, UserNote>();
    for (const key of USER_NOTES_KEYS) {
      const shard: NoteShard = shards[key] ?? {};
      for (const uid of Object.keys(shard)) {
        const note = toUserNote(uid, shard[uid]);
        if (note) notes.set(note.uid, note);
      }
    }
    return notes;
  }

  async getUsage(): Promise<NotesUsage> {
    const shards = await this.storage.getMany(USER_NOTES_KEYS);
    let count = 0;
    for (const key of USER_NOTES_KEYS) {
      const shard: NoteShard = shards[key] ?? {};
      count += Object.values(shard).filter(
        (record) => !isTombstone(record)
      ).length;
    }
    return {
      bytes: getNotesBytes(shards),
      budget: USER_NOTES_BUDGET_BYTES,
      count,
    };
  }

  /**
   * Save a member's note. An empty note deletes it. Nothing is written if the
   * note is too long or wouldn't fit in sync.
   */
  async save(
    uid: number,
    text: string,
    username?: string
  ): Promise<SaveNoteResult> {
    const note = normalizeNote(text);
    if (!note) {
      await this.delete(uid);
      return { ok: true };
    }
    if (note.length > USER_NOTE_MAX_LENGTH) {
      return {
        ok: false,
        error: `Not saved: notes can be up to ${USER_NOTE_MAX_LENGTH} characters.`,
      };
    }

    const entry: NoteEntry = { n: note, t: this.now() };
    if (username) entry.u = username;
    return await this.writeRecord(uid, entry);
  }

  /** Delete a member's note, leaving a tombstone so other devices delete it too. */
  async delete(uid: number): Promise<void> {
    const result = await this.writeRecord(uid, { d: 1, t: this.now() }, true);
    if (!result.ok) throw new Error(result.error);
  }

  /** Every note as JSON, for the options page's export. */
  async exportJson(): Promise<string> {
    const notes = [...(await this.getAll()).values()].sort(
      (a, b) => a.uid - b.uid
    );
    return JSON.stringify(
      { version: 1, exportedAt: new Date(this.now()).toISOString(), notes },
      null,
      2
    );
  }

  /**
   * Write one record. Tombstones skip the size checks: deleting must always
   * work, and a tombstone is smaller than the note it replaces.
   */
  private async writeRecord(
    uid: number,
    record: NoteRecord,
    skipSizeCheck = false
  ): Promise<SaveNoteResult> {
    const key = getShardKey(uid);
    let error: string | undefined;
    await this.storage.updateMany(USER_NOTES_KEYS, (current) => {
      const existing: NoteShard | undefined = current[key];
      // Deleting a note that was never stored needs no tombstone
      if (
        isTombstone(record) &&
        (!existing?.[uid] || isTombstone(existing[uid]))
      ) {
        return {};
      }
      const shard = pruneTombstones(
        { ...(existing ?? {}), [uid]: record },
        this.now()
      );
      error = skipSizeCheck ? undefined : checkNotesFit(current, key, shard);
      return error ? {} : { [key]: shard };
    });
    return error ? { ok: false, error } : { ok: true };
  }
}
