import { FakeConvoSocket } from "../../../test-utils/FakeConvoSocket";
import { ChatDock, DEFAULT_DOCK_STATE } from "./ChatDock";
import { ConvoClient } from "./ConvoClient";
import {
  convoLinkUid,
  fetchConvoParty,
  interceptConvoLinks,
  pageUserHint,
} from "./convoLinks";
import type { SocketIOClient } from "./SocketIOClient";

const HF = "https://hackforums.net";
const ME = { uid: 10, username: "Me", avatar: "" };
const CHARLIE = { uid: 123, username: "Charlie Sheen", avatar: "" };

const flush = () =>
  new Promise((resolve) => jest.requireActual("timers").setImmediate(resolve));

const link = (href: string, attrs: Record<string, string> = {}) => {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  for (const [name, value] of Object.entries(attrs))
    a.setAttribute(name, value);
  document.body.appendChild(a);
  return a;
};

describe("convoLinkUid", () => {
  it("reads HF's start-a-convo links, relative or absolute", () => {
    expect(convoLinkUid(link("convo.php?action=user&uid=123"), HF)).toBe(123);
    expect(convoLinkUid(link(`${HF}/convo.php?uid=5&action=user`), HF)).toBe(5);
  });

  it("ignores other links", () => {
    for (const href of [
      "convo.php?id=457869",
      "convo.php?action=all",
      "convo.php?action=user&uid=abc",
      "convo.php?action=user&uid=0",
      "private.php?action=send&uid=123",
      "https://example.com/convo.php?action=user&uid=123",
    ]) {
      expect(convoLinkUid(link(href), HF)).toBe(0);
    }
  });
});

describe("fetchConvoParty", () => {
  const respond = (url: string, ok = true) =>
    jest.fn(async () => ({ ok, url, body: null }) as unknown as Response);

  it("reads the chat id from convo.php's redirect", async () => {
    const fetchImpl = respond(`${HF}/convo.php?id=457869`);
    await expect(fetchConvoParty(123, HF, fetchImpl)).resolves.toBe(457869);
    expect(fetchImpl).toHaveBeenCalledWith(
      `${HF}/convo.php?action=user&uid=123`,
      { credentials: "same-origin" }
    );
  });

  it("is 0 when convo.php doesn't send it to a chat", async () => {
    await expect(
      fetchConvoParty(1, HF, respond(`${HF}/convo.php?action=user&uid=1`))
    ).resolves.toBe(0);
    await expect(
      fetchConvoParty(1, HF, respond(`${HF}/member.php?action=login`))
    ).resolves.toBe(0);
    await expect(
      fetchConvoParty(1, HF, respond(`${HF}/convo.php?id=5`, false))
    ).resolves.toBe(0);
  });
});

describe("pageUserHint", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("names the user from a post's author links", () => {
    document.body.innerHTML = `
      <div class="post_author">
        <a href="https://hackforums.net/member.php?action=profile&amp;uid=123"><img src="https://hackforums.net/uploads/avatars/avatar_123.png?dateline=1"></a>
        <a href="https://hackforums.net/member.php?action=profile&amp;uid=123"><span class="group2">Charlie Sheen</span></a>
        <a href="https://hackforums.net/member.php?action=profile&amp;uid=1234">Someone else</a>
      </div>`;
    expect(pageUserHint(123, HF)).toEqual({
      uid: 123,
      username: "Charlie Sheen",
      avatar: "uploads/avatars/avatar_123.png?dateline=1",
      lastActive: 0,
    });
  });

  it("gives nothing when the page doesn't name them", () => {
    expect(pageUserHint(123, HF)).toBeUndefined();
  });
});

