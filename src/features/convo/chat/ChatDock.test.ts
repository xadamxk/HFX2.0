import { chooseFile, transferEvent } from "../../../test-utils/transferEvent";
import { FakeConvoSocket } from "../../../test-utils/FakeConvoSocket";
import { ChatDock, DEFAULT_DOCK_STATE, OpenChat, shortTime } from "./ChatDock";
import { GlobalChatWindow } from "./GlobalChatWindow";
import { GlobalRoomClient } from "./GlobalRoomClient";
import type { SocketIOClient } from "./SocketIOClient";
import type { ChatMessage, Conversation, ConvoClient } from "./ConvoClient";
import { SendError } from "./ConvoClient";

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
  users = new Map([
    [ME.uid, { ...ME }],
    [OTHER.uid, { ...OTHER, group: 46 }],
  ]);
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
  sendImage = jest.fn(async () => ({ requestId: "req" }));
  send = jest.fn(async () => ({ requestId: "req" }));
  command = jest.fn(async (): Promise<unknown> => undefined);
  connect = jest.fn();
  disconnect = jest.fn();
  createRequestId = () => "req";
  addConversation(partyId: number, other: Conversation["other"]) {
    if (this.conversations.has(partyId)) return;
    this.conversations.set(partyId, { partyId, other, dateline: 0, unread: 0 });
    this.fire("conversations");
  }

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

let saveState: jest.Mock;
let globalSockets: FakeConvoSocket[];

