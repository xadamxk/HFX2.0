import { ChatDock, DEFAULT_DOCK_STATE } from "./ChatDock";
import type { ChatMessage, Conversation, ConvoClient } from "./ConvoClient";
import { convoNiceTime } from "../common/timestamps";

const ME = { uid: 10, username: "Me", avatar: "", lastActive: 0 };
const OTHER = { uid: 123, username: "Charlie", avatar: "", lastActive: 0 };
const PARTY = 500;
// A minute boundary, so +0..59 seconds share a minute
const T = 1792540800;

/** Just enough of ConvoClient for the dock. */
class FakeClient {
  me = ME;
  status = "connecting";
  isSending = false;
  conversations = new Map<number, Conversation>([
    [PARTY, { partyId: PARTY, other: { ...OTHER }, dateline: T, unread: 0 }],
  ]);
  messages: ChatMessage[] = [];
  listeners = new Map<string, ((...args: any[]) => void)[]>();

  on(event: string, listener: (...args: any[]) => void) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
    return this;
  }
  fire(event: string, ...args: unknown[]) {
    (this.listeners.get(event) ?? []).forEach((listener) => listener(...args));
  }
  getConversations() {
    return Array.from(this.conversations.values());
  }
  getMessages() {
    return this.messages;
  }
  loadHistory = jest.fn(async () => undefined);
  loadOlder = jest.fn(async () => false);
  markRead = jest.fn();
  setTyping = jest.fn();
  createRequestId = () => "req";

  /** Add messages as the socket would and notify the dock. */
  add(...messages: Partial<ChatMessage>[]) {
    for (const message of messages) {
      this.messages.push({
        mid: this.messages.length + 1,
        partyId: PARTY,
        uid: OTHER.uid,
        text: "hi",
        dateline: T,
        ...message,
      });
    }
    this.fire("messages", PARTY, true);
  }
}

// A real timer, so it also resolves in tests using fake timers
const flush = () =>
  new Promise((resolve) => jest.requireActual("timers").setImmediate(resolve));

let client: FakeClient;
let dock: ChatDock | undefined;

const mount = async (
  timestamps: boolean,
  options: { side?: "left" | "right"; open?: boolean } = {}
) => {
  dock = new ChatDock({
    client: client as unknown as ConvoClient,
    maxBubbles: 5,
    typingIndicators: true,
    timestamps,
    side: options.side,
    state: {
      ...DEFAULT_DOCK_STATE,
      open:
        options.open === false ? [] : [{ partyId: PARTY, minimized: false }],
    },
    saveState: jest.fn(),
    origin: "https://hackforums.net",
  });
  dock.mount();
  client.status = "ready";
  client.fire("status", "ready");
  await flush();
  return dock;
};

beforeEach(() => {
  document.body.innerHTML = "";
  client = new FakeClient();
});

afterEach(() => {
  dock?.destroy();
  dock = undefined;
});

