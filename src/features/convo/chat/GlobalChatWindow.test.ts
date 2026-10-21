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

  const open = async (minimized = false) => {
    win = new GlobalChatWindow({
      postKey: "abc",
      minimized,
      typingIndicators: true,
      onClose,
      onChange,
      origin: "https://hackforums.net",
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