const mount = async (
  options: {
    side?: "left" | "right";
    layout?: "bubbles" | "list";
    open?: boolean;
    global?: boolean;
    openChats?: OpenChat[];
    sound?: { play: jest.Mock };
  } = {}
) => {
  saveState = jest.fn();
  dock = new ChatDock({
    client: client as unknown as ConvoClient,
    sound: options.sound,
    maxBubbles: 5,
    typingIndicators: true,
    side: options.side,
    layout: options.layout,
    createGlobal: options.global
      ? ({ minimized, onClose, onChange, openChat }) => {
          const socket = new FakeConvoSocket();
          globalSockets.push(socket);
          return new GlobalChatWindow({
            postKey: "abc",
            minimized,
            typingIndicators: true,
            onClose,
            onChange,
            openChat,
            origin: "https://hackforums.net",
            createClient: () =>
              new GlobalRoomClient({
                postKey: "abc",
                createSocket: () => socket as unknown as SocketIOClient,
              }),
          });
        }
      : undefined,
    state: {
      ...DEFAULT_DOCK_STATE,
      open:
        options.openChats ??
        (options.open === false ? [] : [{ partyId: PARTY, minimized: false }]),
    },
    saveState,
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
  globalSockets = [];
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
    await mount({ open: false });
    const other = client.conversations.get(PARTY)!.other;

    for (const [ago, status] of [
      [60, "online"],
      [30 * 60, "away"],
      [3 * 60 * 60, "offline"],
    ] as const) {
      other.lastActive = now() - ago;
      client.fire("conversations");
      expect(head().dataset.presence).toBe(status);
      expect(head().querySelector(".hfx-chat-dot")!.classList).toContain(
        `hfx-chat-presence-${status}`
      );
      expect(head().title).toContain(`Charlie (${status})`);
    }
  });

  it("ages statuses without new data", async () => {
    jest.useFakeTimers({ now: Date.now() });
    try {
      await mount({ open: false });
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
    await mount();
    client.fire("conversations");
    client.fire("typing", OTHER.uid, true);
    expect(head().querySelector(".hfx-chat-dot-typing")).not.toBeNull();
    expect(document.querySelector(".hfx-chat-typing")!.textContent).toBe(
      "Charlie is typing…"
    );
    // The unread badge keeps its own corner
    client.conversations.get(PARTY)!.unread = 2;
    client.fire("conversations");
    expect(head().querySelector(".hfx-chat-badge")!.textContent).toBe("2");
    expect(head().querySelector(".hfx-chat-dot-typing")).not.toBeNull();

    // The status dot itself turns into the typing pill: one indicator, same status color
    expect(head().querySelectorAll(".hfx-chat-dot")).toHaveLength(1);
    expect(head().querySelector(".hfx-chat-dot")!.classList).toContain(
      "hfx-chat-presence-offline"
    );
    expect(head().querySelectorAll(".hfx-chat-dot i")).toHaveLength(3);

    client.add({ uid: OTHER.uid });
    expect(head().querySelector(".hfx-chat-dot-typing")).toBeNull();
    expect(head().querySelectorAll(".hfx-chat-dot")).toHaveLength(1);
    expect(head().querySelectorAll(".hfx-chat-dot i")).toHaveLength(0);
    expect(document.querySelector(".hfx-chat-typing")!.textContent).toBe("");
  });

  it("expires a typing notice that never stops", async () => {
    jest.useFakeTimers();
    try {
      await mount({ open: false });
      client.fire("conversations");
      client.fire("typing", OTHER.uid, true);
      expect(head().querySelector(".hfx-chat-dot-typing")).not.toBeNull();
      jest.advanceTimersByTime(35000);
      expect(head().querySelector(".hfx-chat-dot-typing")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("shows their status and typing on the window's header, minimized too", async () => {
    jest.useFakeTimers({ now: Date.now() });
    try {
      await mount();
      const win = document.querySelector<HTMLElement>(
        `.hfx-chat-window[data-party="${PARTY}"]`
      )!;
      const avatar = () =>
        win.querySelector<HTMLElement>(".hfx-chat-header-avatar")!;
      const dot = () => avatar().querySelector(".hfx-chat-dot")!;
      win.querySelector<HTMLButtonElement>("button[title=Minimize]")!.click();
      expect(win.classList).toContain("hfx-chat-minimized");

      client.conversations.get(PARTY)!.other.lastActive = now();
      client.fire("conversations");
      expect(avatar().dataset.presence).toBe("online");
      expect(dot().classList).toContain("hfx-chat-presence-online");
      expect(avatar().title).toBe("Charlie is online");
      expect(avatar().querySelector("img")).not.toBeNull();

      client.fire("typing", OTHER.uid, true);
      expect(dot().classList).toContain("hfx-chat-dot-typing");
      expect(avatar().title).toBe("Charlie is typing");
      client.fire("typing", OTHER.uid, false);
      expect(dot().classList).not.toContain("hfx-chat-dot-typing");

      // Statuses age on the header like on the bubble
      jest.advanceTimersByTime(16 * 60 * 1000);
      expect(avatar().dataset.presence).toBe("away");
      expect(avatar().querySelectorAll(".hfx-chat-dot")).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("docks on the left when configured", async () => {
    await mount({ side: "left", open: false });
    expect(document.getElementById("hfx-chat-dock")!.classList).toContain(
      "hfx-chat-left"
    );
    dock!.destroy();
    await mount({ open: false });
    expect(document.getElementById("hfx-chat-dock")!.classList).not.toContain(
      "hfx-chat-left"
    );
  });
});

describe("ChatDock sound", () => {
  let sound: { play: jest.Mock };
  beforeEach(() => {
    sound = { play: jest.fn() };
    document.cookie = "convoSoundData=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  it("plays for a new message from the other person", async () => {
    await mount({ open: false, sound });
    client.add({ uid: OTHER.uid });
    expect(sound.play).toHaveBeenCalledWith(`${PARTY}:1`);
  });

  it("stays quiet for your own messages and ones HF marks quiet", async () => {
    await mount({ open: false, sound });
    client.add({ uid: ME.uid });
    client.add({ uid: OTHER.uid, quiet: true });
    expect(sound.play).not.toHaveBeenCalled();
  });

  it("stays quiet for conversations muted on convo.php", async () => {
    document.cookie = `convoSoundData=${encodeURIComponent(JSON.stringify({ [PARTY]: true }))}`;
    await mount({ open: false, sound });
    client.add({ uid: OTHER.uid });
    expect(sound.play).not.toHaveBeenCalled();
  });

  it("stays quiet while you're looking at that chat", async () => {
    await mount({ sound });
    const hasFocus = jest.spyOn(document, "hasFocus").mockReturnValue(true);
    document
      .querySelector<HTMLTextAreaElement>(
        `.hfx-chat-window[data-party="${PARTY}"] textarea`
      )!
      .focus();
    client.add({ uid: OTHER.uid });
    expect(sound.play).not.toHaveBeenCalled();
    hasFocus.mockRestore();
  });

  it("is off without a sound player", async () => {
    await mount({ open: false });
    expect(() => client.add({ uid: OTHER.uid })).not.toThrow();
  });
});

describe("ChatDock sending", () => {
  const win = () =>
    document.querySelector<HTMLElement>(
      `.hfx-chat-window[data-party="${PARTY}"]`
    )!;
  const input = () => win().querySelector("textarea")!;
  const enter = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    await flush();
  };
  const failed = () => win().querySelector(".hfx-chat-failed");

  let confirmSpy: jest.SpyInstance;
  beforeEach(() => {
    confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
  });
  afterEach(() => confirmSpy.mockRestore());

  it("puts a message the server refused back in the input, with no retry", async () => {
    await mount();
    client.send.mockRejectedValueOnce(
      new SendError("You are muted.", "refused")
    );
    await enter("hello");
    expect(input().value).toBe("hello");
    expect(failed()).toBeNull();
    expect(win().querySelector(":scope > .hfx-chat-notice")!.textContent).toBe(
      "You are muted."
    );
  });

  it("offers a retry only for an unconfirmed send, and keeps it until the retry starts", async () => {
    await mount();
    client.send.mockRejectedValueOnce(
      new SendError("Delivery is unconfirmed.", "unconfirmed")
    );
    await enter("hello");
    expect(input().value).toBe("");
    expect(failed()!.textContent).toBe("hello");

    // Another send is still pending: the retry can't start, so it stays
    client.isSending = true;
    const retry = () =>
      Array.from(win().querySelectorAll("button")).find(
        (button) => button.textContent === "Retry"
      )!;
    retry().click();
    await flush();
    expect(client.send).toHaveBeenCalledTimes(1);
    client.isSending = false;
    // Another render of the pending sends keeps it
    client.send.mockImplementationOnce(() => new Promise(() => undefined));
    await enter("second");
    expect(failed()!.textContent).toBe("hello");

    retry().click();
    await flush();
    expect(client.send).toHaveBeenLastCalledWith(PARTY, "hello", "req");
  });

  it("closes the socket when the page is left and reconnects when it's back", async () => {
    await mount();
    dock!.suspend();
    expect(client.disconnect).toHaveBeenCalledTimes(1);
    dock!.resume();
    expect(client.connect).toHaveBeenCalledTimes(1);
  });
});

describe("ChatDock commands", () => {
  const win = () =>
    document.querySelector<HTMLElement>(
      `.hfx-chat-window[data-party="${PARTY}"]`
    )!;
  const input = () => win().querySelector("textarea")!;
  const notice = () => win().querySelector(":scope > .hfx-chat-notice")!;
  const enter = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    await flush();
  };

  afterEach(() => {
    document.cookie =
      "convoStorage=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost";
  });

  it("answers /help in the window, sending nothing", async () => {
    await mount();
    await enter("/help");
    expect(client.send).not.toHaveBeenCalled();
    expect(client.command).not.toHaveBeenCalled();
    expect(input().value).toBe("");
    expect(notice().classList).toContain("hfx-chat-reply");
    expect(notice().textContent).toContain("/flip WAGER");
  });

  it("lists commands on /, and Enter on one typed in full runs it", async () => {
    await mount();
    input().focus();
    input().value = "/";
    input().setSelectionRange(1, 1);
    input().dispatchEvent(new Event("input"));
    const picker = win().querySelector<HTMLElement>(".hfx-gc-mentions")!;
    const listed = Array.from(
      picker.querySelectorAll(".hfx-gc-command-usage")
    ).map((usage) => usage.textContent);
    expect(listed).toContain("/stats");
    // /leave does nothing in a DM
    expect(listed).not.toContain("/leave");

    input().value = "/help";
    input().setSelectionRange(5, 5);
    input().dispatchEvent(new Event("input"));
    expect(picker.hidden).toBe(false);
    input().dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", cancelable: true })
    );
    await flush();
    expect(picker.hidden).toBe(true);
    expect(notice().textContent).toContain("/flip WAGER");
    expect(client.send).not.toHaveBeenCalled();
  });

  it("sends commands the server runs as messages", async () => {
    await mount();
    await enter("/flip 100");
    expect(client.send).toHaveBeenCalledWith(PARTY, "/flip 100", "req");
  });

  it("shows /stats' answer from Stanley", async () => {
    await mount();
    client.command.mockResolvedValueOnce({
      uid: 1337,
      message: "Bytes Balance: 1.00",
    });
    await enter("/stats");
    expect(client.command).toHaveBeenCalledWith(
      expect.objectContaining({ event: "convo_checkstats" })
    );
    expect(notice().textContent).toContain("Bytes Balance: 1.00");
  });

  it("puts a refused command back in the input", async () => {
    await mount();
    client.command.mockRejectedValueOnce(
      new SendError("Member not found.", "refused")
    );
    await enter("/send Nobody");
    expect(notice().textContent).toBe("Member not found.");
    expect(notice().classList).not.toContain("hfx-chat-reply");
    expect(input().value).toBe("/send Nobody");
  });

  it("says /leave is for group chats", async () => {
    await mount();
    await enter("/leave");
    expect(client.command).not.toHaveBeenCalled();
    expect(notice().textContent).toContain("/leave only works in group chats.");
  });

  it("hides other people's flips after /flip hide", async () => {
    await mount();
    await enter("/flip hide");
    expect(notice().textContent).toContain("You will only see your own flips.");
    client.add(
      { text: "/flip 100" },
      { uid: ME.uid, text: "/flip 5" },
      { text: "after" }
    );
    expect(
      Array.from(win().querySelectorAll(".hfx-gc-line")).map(
        (line) => line.textContent
      )
    ).toEqual(["/flip 5", "after"]);
  });
});

describe("ChatDock drafts, unread line and keys", () => {
  const win = () =>
    document.querySelector<HTMLElement>(
      `.hfx-chat-window[data-party="${PARTY}"]`
    )!;
  const input = () => win().querySelector("textarea")!;

  afterEach(() => sessionStorage.clear());

  it("keeps unsent text for the next page in this tab", async () => {
    sessionStorage.setItem(
      "hfx-chat-drafts",
      JSON.stringify({ [`dm:${PARTY}`]: "half a thought" })
    );
    await mount();
    expect(input().value).toBe("half a thought");

    input().value = "something else";
    dock!.suspend();
    expect(JSON.parse(sessionStorage.getItem("hfx-chat-drafts")!)).toEqual({
      [`dm:${PARTY}`]: "something else",
    });

    // Sent or emptied: nothing is kept
    input().value = "  ";
    dock!.suspend();
    expect(sessionStorage.getItem("hfx-chat-drafts")).toBeNull();
  });

  it("marks where new messages start while you weren't looking", async () => {
    await mount();
    client.add({ text: "seen" });
    expect(win().querySelector(".hfx-chat-unread-divider")).toBeNull();
    client.add({ text: "missed", dateline: T + 3600 });
    const divider = win().querySelector(".hfx-chat-unread-divider")!;
    expect(divider.textContent).toBe("New messages");
    // Above the group the missed message starts
    expect(divider.nextElementSibling!.textContent).toContain("missed");

    // Focusing the window clears it
    input().focus();
    expect(win().querySelector(".hfx-chat-unread-divider")).toBeNull();
    input().blur();
    client.add({ text: "missed again", dateline: T + 7200 });
    expect(win().querySelector(".hfx-chat-unread-divider")).not.toBeNull();

    // So does sending
    input().value = "reply";
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    expect(win().querySelector(".hfx-chat-unread-divider")).toBeNull();
  });

  it("remembers who a DM window is with, for chats the inbox doesn't list", async () => {
    const NEW_PARTY = 476368;
    const KLON = { uid: 4606941, username: "Klonopin", avatar: "a.png" };
    await mount({
      openChats: [{ partyId: NEW_PARTY, minimized: true, with: KLON }],
    });
    const restored = document.querySelector<HTMLElement>(
      `.hfx-chat-window[data-party="${NEW_PARTY}"]`
    )!;
    expect(
      restored.querySelector(".hfx-chat-header-name, .hfx-chat-title a")!
        .textContent
    ).toBe("Klonopin");
    // And it's saved with the window
    restored.querySelector<HTMLElement>("button[title=Minimize]")!.click();
    expect(saveState.mock.lastCall[0].open).toEqual([
      {
        partyId: NEW_PARTY,
        minimized: false,
        with: { ...KLON, group: undefined },
      },
    ]);
  });

  it("replies to the other person from a button on their messages", async () => {
    await mount();
    client.add({ text: "theirs" }, { uid: ME.uid, text: "mine" });
    const lines = Array.from(win().querySelectorAll(".hfx-gc-line"));
    expect(lines[1].querySelector(".hfx-gc-reply")).toBeNull();
    lines[0].querySelector<HTMLButtonElement>(".hfx-gc-reply")!.click();
    expect(input().value).toBe("@Charlie@ ");
  });

  it("minimizes the window on Esc", async () => {
    await mount();
    input().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      })
    );
    expect(win().classList).toContain("hfx-chat-minimized");
  });

  describe("names in the global chat", () => {
    let open: jest.SpyInstance;
    beforeEach(() => {
      open = jest.spyOn(window, "open").mockReturnValue(null);
    });
    afterEach(() => open.mockRestore());

    const joinGlobal = async (sender: { uid: number; username: string }) => {
      await mount({ open: false, global: true });
      client.fire("conversations");
      document.querySelector<HTMLElement>(".hfx-chat-head-global")!.click();
      const socket = globalSockets[0];
      socket.fire("convo_ready", { user: ME, bootId: "b" });
      await flush();
      socket.fire("convo_receivemessage", {
        uid: sender.uid,
        mid: 1,
        party_id: -1,
        message: "hello room",
        dateline: T,
        bootId: "b",
        users: { [sender.uid]: { ...sender, avatar: "" } },
      });
      return document.querySelector<HTMLElement>(
        '.hfx-chat-window[data-party="-1"] .hfx-gc-name'
      )!;
    };

    it("open your chat with them, and Shift+click mentions them", async () => {
      const name = await joinGlobal(OTHER);
      expect(name.title).toBe("Message Charlie (Shift+click to mention)");
      name.dispatchEvent(
        new MouseEvent("click", { bubbles: true, shiftKey: true })
      );
      expect(
        document.querySelector<HTMLTextAreaElement>(
          '.hfx-chat-window[data-party="-1"] textarea'
        )!.value
      ).toBe("@Charlie@ ");
      expect(win()).toBeNull();

      name.click();
      await flush();
      expect(win()).not.toBeNull();
      expect(open).not.toHaveBeenCalled();
    });

    it("go to convo.php when the chat can't be looked up, once per click", async () => {
      const name = await joinGlobal({ uid: 999, username: "Stranger" });
      // A second click while the first is still looking is ignored
      name.click();
      name.click();
      await flush();
      await flush();
      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith(
        "https://hackforums.net/convo.php?action=user&uid=999",
        "_blank",
        "noopener"
      );
    });
  });
});

describe("ChatDock images", () => {
  const chatWindow = () =>
    document.querySelector<HTMLElement>(
      `.hfx-chat-window[data-party="${PARTY}"]`
    )!;
  const notice = () =>
    chatWindow().querySelector<HTMLElement>(":scope > .hfx-chat-notice")!;
  const file = (type = "image/png") =>
    new File([new Uint8Array([1, 2, 3])], "shot", { type });

  let confirmSpy: jest.SpyInstance;
  beforeEach(() => {
    confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
  });
  afterEach(() => confirmSpy.mockRestore());

  it("uploads a pasted image after HF's confirmation", async () => {
    await mount();
    chatWindow().dispatchEvent(transferEvent("paste", [file()]));
    await flush();
    await flush();
    expect(confirmSpy).toHaveBeenCalledWith(
      "Do you want to upload this image?"
    );
    expect(client.sendImage).toHaveBeenCalledTimes(1);
    const [partyId, bytes, requestId] = client.sendImage.mock
      .calls[0] as unknown as [number, ArrayBuffer, string];
    expect(partyId).toBe(PARTY);
    expect(Array.from(new Uint8Array(bytes))).toEqual([1, 2, 3]);
    expect(requestId).toBe("req");
  });

  it("uploads an image chosen with the + button left of the input", async () => {
    await mount();
    const compose = chatWindow().querySelector(".hfx-chat-compose")!;
    const button =
      compose.querySelector<HTMLButtonElement>(".hfx-chat-attach")!;
    expect(button.nextElementSibling).toBe(compose.querySelector("textarea"));
    chooseFile(button, file());
    await flush();
    await flush();
    // Chosen on purpose, so no paste confirmation
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(client.sendImage).toHaveBeenCalledTimes(1);
    expect((client.sendImage.mock.calls[0] as unknown[])[0]).toBe(PARTY);
  });

  it("refuses other file types with HF's message", async () => {
    await mount();
    chatWindow().dispatchEvent(transferEvent("drop", [file("image/webp")]));
    await flush();
    expect(client.sendImage).not.toHaveBeenCalled();
    expect(notice().textContent).toBe(
      "Invalid image type. Please use PNG, GIF, or JPG format."
    );
  });

  it("shows the upload as pending until it's acked", async () => {
    await mount();
    let ack!: () => void;
    client.sendImage.mockImplementation(
      () =>
        new Promise((resolve) => (ack = () => resolve({ requestId: "req" })))
    );
    chatWindow().dispatchEvent(transferEvent("drop", [file()]));
    await flush();
    await flush();
    expect(chatWindow().querySelector(".hfx-chat-pending")!.textContent).toBe(
      "Sending image…"
    );
    ack();
    await flush();
    expect(chatWindow().querySelector(".hfx-chat-pending")).toBeNull();
  });
});

describe("ChatDock global chat", () => {
  const globalHead = () =>
    document.querySelector<HTMLElement>(".hfx-chat-head-global");
  const globalWindow = () =>
    document.querySelector<HTMLElement>('.hfx-chat-window[data-party="-1"]');

  it("pins a global chat bubble above the launcher, only when enabled", async () => {
    await mount({ open: false });
    client.fire("conversations");
    expect(globalHead()).toBeNull();
    dock!.destroy();

    await mount({ open: false, global: true });
    client.fire("conversations");
    const heads = document.querySelector(".hfx-chat-heads")!.children;
    expect(heads[0].classList).toContain("hfx-chat-launcher");
    expect(heads[1]).toBe(globalHead());
  });

  it("opens the global window and joins the room on click", async () => {
    await mount({ open: false, global: true });
    client.fire("conversations");
    globalHead()!.click();

    expect(globalWindow()).not.toBeNull();
    expect(globalSockets).toHaveLength(1);
    expect(globalSockets[0].connects).toBe(1);
    expect(globalHead()!.classList).toContain("hfx-chat-head-open");
    expect(saveState).toHaveBeenLastCalledWith({
      open: [{ partyId: -1, minimized: false }],
      collapsed: false,
    });
  });

  it("restores the global window from saved state", async () => {
    await mount({
      global: true,
      openChats: [
        { partyId: -1, minimized: true },
        { partyId: PARTY, minimized: false },
      ],
    });
    expect(globalWindow()!.classList).toContain("hfx-chat-minimized");
    // Minimized, so it hasn't joined the room
    expect(globalSockets[0].connects).toBe(0);
  });

  it("ignores a saved global window when global chat is off", async () => {
    await mount({ openChats: [{ partyId: -1, minimized: false }] });
    expect(globalWindow()).toBeNull();
  });

  it("leaves the room when the window closes", async () => {
    await mount({ open: false, global: true });
    client.fire("conversations");
    globalHead()!.click();
    globalWindow()!
      .querySelector<HTMLElement>('.hfx-chat-action[title="Close"]')!
      .click();
    expect(globalWindow()).toBeNull();
    expect(globalSockets[0].disconnects).toBe(1);
    expect(saveState).toHaveBeenLastCalledWith({ open: [], collapsed: false });
  });

  it("pins a global chat row first in the list", async () => {
    await mount({ open: false, global: true, layout: "list" });
    client.fire("conversations");
    const rows = document.querySelectorAll(".hfx-chat-row");
    expect(rows[0].classList).toContain("hfx-chat-row-global");
    expect(rows[0].textContent).toContain("Global chat");
    (rows[0] as HTMLElement).click();
    expect(globalWindow()).not.toBeNull();
  });
});

describe("shortTime", () => {
  const now = 10_000_000;
  it("formats ages like Messenger", () => {
    expect(shortTime(now - 30, now)).toBe("now");
    expect(shortTime(now + 30, now)).toBe("now");
    expect(shortTime(now - 5 * 60, now)).toBe("5m");
    expect(shortTime(now - 3 * 3600, now)).toBe("3h");
    expect(shortTime(now - 2 * 86400, now)).toBe("2d");
    expect(shortTime(now - 15 * 86400, now)).toBe("2w");
    expect(shortTime(now - 400 * 86400, now)).toBe("1y");
  });
});

describe("ChatDock list layout", () => {
  const now = () => Math.floor(Date.now() / 1000);
  const row = (party = PARTY) =>
    document.querySelector<HTMLElement>(
      `.hfx-chat-row[data-party="${party}"]`
    )!;

  beforeEach(() => {
    const conversation = client.conversations.get(PARTY)!;
    conversation.dateline = now() - 2 * 3600;
    conversation.lastMessage = {
      mid: 1,
      partyId: PARTY,
      uid: ME.uid,
      text: "see you\nlater",
      dateline: conversation.dateline,
    };
    client.conversations.set(501, {
      partyId: 501,
      other: { uid: 7, username: "Seven", avatar: "", lastActive: now() },
      dateline: now() - 60,
      unread: 3,
      lastMessage: {
        mid: 2,
        partyId: 501,
        uid: 7,
        text: "hey",
        dateline: now() - 60,
      },
    });
  });

  it("lists conversations with name, time, preview and status", async () => {
    await mount({ layout: "list", open: false });
    client.fire("conversations");

    expect(document.querySelector(".hfx-chat-list")).not.toBeNull();
    expect(document.querySelector(".hfx-chat-head")).toBeNull();
    expect(
      document.querySelector(".hfx-chat-list-header")!.textContent
    ).toContain("Chats");

    const mine = row();
    expect(mine.querySelector(".hfx-chat-row-name")!.textContent).toBe(
      "Charlie"
    );
    expect(mine.querySelector(".hfx-chat-row-time")!.textContent).toBe("2h");
    expect(mine.querySelector(".hfx-chat-row-preview")!.textContent).toBe(
      "You: see you later"
    );
    expect(mine.dataset.presence).toBe("offline");
    expect(mine.classList).not.toContain("hfx-chat-row-unread");

    const theirs = row(501);
    expect(theirs.querySelector(".hfx-chat-row-preview")!.textContent).toBe(
      "hey"
    );
    expect(theirs.classList).toContain("hfx-chat-row-unread");
    expect(theirs.querySelector(".hfx-chat-row-badge")!.textContent).toBe("3");
    expect(
      theirs.querySelector(".hfx-chat-row-avatar .hfx-chat-dot")!.classList
    ).toContain("hfx-chat-presence-online");
    // Header counts conversations with unread messages
    expect(
      document.querySelector(".hfx-chat-list-header .hfx-chat-badge")!
        .textContent
    ).toBe("1");
  });

  it("shows typing in place of the preview", async () => {
    await mount({ layout: "list", open: false });
    client.fire("conversations");
    client.fire("typing", OTHER.uid, true);
    expect(row().querySelector(".hfx-chat-row-preview")!.textContent).toBe(
      "typing…"
    );
    expect(
      row().querySelector(".hfx-chat-row-avatar .hfx-chat-dot-typing")
    ).not.toBeNull();
  });

  it("opens a chat window from a row", async () => {
    await mount({ layout: "list", open: false });
    client.fire("conversations");
    row().click();
    await flush();
    expect(
      document.querySelector(`.hfx-chat-window[data-party="${PARTY}"]`)
    ).not.toBeNull();
    expect(row().classList).toContain("hfx-chat-row-open");
  });

  it("collapses to the header", async () => {
    await mount({ layout: "list", open: false });
    client.fire("conversations");
    const header = () =>
      document.querySelector<HTMLElement>(".hfx-chat-list-header")!;
    header().click();
    expect(document.querySelector(".hfx-chat-list-rows")).toBeNull();
    expect(header().getAttribute("aria-expanded")).toBe("false");
    header().click();
    expect(document.querySelectorAll(".hfx-chat-row")).toHaveLength(2);
  });
});

describe("ChatDock message layout", () => {
  /** Each sender group as "name: line, line". */
  const groups = () =>
    Array.from(
      document.querySelectorAll(".hfx-chat-messages .hfx-gc-group")
    ).map(
      (group) =>
        `${group.querySelector(".hfx-gc-name")!.textContent}: ${Array.from(
          group.querySelectorAll(".hfx-gc-line")
        )
          .map((line) => line.textContent)
          .join(", ")}`
    );

  it("groups each sender's messages within five minutes, like the room windows", async () => {
    client.messages = [];
    await mount();
    client.add(
      { uid: OTHER.uid, dateline: T, text: "one" },
      { uid: OTHER.uid, dateline: T + 30, text: "two" },
      { uid: ME.uid, dateline: T + 40, text: "mine" },
      { uid: ME.uid, dateline: T + 40 + 6 * 60, text: "later" }
    );
    expect(groups()).toEqual(["Charlie: one, two", "Me: mine", "Me: later"]);
    const first = document.querySelector(".hfx-chat-messages .hfx-gc-group")!;
    expect(first.querySelector(".hfx-gc-name span")!.className).toBe("group46");
    expect(first.querySelector<HTMLAnchorElement>(".hfx-gc-avatar")!.href).toBe(
      `https://hackforums.net/member.php?action=profile&uid=${OTHER.uid}`
    );
    expect(first.querySelector(".hfx-gc-time")).not.toBeNull();
    expect(document.querySelector(".hfx-chat-msg")).toBeNull();
  });

  it("adds a new message to the last group without redrawing it", async () => {
    await mount();
    client.add({ uid: OTHER.uid, dateline: T, text: "one" });
    const line = document.querySelector(".hfx-gc-line");
    client.add({ uid: OTHER.uid, dateline: T + 5, text: "two" });
    expect(groups()).toEqual(["Charlie: one, two"]);
    expect(document.querySelector(".hfx-gc-line")).toBe(line);
  });

  it("keeps messages in order when older ones load", async () => {
    await mount();
    client.add({ uid: OTHER.uid, dateline: T + 120, text: "newer" });
    // An older page arrives before it
    client.messages.unshift({
      mid: 0,
      partyId: PARTY,
      uid: OTHER.uid,
      text: "older",
      dateline: T,
    });
    client.fire("messages", PARTY, false);
    expect(groups()).toEqual(["Charlie: older, newer"]);
  });
});
