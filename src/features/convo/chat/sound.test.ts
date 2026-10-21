import { MessageSound, mutedParties, SOUND_PATH } from "./sound";

/** A Web Locks stand-in shared by "tabs": a held name isn't available to others. */
class FakeLocks {
  held = new Set<string>();
  async request(
    name: string,
    _options: { ifAvailable: boolean },
    callback: (lock: unknown) => Promise<void> | void
  ) {
    if (this.held.has(name)) return callback(null);
    this.held.add(name);
    try {
      return await callback({ name });
    } finally {
      this.held.delete(name);
    }
  }
}

const flush = () =>
  new Promise((resolve) => jest.requireActual("timers").setImmediate(resolve));

describe("mutedParties", () => {
  it("reads convo.php's mutes from the convoSoundData cookie", () => {
    const cookie = `a=1; convoSoundData=${encodeURIComponent(
      JSON.stringify({ "457869": true, "-1": true })
    )}; b=2`;
    expect(Array.from(mutedParties(cookie)).sort()).toEqual([-1, 457869]);
  });

  it("is empty without the cookie or with junk", () => {
    expect(mutedParties("a=1").size).toBe(0);
    expect(mutedParties("convoSoundData=%7Bnope").size).toBe(0);
  });
});

describe("MessageSound", () => {
  let played: string[];
  const tab = (locks: FakeLocks | null, canPlay = true) =>
    new MessageSound({
      origin: "https://hackforums.net",
      locks,
      canPlay: () => canPlay,
      isHidden: () => false,
      createAudio: (src) => ({
        currentTime: 5,
        play: () => void played.push(src),
      }),
    });

  beforeEach(() => {
    jest.useFakeTimers();
    played = [];
  });
  afterEach(() => jest.useRealTimers());

  it("plays HF's convo sound", async () => {
    tab(null).play("1:1");
    await flush();
    expect(played).toEqual([`https://hackforums.net${SOUND_PATH}`]);
  });

  it("plays a message once across tabs", async () => {
    const locks = new FakeLocks();
    const [a, b] = [tab(locks), tab(locks)];
    a.play("500:9");
    b.play("500:9");
    await flush();
    expect(played).toHaveLength(1);
    // A different message can play while the first is still claimed
    b.play("500:10");
    await flush();
    expect(played).toHaveLength(2);
  });

  it("leaves it to tabs that can play audio", async () => {
    const locks = new FakeLocks();
    tab(locks, false).play("500:9");
    tab(locks).play("500:9");
    await flush();
    expect(played).toHaveLength(1);
  });

  it("lets a visible tab play before hidden ones", async () => {
    const locks = new FakeLocks();
    const audible: string[] = [];
    const make = (name: string, hidden: boolean) =>
      new MessageSound({
        locks,
        isHidden: () => hidden,
        createAudio: () => ({
          currentTime: 0,
          play: () => void audible.push(name),
        }),
      });
    // The hidden tab gets the message first, but waits
    make("hidden", true).play("500:9");
    make("visible", false).play("500:9");
    await flush();
    jest.advanceTimersByTime(200);
    await flush();
    expect(audible).toEqual(["visible"]);
  });

  it("stays quiet when the browser blocks playback", async () => {
    const sound = new MessageSound({
      locks: null,
      createAudio: () => ({
        currentTime: 0,
        play: () => Promise.reject(new Error("NotAllowedError")),
      }),
    });
    expect(() => sound.play("1:1")).not.toThrow();
    await flush();
  });
});
