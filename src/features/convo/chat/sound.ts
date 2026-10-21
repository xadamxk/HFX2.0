/**
 * The new-message sound, as HF's own Convo plays it (convo_1d.js): its
 * convo-blip.mp3, skipping conversations muted on convo.php (the volume icon
 * there saves `{partyId: true}` in the convoSoundData cookie).
 */

export const SOUND_PATH = "/sounds/convo-blip.mp3";
// How long a tab keeps a message's lock, so other tabs don't play it too
const CLAIM_MS = 3000;

/** Something that can play the new-message sound for a message. */
export interface MessageSoundPlayer {
  /** `key` identifies the message, e.g. `party:mid`, so it plays once per browser. */
  play(key: string): void;
}

/** Party ids muted on convo.php. */
export function mutedParties(cookie: string = document.cookie): Set<number> {
  const raw = cookie
    .split(/;\s*/)
    .find((part) => part.startsWith("convoSoundData="))
    ?.slice("convoSoundData=".length);
  if (!raw) return new Set();
  try {
    const data = JSON.parse(decodeURIComponent(raw));
    return new Set(
      Object.keys(data && typeof data === "object" ? data : {})
        .map(Number)
        .filter((id) => Number.isFinite(id) && id !== 0)
    );
  } catch {
    return new Set();
  }
}

interface LockManagerLike {
  request(
    name: string,
    options: { ifAvailable: boolean },
    callback: (lock: unknown) => Promise<void> | void
  ): Promise<unknown>;
}

export interface MessageSoundOptions {
  origin?: string;
  /** navigator.locks; without it every tab plays. */
  locks?: LockManagerLike | null;
  /** Whether this tab may play audio (browsers block it until the user interacts). */
  canPlay?: () => boolean;
  createAudio?: (src: string) => {
    play(): Promise<void> | void;
    currentTime: number;
  };
}

/**
 * Plays HF's message sound once per message across all HF tabs: every tab
 * gets the message over its own socket, so the first tab that can play audio
 * claims it with a short Web Lock and the rest stay quiet.
 */
export class MessageSound implements MessageSoundPlayer {
  private audio: { play(): Promise<void> | void; currentTime: number } | null =
    null;
  private readonly src: string;
  private readonly locks: LockManagerLike | null;
  private readonly canPlay: () => boolean;
  private readonly createAudio: NonNullable<MessageSoundOptions["createAudio"]>;

  constructor(options: MessageSoundOptions = {}) {
    this.src = `${options.origin ?? location.origin}${SOUND_PATH}`;
    this.locks =
      options.locks !== undefined
        ? options.locks
        : (((navigator as any).locks as LockManagerLike | undefined) ?? null);
    // A tab the user hasn't interacted with can't play audio, so let another tab claim it
    this.canPlay =
      options.canPlay ??
      (() => (navigator as any).userActivation?.hasBeenActive !== false);
    this.createAudio =
      options.createAudio ??
      ((src) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        return audio;
      });
  }

  play(key: string): void {
    if (!this.canPlay()) return;
    if (!this.locks) {
      this.playNow();
      return;
    }
    this.locks
      .request(
        `hfx-convo-sound:${key}`,
        { ifAvailable: true },
        async (lock) => {
          if (!lock) return;
          this.playNow();
          await new Promise((resolve) => setTimeout(resolve, CLAIM_MS));
        }
      )
      .catch(() => undefined);
  }

  private playNow(): void {
    this.audio ??= this.createAudio(this.src);
    this.audio.currentTime = 0;
    Promise.resolve()
      .then(() => this.audio!.play())
      .catch(() => {
        // Blocked by autoplay rules or the file failed to load: stay quiet
      });
  }
}
