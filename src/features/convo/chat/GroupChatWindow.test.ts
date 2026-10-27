import { FakeConvoSocket } from "../../../test-utils/FakeConvoSocket";
import { transferEvent } from "../../../test-utils/transferEvent";
import { ConvoClient } from "./ConvoClient";
import { GroupChatWindow } from "./GroupChatWindow";
import type { SocketIOClient } from "./SocketIOClient";

const ME = { uid: 10, username: "Me", avatar: "" };
const NOVA = { uid: 20, username: "Nova", avatar: "", group: 46 };
const ORBIT = { uid: 30, username: "Orbit", avatar: "", group: 2 };
const GID = 48;
const T = 1792540800;

const flush = () =>
  new Promise((resolve) => jest.requireActual("timers").setImmediate(resolve));

const groupMessage = (overrides: Record<string, unknown> = {}) => ({
  uid: NOVA.uid,
  mid: 1,
  party_id: GID,
  is_group: true,
  message: "hi",
  dateline: T,
  users: { [ME.uid]: ME, [NOVA.uid]: NOVA, [ORBIT.uid]: ORBIT },
  ...overrides,
});

describe("GroupChatWindow", () => {
  let socket: FakeConvoSocket;
  let client: ConvoClient;
  let win: GroupChatWindow;

  const open = async (minimized = false) => {
    win = new GroupChatWindow({
      client,
      gid: GID,
      name: "Brotherhood",
      minimized,
      typingIndicators: true,
      onClose: jest.fn(),
      onChange: jest.fn(),
      origin: "https://hackforums.net",
    });
    document.body.appendChild(win.root);
    await flush();
  };

  const lines = () =>
    Array.from(win.root.querySelectorAll(".hfx-gc-line")).map(
      (l) => l.textContent
    );

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
      origin: "https://hackforums.net",
      randomUUID: () => "req-1",
      createSocket: () => socket as unknown as SocketIOClient,
    });
    client.connect();
    socket.fire("convo_ready", { user: ME, bootId: "b" });
    await flush();
    client.setGroups([{ gid: GID, name: "Brotherhood" }]);
  });

  afterEach(() => win?.destroy());

  it("loads the group's history when opened, not when minimized", async () => {
    await open(true);
    expect(socket.acked.some(([event]) => event === "convo_loadmessages")).toBe(
      false
    );
    win.setMinimized(false);
    await flush();
    expect(socket.acked).toContainEqual([
      "convo_loadmessages",
      { party: GID, mid: 0, position: "new", bulk: true, is_group: true },
    ]);
  });

  it("shows only this group's messages, grouped by sender", async () => {
    await open();
    socket.fire("convo_receivemessage_bulk", [
      groupMessage({ mid: 1, message: "one" }),
      groupMessage({ mid: 2, message: "two", dateline: T + 30 }),
      groupMessage({
        mid: 3,
        uid: ORBIT.uid,
        message: "three",
        dateline: T + 60,
      }),
    ]);
    // Another group, and a DM with the same id, stay out
    socket.fire("convo_receivemessage", groupMessage({ party_id: 52, mid: 9 }));
    socket.fire("convo_receivemessage", {
      ...groupMessage({ mid: 10 }),
      is_group: undefined,
    });

    expect(win.root.querySelectorAll(".hfx-gc-group")).toHaveLength(2);
    expect(lines()).toEqual(["one", "two", "three"]);
    expect(win.root.querySelector(".hfx-gc-name span")!.className).toBe(
      "group46"
    );
  });

  it("sends with convo_newmessage_group", async () => {
    await open();
    socket.ackReplies.convo_newmessage_group = () => ({ ok: true });
    const input = win.root.querySelector("textarea")!;
    input.value = "hello group";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    expect(socket.acked).toContainEqual([
      "convo_newmessage_group",
      { partyID: GID, message: "hello group", requestId: "req-1" },
    ]);
  });

  it("refuses commands and images", async () => {
    await open();
    const input = win.root.querySelector("textarea")!;
    input.value = "/leave";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    expect(
      socket.acked.some(([event]) => event === "convo_newmessage_group")
    ).toBe(false);

    win.root.dispatchEvent(
      transferEvent("drop", [
        new File([new Uint8Array([1])], "a.png", { type: "image/png" }),
      ])
    );
    await flush();
    expect(socket.acked.some(([event]) => event === "convo_imageupload")).toBe(
      false
    );
    expect(
      win.root.querySelector(":scope > .hfx-chat-notice")!.textContent
    ).toBe("Images can't be sent to group chats from HFX yet.");
    // No + button where images can't be sent
    expect(win.root.querySelector(".hfx-chat-attach")).toBeNull();
  });

  it("offers members to mention on @, and Enter picks one instead of sending", async () => {
    await open();
    socket.fire("convo_receivemessage_bulk", [groupMessage()]);
    socket.ackReplies.convo_newmessage_group = () => ({ ok: true });
    const input = win.root.querySelector("textarea")!;
    input.focus();
    input.value = "hey @";
    input.setSelectionRange(5, 5);
    input.dispatchEvent(new Event("input"));
    const picker = win.root.querySelector<HTMLElement>(".hfx-gc-mentions")!;
    // Everyone seen but you
    expect(
      Array.from(picker.querySelectorAll('[role="option"]')).map(
        (o) => o.textContent
      )
    ).toEqual(["Nova", "Orbit"]);

    input.value = "hey @or";
    input.setSelectionRange(7, 7);
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", cancelable: true })
    );
    await flush();
    expect(input.value).toBe("hey @Orbit@ ");
    expect(picker.hidden).toBe(true);
    expect(
      socket.acked.some(([event]) => event === "convo_newmessage_group")
    ).toBe(false);

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    expect(socket.acked).toContainEqual([
      "convo_newmessage_group",
      { partyID: GID, message: "hey @Orbit@", requestId: "req-1" },
    ]);
  });

  it("lists members seen in the loaded messages", async () => {
    await open();
    socket.fire("convo_receivemessage_bulk", [groupMessage()]);
    win.root.querySelector<HTMLElement>(".hfx-gc-online-toggle")!.click();
    const panel = win.root.querySelector<HTMLElement>(".hfx-gc-online")!;
    expect(panel.hidden).toBe(false);
    expect(
      Array.from(panel.querySelectorAll(".hfx-gc-user")).map(
        (u) => u.textContent
      )
    ).toEqual(["Me", "Nova", "Orbit"]);
  });

  it("offers older messages after a full page, and keeps them in order", async () => {
    socket.ackReplies.convo_loadmessages = (data) => {
      if (data.position === "new") {
        socket.fire(
          "convo_receivemessage_bulk",
          Array.from({ length: 20 }, (_, i) =>
            groupMessage({
              mid: 100 + i,
              message: `m${100 + i}`,
              dateline: T + i,
            })
          )
        );
      } else {
        socket.fire("convo_receivemessage_bulk", [
          groupMessage({ mid: 50, message: "older", dateline: T - 3600 }),
        ]);
      }
      return { ok: true, hasMore: false };
    };
    await open();
    await flush();
    const older = win.root.querySelector<HTMLButtonElement>(".hfx-chat-older")!;
    expect(older.hidden).toBe(false);
    older.click();
    await flush();
    expect(lines()[0]).toBe("older");
    expect(lines()).toHaveLength(21);
    expect(older.hidden).toBe(true);
  });

  it("clears HFX's unread count when focused", async () => {
    await open();
    socket.fire("convo_receivemessage", groupMessage({ mid: 5 }));
    expect(client.groups.get(GID)!.unread).toBe(1);
    win.root.querySelector("textarea")!.focus();
    expect(client.groups.get(GID)!.unread).toBe(0);
  });

  it("shows typing only for members while this group was last loaded", async () => {
    await open();
    socket.fire("convo_receivemessage_bulk", [groupMessage()]);
    socket.fire("type_notice_add", { uid: NOVA.uid, username: "Nova" });
    const typing = () =>
      win.root.querySelector(".hfx-chat-typing")!.textContent;
    expect(typing()).toBe("Nova is typing…");
    socket.fire("type_notice_remove", { uid: NOVA.uid });

    // Once a DM is the last chat loaded, the notice can't be for this group
    await client.loadHistory(500);
    socket.fire("type_notice_add", { uid: NOVA.uid, username: "Nova" });
    expect(typing()).toBe("");
  });
});