describe("interceptConvoLinks", () => {
  let open: jest.Mock;
  let follow: jest.Mock;
  let stop: () => void;

  beforeEach(() => {
    document.body.innerHTML = "";
    open = jest.fn(async () => true);
    follow = jest.fn();
    stop = interceptConvoLinks(open, HF, document, follow);
  });
  afterEach(() => stop());

  const click = (target: Element, init: MouseEventInit = {}) => {
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
      ...init,
    });
    target.dispatchEvent(event);
    return event;
  };

  it("opens a plain click in the dock instead of following the link", async () => {
    const a = link("convo.php?action=user&uid=123");
    const icon = a.appendChild(document.createElement("i"));
    expect(click(icon).defaultPrevented).toBe(true);
    await flush();
    expect(open).toHaveBeenCalledWith(123);
    expect(follow).not.toHaveBeenCalled();
  });

  it("follows the link when the dock can't open the chat", async () => {
    open.mockResolvedValueOnce(false);
    const a = link("convo.php?action=user&uid=1");
    click(a);
    await flush();
    expect(follow).toHaveBeenCalledWith(a);

    open.mockRejectedValueOnce(new Error("offline"));
    click(a);
    await flush();
    expect(follow).toHaveBeenCalledTimes(2);
  });

  it("leaves modified, middle and other clicks to the browser", () => {
    const a = link("convo.php?action=user&uid=123");
    expect(click(a, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(click(a, { metaKey: true }).defaultPrevented).toBe(false);
    expect(click(a, { shiftKey: true }).defaultPrevented).toBe(false);
    expect(click(a, { button: 1 }).defaultPrevented).toBe(false);
    expect(click(link("convo.php?id=5")).defaultPrevented).toBe(false);
    const inDock = document.body.appendChild(document.createElement("div"));
    inDock.id = "hfx-chat-dock";
    const dockLink = inDock.appendChild(link("convo.php?action=user&uid=123"));
    expect(click(dockLink).defaultPrevented).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  it("ignores repeat clicks while the chat is being found", async () => {
    let finish!: (opened: boolean) => void;
    open.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const a = link("convo.php?action=user&uid=123");
    click(a);
    expect(click(a).defaultPrevented).toBe(true);
    expect(open).toHaveBeenCalledTimes(1);
    finish(true);
    await flush();
  });
});

describe("ChatDock.openChatWithUser", () => {
  let socket: FakeConvoSocket;
  let client: ConvoClient;
  let dock: ChatDock;
  let findParty: jest.Mock;

  beforeEach(async () => {
    document.body.innerHTML = "";
    socket = new FakeConvoSocket();
    socket.ackReplies.convo_loadmessages = () => ({
      ok: true,
      hasMore: false,
      lastMid: 0,
    });
    client = new ConvoClient({
      postKey: "abc",
      origin: HF,
      randomUUID: () => "req-1",
      createSocket: () => socket as unknown as SocketIOClient,
    });
    findParty = jest.fn(async () => 457869);
    dock = new ChatDock({
      client,
      maxBubbles: 5,
      typingIndicators: true,
      state: { ...DEFAULT_DOCK_STATE },
      saveState: () => undefined,
      findParty,
      origin: HF,
    });
    dock.mount();
    client.connect();
    socket.fire("convo_ready", { user: ME, bootId: "b" });
    await flush();
  });
  afterEach(() => dock.destroy());

  const windowFor = (party: number) =>
    document.querySelector(`.hfx-chat-window[data-party="${party}"]`);

  it("opens a chat that's already loaded without a request", async () => {
    socket.fire("convo_loaded_more_inbox", {
      messages: {
        900: {
          mid: 900,
          message: "hey",
          dateline: 1792540800,
          to_uid: ME.uid,
          from_uid: CHARLIE.uid,
          party_id: 457869,
          readtime: 0,
          unread: 0,
          party_data: { party: `${ME.uid},${CHARLIE.uid}` },
        },
      },
      users: { [ME.uid]: ME, [CHARLIE.uid]: CHARLIE },
    });
    await flush();
    expect(client.getConversations()).toHaveLength(1);
    await expect(dock.openChatWithUser(CHARLIE.uid)).resolves.toBe(true);
    expect(findParty).not.toHaveBeenCalled();
    expect(windowFor(457869)).not.toBeNull();
  });

  it("finds the chat once, names it from the page, and loads its history", async () => {
    const hint = { ...CHARLIE, lastActive: 0 };
    await expect(dock.openChatWithUser(CHARLIE.uid, hint)).resolves.toBe(true);
    expect(findParty).toHaveBeenCalledWith(CHARLIE.uid);
    expect(
      windowFor(457869)?.querySelector(".hfx-chat-title a")?.textContent
    ).toBe("Charlie Sheen");
    await flush();
    expect(socket.acked).toContainEqual([
      "convo_loadmessages",
      { party: 457869, mid: 0, position: "new", bulk: true, is_group: false },
    ]);

    await dock.openChatWithUser(CHARLIE.uid, hint);
    expect(findParty).toHaveBeenCalledTimes(1);
  });

  it("can't open a chat with no id, with yourself, or while disconnected", async () => {
    findParty.mockResolvedValueOnce(0);
    await expect(dock.openChatWithUser(1)).resolves.toBe(false);
    await expect(dock.openChatWithUser(ME.uid)).resolves.toBe(false);
    socket.fire("disconnect", "transport close");
    await expect(dock.openChatWithUser(CHARLIE.uid)).resolves.toBe(false);
  });
});
