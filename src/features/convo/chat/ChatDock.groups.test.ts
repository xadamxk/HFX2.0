import { FakeConvoSocket } from "../../../test-utils/FakeConvoSocket";
import {
  ChatDock,
  DEFAULT_DOCK_STATE,
  DockGroups,
  DockState,
  groupInitials,
} from "./ChatDock";
import { ConvoClient } from "./ConvoClient";
import type { GroupInfo } from "./groupList";
import type { SocketIOClient } from "./SocketIOClient";

const ME = { uid: 10, username: "Me", avatar: "" };
const NOVA = { uid: 20, username: "Nova", avatar: "" };
const PARTY = 500;
const NOW = Math.floor(Date.now() / 1000);

const flush = () =>
  new Promise((resolve) => jest.requireActual("timers").setImmediate(resolve));

const inboxRow = (overrides: Record<string, unknown> = {}) => ({
  mid: 900,
  message: "dm hello",
  dateline: NOW - 3600,
  to_uid: ME.uid,
  from_uid: NOVA.uid,
  party_id: PARTY,
  readtime: 0,
  unread: 0,
  party_data: { party: `${ME.uid},${NOVA.uid}` },
  ...overrides,
});

const groupMessage = (overrides: Record<string, unknown> = {}) => ({
  uid: NOVA.uid,
  mid: 1,
  party_id: 48,
  is_group: true,
  message: "group hello",
  dateline: NOW - 60,
  users: { [ME.uid]: ME, [NOVA.uid]: NOVA },
  ...overrides,
});

let LIST_OVERRIDE: GroupInfo[] | null = null;

const LIST: GroupInfo[] = [
  { gid: 48, name: "Quantum" },
  { gid: 52, name: "Pink LSZ", unread: true },
];

