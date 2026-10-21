import { FakeConvoSocket } from "../../../test-utils/FakeConvoSocket";
import {
  ChatDock,
  DEFAULT_DOCK_STATE,
  DockGroups,
  DockState,
} from "./ChatDock";
import { ConvoClient } from "./ConvoClient";
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

describe("ChatDock group chats", () => {
  let socket: FakeConvoSocket;
  let client: ConvoClient;
  let dock: ChatDock;
  let saved: DockState[];
  let sound: { play: jest.Mock };
  let groups: DockGroups & { saveMembers: jest.Mock };

  const mount = async (
    options: {
      layout?: "bubbles" | "list";
      state?: Partial<DockState>;
      members?: number[] | null;
      groupSound?: "mentions" | "all";
    } = {}
  ) => {
    groups = {
      names: async () => ({
        48: "Brotherhood",
        52: "Guardians",
        46: "Not mine",
      }),
      members: options.members === undefined ? null : options.members,
      saveMembers: jest.fn(),
      sound: options.groupSound ?? "mentions",
    };
    dock = new ChatDock({
      client,
      maxBubbles: 5,
      typingIndicators: true,
      timestamps: false,
      layout: options.layout,
      sound,
      groups,
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

  beforeEach(() => {
    document.body.innerHTML = "";
    document.cookie = "convoSoundData=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    saved = [];
    sound = { play: jest.fn() };
    socket = new FakeConvoSocket();
    socket.ackReplies.convo_loadmessages = (data) =>
      data.is_group && ![48, 52].includes(data.party)
        ? { ok: false, error: "No permission for this group chat." }
        : { ok: true, hasMore: false, lastMid: 0 };
    client = new ConvoClient({
      postKey: "abc",
      origin: "https://hackforums.net",
      randomUUID: () => "req-1",
      createSocket: () => socket as unknown as SocketIOClient,
    });
  });

  afterEach(() => dock?.destroy());

  it("checks membership once a day and names groups from the shared map", async () => {
    await mount();
    expect(groups.saveMembers).toHaveBeenCalledWith([48, 52]);
    expect(
      client
        .getGroups()
        .map((g) => g.name)
        .sort()
    ).toEqual(["Brotherhood", "Guardians"]);
  });

  it("uses cached membership without asking the server", async () => {
    await mount({ members: [48] });
    expect(groups.saveMembers).not.toHaveBeenCalled();
    expect(
      socket.acked.some(
        ([event, data]) =>
          event === "convo_loadmessages" && (data as any).mid === 99999999
      )
    ).toBe(false);
    expect(client.getGroups().map((g) => g.gid)).toEqual([48]);
  });

  it("mixes groups into the bubbles by recency, as rounded squares", async () => {
    await mount({ members: [48, 52] });
    socket.fire("convo_receivemessage", groupMessage());

    const heads = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".hfx-chat-head:not(.hfx-chat-launcher)"
      )
    );
    // The group's message is newer than the DM's
    expect(heads[0].classList).toContain("hfx-chat-head-group");
    expect(heads[0].dataset.group).toBe("48");
    expect(heads[0].title).toBe("Brotherhood: Nova: group hello");
    expect(heads[0].querySelector(".hfx-chat-badge")!.textContent).toBe("1");
    expect(heads[0].querySelector(".hfx-chat-dot")).toBeNull();
    expect(heads[1].dataset.party).toBe(String(PARTY));
  });

  it("lists groups with their HF-styled name and filters by kind", async () => {
    await mount({ members: [48], layout: "list" });
    socket.fire("convo_receivemessage", groupMessage());

    const row = document.querySelector<HTMLElement>(".hfx-chat-row-group")!;
    expect(row.querySelector(".hfx-chat-row-name span")!.className).toBe(
      "group48"
    );
    expect(row.querySelector(".hfx-chat-row-preview")!.textContent).toBe(
      "Nova: group hello"
    );

    const chip = (value: string) =>
      document.querySelector<HTMLElement>(
        `.hfx-chat-filter[data-filter="${value}"]`
      )!;
    chip("dm").click();
    expect(document.querySelector(".hfx-chat-row-group")).toBeNull();
    expect(
      document.querySelector(`.hfx-chat-row[data-party="${PARTY}"]`)
    ).not.toBeNull();
    chip("group").click();
    expect(
      document.querySelector(`.hfx-chat-row[data-party="${PARTY}"]`)
    ).toBeNull();
    expect(saved[saved.length - 1].filter).toBe("group");
  });

  it("opens, saves and restores a group window", async () => {
    await mount({ members: [48] });
    document
      .querySelector<HTMLElement>('.hfx-chat-head-group[data-group="48"]')!
      .click();
    await flush();
    const win = document.querySelector<HTMLElement>(
      '.hfx-chat-window[data-party="g48"]'
    )!;
    expect(win.querySelector(".hfx-chat-title a")!.textContent).toBe(
      "Brotherhood"
    );
    expect(saved[saved.length - 1].open).toEqual([
      { partyId: 48, minimized: false, kind: "group" },
    ]);
    dock.destroy();

    document.body.innerHTML = "";
    socket = new FakeConvoSocket();
    client = new ConvoClient({
      postKey: "abc",
      createSocket: () => socket as unknown as SocketIOClient,
    });
    await mount({
      members: [48],
      state: { open: [{ partyId: 48, minimized: true, kind: "group" }] },
    });
    expect(
      document.querySelector('.hfx-chat-window[data-party="g48"]')!.classList
    ).toContain("hfx-chat-minimized");
  });

  it("keeps group activity across page loads", async () => {
    await mount({ members: [48] });
    socket.fire("convo_receivemessage", groupMessage());
    const last = saved[saved.length - 1];
    expect(last.groups?.["48"]).toEqual({ dateline: NOW - 60, unread: 1 });
    dock.destroy();

    socket = new FakeConvoSocket();
    client = new ConvoClient({
      postKey: "abc",
      createSocket: () => socket as unknown as SocketIOClient,
    });
    await mount({ members: [48], state: { groups: last.groups } });
    expect(client.groups.get(48)).toMatchObject({
      dateline: NOW - 60,
      unread: 1,
    });
  });

  it("plays the group sound for mentions only by default", async () => {
    await mount({ members: [48] });
    socket.fire("convo_receivemessage", groupMessage({ mid: 2 }));
    expect(sound.play).not.toHaveBeenCalled();
    socket.fire(
      "convo_receivemessage",
      groupMessage({ mid: 3, message: "hey @Me@" })
    );
    expect(sound.play).toHaveBeenCalledWith("group:48:3");
  });

  it("plays it for every group message when set to", async () => {
    await mount({ members: [48], groupSound: "all" });
    socket.fire("convo_receivemessage", groupMessage({ mid: 2 }));
    socket.fire("convo_receivemessage", groupMessage({ mid: 4, uid: ME.uid }));
    expect(sound.play.mock.calls).toEqual([["group:48:2"]]);
  });

  it("hides groups when group chats are off", async () => {
    dock = new ChatDock({
      client,
      maxBubbles: 5,
      typingIndicators: true,
      timestamps: false,
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
