import { chooseFile, transferEvent } from "../../../test-utils/transferEvent";
import { FakeConvoSocket } from "../../../test-utils/FakeConvoSocket";
import { GlobalChatWindow, groupTime, typingText } from "./GlobalChatWindow";
import { GlobalRoomClient } from "./GlobalRoomClient";
import type { SocketIOClient } from "./SocketIOClient";

const ME = { uid: 10, username: "Me", avatar: "", usergroup: 2, group: 2 };
const NOVA = {
  uid: 20,
  username: "Nova",
  avatar: "",
  usergroup: 28,
  group: 46,
};
const ORBIT = {
  uid: 30,
  username: "Orbit",
  avatar: "",
  usergroup: 2,
  group: 2,
};
// A fixed time, so messages within it share a group
const T = 1792540800;

const flush = () =>
  new Promise((resolve) => jest.requireActual("timers").setImmediate(resolve));

const room = (overrides: Record<string, unknown> = {}) => ({
  uid: NOVA.uid,
  mid: 1,
  party_id: -1,
  message: "hi",
  dateline: T,
  bootId: "b",
  users: { [NOVA.uid]: NOVA, [ORBIT.uid]: ORBIT, [ME.uid]: ME },
  ...overrides,
});

describe("GlobalChatWindow", () => {
  let socket: FakeConvoSocket;
  let win: GlobalChatWindow;
  let onClose: jest.Mock;
  let onChange: jest.Mock;

  let sound: { play: jest.Mock };

  const open = async (minimized = false) => {
    win = new GlobalChatWindow({
      postKey: "abc",
      minimized,
      typingIndicators: true,
      onClose,
      onChange,
      origin: "https://hackforums.net",
      sound,
      createClient: () =>
        new GlobalRoomClient({
          postKey: "abc",
          origin: "https://hackforums.net",
          randomUUID: () => "req-1",
          createSocket: () => socket as unknown as SocketIOClient,
        }),
    });
    document.body.appendChild(win.root);
    if (!minimized) {
      socket.fire("convo_ready", { user: ME, bootId: "b" });
      await flush();
    }
  };

  /** Each group as "Name: line | line". */
  const groups = () =>
    Array.from(win.root.querySelectorAll(".hfx-gc-group")).map(
      (group) =>
        `${group.querySelector(".hfx-gc-name")!.textContent}: ${Array.from(
          group.querySelectorAll(".hfx-gc-line")
        )
          .map((line) => line.textContent)
          .join(" | ")}`
    );

  const input = () => win.root.querySelector("textarea")!;
  const notice = () =>
    win.root.querySelector<HTMLElement>(
      ".hfx-chat-notice:not(.hfx-gc-messages *)"
    )!;

  beforeEach(() => {
    document.body.innerHTML = "";
    socket = new FakeConvoSocket();
    onClose = jest.fn();
    onChange = jest.fn();
    sound = { play: jest.fn() };
  });

  afterEach(() => win?.destroy());

  it("joins the room when opened, not when minimized", async () => {
    await open(true);
    expect(socket.connects).toBe(0);
    win.setMinimized(false);
    expect(socket.connects).toBe(1);
    expect(onChange).toHaveBeenCalled();
    win.setMinimized(true);
    expect(socket.disconnects).toBe(1);
  });

  it("groups a sender's messages within five minutes", async () => {
    await open();
    socket.fire("convo_receivemessage_bulk", [
      room({ mid: 1, message: "one" }),
      room({ mid: 2, message: "two", dateline: T + 60 }),
      room({ mid: 3, uid: ORBIT.uid, message: "three", dateline: T + 90 }),
      room({
        mid: 4,
        uid: ORBIT.uid,
        message: "four",
        dateline: T + 90 + 6 * 60,
      }),
    ]);
    socket.fire(
      "convo_receivemessage",
      room({
        mid: 5,
        uid: ORBIT.uid,
        message: "five",
        dateline: T + 90 + 6 * 60 + 5,
      })
    );

    expect(groups()).toEqual([
      "Nova: one | two",
      "Orbit: three",
      "Orbit: four | five",
    ]);
    // HF styles the username with its group class
    expect(win.root.querySelector(".hfx-gc-name span")!.className).toBe(
      "group46"
    );
  });

  it("inserts a mention when a name is clicked", async () => {
    await open();
    socket.fire("convo_receivemessage", room());
    input().value = "hey";
    win.root.querySelector<HTMLElement>(".hfx-gc-name")!.click();
    expect(input().value).toBe("hey @Nova@ ");
  });

  it("plays a sound only for new messages that mention you", async () => {
    await open();
    // History arrives marked noSound
    socket.fire("convo_receivemessage_bulk", [
      room({ mid: 1, message: "old @me@", noSound: true, history: true }),
    ]);
    socket.fire("convo_receivemessage", room({ mid: 2, message: "hi all" }));
    expect(sound.play).not.toHaveBeenCalled();

    socket.fire("convo_receivemessage", room({ mid: 3, message: "hey @Me@" }));
    expect(sound.play).toHaveBeenCalledWith("global:b:3");
  });

  it("highlights messages that mention you", async () => {
    await open();
    socket.fire("convo_receivemessage_bulk", [
      room({ mid: 1, message: "hello @me@!" }),
      room({ mid: 2, message: "hello everyone" }),
    ]);
    const lines = win.root.querySelectorAll(".hfx-gc-line");
    expect(lines[0].classList).toContain("hfx-gc-mention");
    expect(lines[1].classList).not.toContain("hfx-gc-mention");
  });

  it("shows mentions the way HF sends them now: a previewed profile link", async () => {
    await open();
    const url = `https://hackforums.net/member.php?action=profile&uid=${ME.uid}`;
    socket.fire(
      "convo_receivemessage",
      room({
        mid: 3,
        message: `${url} look`,
        extra: {
          message: `${url} look`,
          previews: {
            [`/member.php?action=profile&uid=${ME.uid}`]: {
              label: "Me",
              title: "Me's Profile",
              group: 2,
            },
          },
        },
      })
    );
    const line = win.root.querySelector(".hfx-gc-line")!;
    expect(line.textContent).toBe("Me look");
    expect(line.querySelector("a strong")!.className).toBe("group2");
    expect(line.classList).toContain("hfx-gc-mention");
    expect(sound.play).toHaveBeenCalledTimes(1);
  });

  it("renders message text as text", async () => {
    await open();
    socket.fire(
      "convo_receivemessage",
      room({ message: '<img src=x onerror="alert(1)">' })
    );
    const line = win.root.querySelector(".hfx-gc-line")!;
    expect(line.querySelector("img")).toBeNull();
    expect(line.textContent).toBe('<img src=x onerror="alert(1)">');
  });

  it("shows who's online by rank, and mentions them on click", async () => {
    await open();
    socket.fire("convo_group_count", {
      count: 2,
      users: { [NOVA.uid]: NOVA, [ORBIT.uid]: ORBIT },
    });
    const toggle = win.root.querySelector<HTMLButtonElement>(
      ".hfx-gc-online-toggle"
    )!;
    expect(toggle.hidden).toBe(false);
    expect(toggle.textContent).toBe("2 online");
    toggle.click();

    const panel = win.root.querySelector<HTMLElement>(".hfx-gc-online")!;
    expect(panel.hidden).toBe(false);
    expect(
      Array.from(panel.querySelectorAll(".hfx-gc-rank, .hfx-gc-user")).map(
        (n) => n.textContent
      )
    ).toEqual(["Ub3r", "Nova", "Registered", "Orbit"]);
    panel.querySelectorAll<HTMLElement>(".hfx-gc-user")[1].click();
    expect(panel.hidden).toBe(true);
    expect(input().value).toBe("@Orbit@ ");
  });

  it("offers who's online to mention on @, by name and without you", async () => {
    await open();
    const ARIA = { uid: 40, username: "aria", avatar: "", usergroup: 2 };
    socket.fire("convo_group_count", {
      count: 4,
      users: { [ME.uid]: ME, [NOVA.uid]: NOVA, [ORBIT.uid]: ORBIT, 40: ARIA },
    });
    const field = input();
    field.focus();
    field.value = "@";
    field.setSelectionRange(1, 1);
    field.dispatchEvent(new Event("input"));
    const picker = win.root.querySelector<HTMLElement>(".hfx-gc-mentions")!;
    expect(
      Array.from(picker.querySelectorAll('[role="option"]')).map(
        (o) => o.textContent
      )
    ).toEqual(["aria", "Nova", "Orbit"]);

    field.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", cancelable: true })
    );
    field.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", cancelable: true })
    );
    await flush();
    expect(field.value).toBe("@Nova@ ");
    expect(socket.acked.some(([event]) => event === "convo_newmessage")).toBe(
      false
    );
  });

  it("refuses commands without sending", async () => {
    await open();
    input().value = "/flip 500";
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    expect(
      socket.acked.filter(([event]) => event === "convo_newmessage")
    ).toHaveLength(0);
    expect(notice().textContent).toContain("only work on convo.php");
    expect(input().value).toBe("/flip 500");
  });

  it("puts the text back when the server refuses it, but not when unconfirmed", async () => {
    await open();
    socket.ackReplies.convo_newmessage = () => ({
      ok: false,
      error: "You are sending messages too fast.",
    });
    input().value = "hello room";
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    await flush();
    expect(notice().textContent).toBe("You are sending messages too fast.");
    expect(input().value).toBe("hello room");
    expect(win.root.querySelector(".hfx-gc-pending")).toBeNull();

    // No reply: it may be in the room, so it isn't put back to resend
    socket.ackReplies.convo_newmessage = () => {
      throw new Error("Timed out waiting for a reply.");
    };
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();
    await flush();
    expect(notice().textContent).toContain("Delivery is unconfirmed");
    expect(input().value).toBe("");
  });

  it("leaves the room while the page is away and rejoins when it's back", async () => {
    await open();
    expect(socket.connects).toBe(1);
    win.suspend();
    expect(socket.disconnects).toBe(1);
    win.resume();
    expect(socket.connects).toBe(2);
    // A minimized window stays out of the room
    win.setMinimized(true);
    win.suspend();
    win.resume();
    expect(socket.connects).toBe(2);
  });

  it("shows a pending line until the echo arrives", async () => {
    await open();
    let ack!: (value: unknown) => void;
    socket.ackReplies.convo_newmessage = () =>
      new Promise((resolve) => (ack = resolve));
    input().value = "hello room";
    input().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await flush();

    expect(socket.acked).toContainEqual([
      "convo_newmessage",
      { partyID: -1, message: "hello room", requestId: "req-1" },
    ]);
    expect(win.root.querySelector(".hfx-gc-pending")!.textContent).toBe(
      "Sending: hello room"
    );
    socket.fire(
      "convo_receivemessage",
      room({ uid: ME.uid, mid: 9, message: "hello room", requestId: "req-1" })
    );
    expect(win.root.querySelector(".hfx-gc-pending")).toBeNull();
    expect(groups()).toEqual(["Me: hello room"]);
    ack({ ok: true });
    await flush();
  });

  it("uploads a dropped image to the room", async () => {
    await open();
    socket.ackReplies.convo_imageupload = () => ({ ok: true });
    const file = new File([new Uint8Array([7, 8])], "a.gif", {
      type: "image/gif",
    });
    win.root.dispatchEvent(transferEvent("drop", [file]));
    await flush();
    await flush();

    const upload = socket.acked.find(
      ([event]) => event === "convo_imageupload"
    );
    expect(upload).toBeDefined();
    const data = upload![1] as {
      partyID: number;
      imageData: ArrayBuffer;
      requestId: string;
    };
    expect(data.partyID).toBe(-1);
    expect(Array.from(new Uint8Array(data.imageData))).toEqual([7, 8]);
    expect(data.requestId).toBe("req-1");
    // Acked, so the pending line is gone even before an echo
    expect(win.root.querySelector(".hfx-gc-pending")).toBeNull();
  });

  it("uploads an image chosen with the + button", async () => {
    await open();
    socket.ackReplies.convo_imageupload = () => ({ ok: true });
    const button = win.root.querySelector<HTMLButtonElement>(
      ".hfx-chat-compose .hfx-chat-attach"
    )!;
    chooseFile(
      button,
      new File([new Uint8Array([7, 8])], "a.gif", { type: "image/gif" })
    );
    await flush();
    await flush();
    expect(socket.acked.some(([event]) => event === "convo_imageupload")).toBe(
      true
    );
  });

  it("refuses images that are too big", async () => {
    await open();
    const big = new File([new Uint8Array(3000001)], "big.png", {
      type: "image/png",
    });
    win.root.dispatchEvent(transferEvent("drop", [big]));
    await flush();
    expect(socket.acked.some(([event]) => event === "convo_imageupload")).toBe(
      false
    );
    expect(notice().textContent).toBe("Images cannot exceed 3MB in size.");
  });

  it("shows who's typing", async () => {
    await open();
    socket.fire("type_notice_add", { uid: NOVA.uid, username: "Nova" });
    expect(win.root.querySelector(".hfx-chat-typing")!.textContent).toBe(
      "Nova is typing…"
    );
  });

  it("starts over when the room restarts", async () => {
    await open();
    socket.fire("convo_receivemessage", room());
    socket.fire("convo_ready", { user: ME, bootId: "c" });
    await flush();
    expect(groups()).toEqual([]);
  });

  it("closes from the header", async () => {
    await open();
    win.root
      .querySelector<HTMLElement>('.hfx-chat-action[title="Close"]')!
      .click();
    expect(onClose).toHaveBeenCalled();
  });
});

describe("typingText", () => {
  it("names up to two people", () => {
    expect(typingText([])).toBe("");
    expect(typingText(["Nova"])).toBe("Nova is typing…");
    expect(typingText(["Nova", "Orbit"])).toBe("Nova and Orbit are typing…");
    expect(typingText(["A", "B", "C"])).toBe("Several people are typing…");
  });
});

describe("groupTime", () => {
  it("adds the date for earlier days", () => {
    const now = new Date(2026, 9, 20, 21, 0);
    const today = Math.floor(new Date(2026, 9, 20, 8, 5).getTime() / 1000);
    const earlier = Math.floor(new Date(2026, 9, 18, 8, 5).getTime() / 1000);
    expect(groupTime(today, now)).not.toContain(",");
    expect(groupTime(earlier, now)).toContain(",");
  });
});