describe("ChatDock group chats", () => {
  let socket: FakeConvoSocket;
  let client: ConvoClient;
  let dock: ChatDock;
  let saved: DockState[];
  let sound: { play: jest.Mock };
  let groups: DockGroups & {
    list: jest.Mock;
    mapNames: jest.Mock;
    addToList: jest.Mock;
  };

  const newClient = () => {
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
  };

  const mount = async (
    options: {
      layout?: "bubbles" | "list";
      state?: Partial<DockState>;
      groupSound?: "mentions" | "all";
    } = {}
  ) => {
    groups = {
      list: jest.fn(async () => LIST_OVERRIDE ?? LIST),
      mapNames: jest.fn(async () => ({ 99: "New Crew" })),
      addToList: jest.fn(),
      sound: options.groupSound ?? "mentions",
    };
    dock = new ChatDock({
      client,
      maxBubbles: 5,
      typingIndicators: true,
      layout: options.layout,
      sound,
      groups,
      createGlobal: undefined,
      state: { ...DEFAULT_DOCK_STATE, ...options.state },
      saveState: (state) => saved.push(JSON.parse(JSON.stringify(state))),
      origin: "https://hackforums.net",
    });
    dock.mount();
    client.connect();
    socket.fire("convo_ready", { user: ME, bootId: "b" });
    await flush();
    await flush();
    socket.fire("convo_loaded_more_inbox", {
      messages: { 900: inboxRow() },
      users: { [ME.uid]: ME, [NOVA.uid]: NOVA },
    });
  };

  const groupLoads = () =>
    socket.acked.filter(
      ([event, data]) =>
        event === "convo_loadmessages" && (data as any).is_group
    );

  beforeEach(() => {
    LIST_OVERRIDE = null;
    document.body.innerHTML = "";
    document.cookie = "convoSoundData=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    saved = [];
    sound = { play: jest.fn() };
    newClient();
  });

  afterEach(() => dock?.destroy());

  it("shows the listed groups without asking the server anything about them", async () => {
    await mount();
    expect(groups.list).toHaveBeenCalledTimes(1);
    expect(
      client
        .getGroups()
        .map((g) => g.name)
        .sort()
    ).toEqual(["Pink LSZ", "Quantum"]);
    expect(groupLoads()).toEqual([]);
    // A group marked unread on convo.php starts unread
    expect(client.groups.get(52)!.unread).toBe(1);
  });

  const bubbleOrder = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>(".hfx-chat-heads > .hfx-chat-head")
    ).map((h) =>
      h.classList.contains("hfx-chat-groups-toggle")
        ? "groups"
        : (h.dataset.group ?? `dm${h.dataset.party}`)
    );
  const toggle = () =>
    document.querySelector<HTMLElement>(".hfx-chat-groups-toggle")!;

  it("collapses groups into one Groups bubble by default", async () => {
    await mount();
    expect(bubbleOrder()).toEqual(["groups", `dm${PARTY}`]);
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    // Pink LSZ was unread on convo.php
    expect(toggle().querySelector(".hfx-chat-badge")!.textContent).toBe("1");
  });

  it("expands to a bubble per group above it, and remembers that", async () => {
    await mount();
    toggle().click();
    expect(bubbleOrder()).toEqual(["groups", "52", "48", `dm${PARTY}`]);
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    // The badge moves to the group itself
    expect(toggle().querySelector(".hfx-chat-badge")).toBeNull();
    const quantum = document.querySelector<HTMLElement>(
      '.hfx-chat-head-group[data-group="48"]'
    )!;
    expect(quantum.querySelector(".hfx-chat-dot")).toBeNull();
    expect(quantum.textContent).toBe("Q");
    // In the group's own HF style
    expect(
      quantum.querySelector(".hfx-chat-group-initials > span")!.className
    ).toBe("group48");
    expect(saved[saved.length - 1].groupsExpanded).toBe(true);

    dock.destroy();
    newClient();
    await mount({ state: { groupsExpanded: true } });
    expect(bubbleOrder()).toEqual(["groups", "52", "48", `dm${PARTY}`]);
  });

  it("orders expanded groups by the activity HFX has seen", async () => {
    await mount({ state: { groupsExpanded: true } });
    socket.fire("convo_receivemessage", groupMessage());
    expect(bubbleOrder()).toEqual(["groups", "48", "52", `dm${PARTY}`]);
    const quantum = document.querySelector<HTMLElement>(
      '.hfx-chat-head-group[data-group="48"]'
    )!;
    expect(quantum.title).toBe("Quantum: Nova: group hello");
    expect(quantum.querySelector(".hfx-chat-badge")!.textContent).toBe("1");
  });

  it("marks the collapsed Groups bubble when a group window is open", async () => {
    await mount({
      state: { open: [{ partyId: 48, minimized: true, kind: "group" }] },
    });
    expect(toggle().classList).toContain("hfx-chat-head-open");
    toggle().click();
    expect(toggle().classList).not.toContain("hfx-chat-head-open");
  });

  it("has no Groups bubble when there are no groups", async () => {
    LIST_OVERRIDE = [];
    await mount();
    expect(document.querySelector(".hfx-chat-groups-toggle")).toBeNull();
  });

  it("remembers the list filter across page loads", async () => {
    await mount({ layout: "list", state: { filter: "group" } });
    const pressed = document.querySelector<HTMLElement>(
      '.hfx-chat-filter[aria-pressed="true"]'
    )!;
    expect(pressed.dataset.filter).toBe("group");
    expect(
      document.querySelector(`.hfx-chat-row[data-party="${PARTY}"]`)
    ).toBeNull();
    expect(document.querySelectorAll(".hfx-chat-row-group")).toHaveLength(2);
  });

  it("names a group found through a message from the cached map, and adds it to the list", async () => {
    await mount();
    socket.fire("convo_receivemessage", groupMessage({ party_id: 99 }));
    await flush();
    expect(client.groups.get(99)!.name).toBe("New Crew");
    expect(groups.addToList).toHaveBeenCalledWith({
      gid: 99,
      name: "New Crew",
    });
    expect(groupLoads()).toEqual([]);
  });

  it("lists groups first with their HF-styled name and filters by kind", async () => {
    await mount({ layout: "list" });
    socket.fire("convo_receivemessage", groupMessage());

    const rows = Array.from(
      document.querySelectorAll<HTMLElement>(".hfx-chat-row")
    );
    expect(rows.map((r) => r.dataset.group ?? `dm${r.dataset.party}`)).toEqual([
      "48",
      "52",
      `dm${PARTY}`,
    ]);
    expect(rows[0].querySelector(".hfx-chat-row-name span")!.className).toBe(
      "group48"
    );
    expect(
      rows[0].querySelector(".hfx-chat-group-initials > span")!.className
    ).toBe("group48");
    expect(rows[0].querySelector(".hfx-chat-row-preview")!.textContent).toBe(
      "Nova: group hello"
    );

    const chip = (value: string) =>
      document.querySelector<HTMLElement>(
        `.hfx-chat-filter[data-filter="${value}"]`
      )!;
    chip("dm").click();
    expect(document.querySelector(".hfx-chat-row-group")).toBeNull();
    chip("group").click();
    expect(
      document.querySelector(`.hfx-chat-row[data-party="${PARTY}"]`)
    ).toBeNull();
    expect(saved[saved.length - 1].filter).toBe("group");
  });

  it("opens, saves and restores a group window", async () => {
    await mount({ state: { groupsExpanded: true } });
    document
      .querySelector<HTMLElement>('.hfx-chat-head-group[data-group="48"]')!
      .click();
    await flush();
    const win = document.querySelector<HTMLElement>(
      '.hfx-chat-window[data-party="g48"]'
    )!;
    expect(win.querySelector(".hfx-chat-title a")!.textContent).toBe("Quantum");
    // Opening it is what loads its history
    expect(groupLoads()).toHaveLength(1);
    expect(saved[saved.length - 1].open).toEqual([
      { partyId: 48, minimized: false, kind: "group" },
    ]);
    dock.destroy();

    document.body.innerHTML = "";
    newClient();
    await mount({
      state: { open: [{ partyId: 48, minimized: true, kind: "group" }] },
    });
    const restored = document.querySelector(
      '.hfx-chat-window[data-party="g48"]'
    )!;
    expect(restored.classList).toContain("hfx-chat-minimized");
    expect(restored.querySelector(".hfx-chat-title a")!.textContent).toBe(
      "Quantum"
    );
    expect(groupLoads()).toEqual([]);
  });

  it("keeps group activity across page loads", async () => {
    await mount();
    socket.fire("convo_receivemessage", groupMessage());
    const last = saved[saved.length - 1];
    expect(last.groups?.["48"]).toEqual({ dateline: NOW - 60, unread: 1 });
    dock.destroy();

    newClient();
    await mount({ state: { groups: last.groups } });
    expect(client.groups.get(48)).toMatchObject({
      dateline: NOW - 60,
      unread: 1,
    });
  });

  it("plays the group sound for mentions only by default", async () => {
    await mount();
    socket.fire("convo_receivemessage", groupMessage({ mid: 2 }));
    expect(sound.play).not.toHaveBeenCalled();
    socket.fire(
      "convo_receivemessage",
      groupMessage({ mid: 3, message: "hey @Me@" })
    );
    expect(sound.play).toHaveBeenCalledWith("group:48:3");
  });

  it("plays it for every group message when set to", async () => {
    await mount({ groupSound: "all" });
    socket.fire("convo_receivemessage", groupMessage({ mid: 2 }));
    socket.fire("convo_receivemessage", groupMessage({ mid: 4, uid: ME.uid }));
    expect(sound.play.mock.calls).toEqual([["group:48:2"]]);
  });

  it("still restores windows when the group list can't be read", async () => {
    newClient();
    groups = undefined as any;
    dock = new ChatDock({
      client,
      maxBubbles: 5,
      typingIndicators: true,
      groups: {
        list: async () => {
          throw new Error("convo.php has no Comrades list");
        },
        mapNames: async () => ({}),
        addToList: jest.fn(),
        sound: "mentions",
      },
      state: {
        ...DEFAULT_DOCK_STATE,
        open: [{ partyId: PARTY, minimized: true }],
      },
      saveState: jest.fn(),
    });
    dock.mount();
    client.connect();
    socket.fire("convo_ready", { user: ME, bootId: "b" });
    await flush();
    await flush();
    expect(
      document.querySelector(`.hfx-chat-window[data-party="${PARTY}"]`)
    ).not.toBeNull();
  });

  it("hides groups when group chats are off", async () => {
    dock = new ChatDock({
      client,
      maxBubbles: 5,
      typingIndicators: true,
      state: {
        ...DEFAULT_DOCK_STATE,
        open: [{ partyId: 48, minimized: false, kind: "group" }],
      },
      saveState: jest.fn(),
    });
    dock.mount();
    client.connect();
    socket.fire("convo_ready", { user: ME, bootId: "b" });
    await flush();
    socket.fire("convo_receivemessage", groupMessage());
    socket.fire("convo_loaded_more_inbox", {
      messages: { 900: inboxRow() },
      users: { [ME.uid]: ME, [NOVA.uid]: NOVA },
    });
    expect(document.querySelector(".hfx-chat-head-group")).toBeNull();
    expect(
      document.querySelector('.hfx-chat-window[data-party="g48"]')
    ).toBeNull();
  });
});

describe("groupInitials", () => {
  it("uses up to two words' first letters, skipping a leading The", () => {
    expect(groupInitials("Quantum")).toBe("Q");
    expect(groupInitials("Lions League")).toBe("LL");
    expect(groupInitials("The Brotherhood")).toBe("B");
    expect(groupInitials("pink  lsz crew")).toBe("PL");
    expect(groupInitials("The")).toBe("T");
  });
});