describe("ChatDock bubbles", () => {
  const head = () =>
    document.querySelector<HTMLElement>(
      `.hfx-chat-head[data-party="${PARTY}"]`
    )!;
  const now = () => Math.floor(Date.now() / 1000);

  it("colors the bubble by the user's last-active time", async () => {
    await mount(true, { open: false });
    const other = client.conversations.get(PARTY)!.other;

    for (const [ago, status] of [
      [60, "online"],
      [30 * 60, "away"],
      [3 * 60 * 60, "offline"],
    ] as const) {
      other.lastActive = now() - ago;
      client.fire("conversations");
      expect(head().dataset.presence).toBe(status);
      expect(head().classList).toContain(`hfx-chat-presence-${status}`);
      expect(head().title).toContain(`Charlie (${status})`);
    }
  });

  it("ages statuses without new data", async () => {
    jest.useFakeTimers({ now: Date.now() });
    try {
      await mount(true, { open: false });
      client.conversations.get(PARTY)!.other.lastActive = now();
      client.fire("conversations");
      expect(head().dataset.presence).toBe("online");
      jest.advanceTimersByTime(16 * 60 * 1000);
      expect(head().dataset.presence).toBe("away");
    } finally {
      jest.useRealTimers();
    }
  });

  it("shows typing on the bubble and in the window until they send", async () => {
    await mount(true);
    client.fire("conversations");
    client.fire("typing", OTHER.uid, true);
    expect(head().querySelector(".hfx-chat-head-typing")).not.toBeNull();
    expect(document.querySelector(".hfx-chat-typing")!.textContent).toBe(
      "Charlie is typing…"
    );
    // The unread badge keeps its own corner
    client.conversations.get(PARTY)!.unread = 2;
    client.fire("conversations");
    expect(head().querySelector(".hfx-chat-badge")!.textContent).toBe("2");
    expect(head().querySelector(".hfx-chat-head-typing")).not.toBeNull();

    client.add({ uid: OTHER.uid });
    expect(head().querySelector(".hfx-chat-head-typing")).toBeNull();
    expect(document.querySelector(".hfx-chat-typing")!.textContent).toBe("");
  });

  it("expires a typing notice that never stops", async () => {
    jest.useFakeTimers();
    try {
      await mount(true, { open: false });
      client.fire("conversations");
      client.fire("typing", OTHER.uid, true);
      expect(head().querySelector(".hfx-chat-head-typing")).not.toBeNull();
      jest.advanceTimersByTime(35000);
      expect(head().querySelector(".hfx-chat-head-typing")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("docks on the left when configured", async () => {
    await mount(true, { side: "left", open: false });
    expect(document.getElementById("hfx-chat-dock")!.classList).toContain(
      "hfx-chat-left"
    );
    dock!.destroy();
    await mount(true, { open: false });
    expect(document.getElementById("hfx-chat-dock")!.classList).not.toContain(
      "hfx-chat-left"
    );
  });
});

describe("ChatDock timestamps", () => {
  /** The window's messages and timestamps in order, e.g. ["1", "@", "2"]. */
  const layout = () =>
    Array.from(
      document.querySelectorAll(
        ".hfx-chat-messages > .hfx-chat-msg[data-mid], .hfx-chat-messages > .message-bubble-timestamp"
      )
    ).map((node) =>
      node.classList.contains("message-bubble-timestamp")
        ? `@${node.textContent}`
        : (node as HTMLElement).dataset.mid
    );

  it("puts one timestamp under each same-sender, same-minute run", async () => {
    client.messages = [];
    await mount(true);
    client.add(
      { uid: OTHER.uid, dateline: T },
      { uid: OTHER.uid, dateline: T + 30 },
      { uid: ME.uid, dateline: T + 40 },
      { uid: ME.uid, dateline: T + 70 }
    );

    const minute = `@${convoNiceTime(T)}`;
    expect(layout()).toEqual([
      "1",
      "2",
      minute,
      "3",
      minute,
      "4",
      `@${convoNiceTime(T + 70)}`,
    ]);
    const stamps = document.querySelectorAll(".message-bubble-timestamp");
    expect(stamps[0].classList).toContain("hfx-chat-stamp-theirs");
    expect(stamps[1].classList).toContain("hfx-chat-stamp-mine");
  });

  it("moves the timestamp when a newer message joins the minute", async () => {
    await mount(true);
    client.add({ uid: OTHER.uid, dateline: T });
    expect(layout()).toEqual(["1", `@${convoNiceTime(T)}`]);

    client.add({ uid: OTHER.uid, dateline: T + 5 });
    expect(layout()).toEqual(["1", "2", `@${convoNiceTime(T)}`]);
  });

  it("keeps timestamps in place when older messages load", async () => {
    await mount(true);
    client.add({ uid: OTHER.uid, dateline: T + 120 });
    // An older page arrives before it
    client.messages.unshift({
      mid: 0,
      partyId: PARTY,
      uid: OTHER.uid,
      text: "older",
      dateline: T,
    });
    client.fire("messages", PARTY, false);

    expect(layout()).toEqual([
      "0",
      `@${convoNiceTime(T)}`,
      "1",
      `@${convoNiceTime(T + 120)}`,
    ]);
  });

  it("shows no timestamps when Message Timestamps is off", async () => {
    await mount(false);
    client.add({ uid: OTHER.uid }, { uid: ME.uid });
    expect(layout()).toEqual(["1", "2"]);
  });
});
