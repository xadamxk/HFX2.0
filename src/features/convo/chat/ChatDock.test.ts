import { ChatDock, DEFAULT_DOCK_STATE } from "./ChatDock";
import type { ChatMessage, Conversation, ConvoClient } from "./ConvoClient";
import { convoNiceTime } from "../common/timestamps";

const ME = { uid: 10, username: "Me", avatar: "" };
const OTHER = { uid: 123, username: "Charlie", avatar: "" };
const PARTY = 500;
// A minute boundary, so +0..59 seconds share a minute
const T = 1792540800;

/** Just enough of ConvoClient for the dock. */
class FakeClient {
  me = ME;
  status = "connecting";
  isSending = false;
  conversations = new Map<number, Conversation>([
    [PARTY, { partyId: PARTY, other: OTHER, dateline: T, unread: 0 }],
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

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("ChatDock timestamps", () => {
  let client: FakeClient;

  const mount = async (timestamps: boolean) => {
    const dock = new ChatDock({
      client: client as unknown as ConvoClient,
      maxBubbles: 5,
      typingIndicators: true,
      timestamps,
      state: {
        ...DEFAULT_DOCK_STATE,
        open: [{ partyId: PARTY, minimized: false }],
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

  beforeEach(() => {
    document.body.innerHTML = "";
    client = new FakeClient();
  });

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
