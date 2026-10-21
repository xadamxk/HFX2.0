import {
  GlobalRoomClient,
  isCommand,
  parseRoomMessage,
  rankOf,
} from "./GlobalRoomClient";
import type { SocketIOClient } from "./SocketIOClient";

const ME = { uid: 10, username: "Me", avatar: "", usergroup: 2, group: 2 };
const NOVA = {
  uid: 20,
  username: "Nova",
  avatar: "",
  usergroup: 28,
  group: 46,
};

/** Stand-in for SocketIOClient: records emits, lets tests fire server events. */
class FakeSocket {
  connected = false;
  handlers = new Map<string, ((...args: any[]) => void)[]>();
  emitted: [string, unknown][] = [];
  acked: [string, unknown][] = [];
  ackReplies: Record<string, (data: any) => any> = {
    convo_join: () => ({ ok: true, ready: true }),
    convo_newmessage: () => ({ ok: true, accepted: true }),
  };
  on(event: string, handler: (...args: any[]) => void) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }
  connect = jest.fn(() => {
    this.connected = true;
  });
  disconnect = jest.fn(() => {
    this.connected = false;
  });
  emit(event: string, data?: unknown) {
    this.emitted.push([event, data]);
    return true;
  }
  emitWithAck(event: string, data: unknown) {
    this.acked.push([event, data]);
    const reply = this.ackReplies[event];
    return reply
      ? Promise.resolve().then(() => reply(data))
      : new Promise(() => {});
  }
  fire(event: string, ...args: unknown[]) {
    (this.handlers.get(event) ?? []).forEach((handler) => handler(...args));
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const roomMessage = (overrides: Record<string, unknown> = {}) => ({
  uid: NOVA.uid,
  mid: 100,
  party_id: -1,
  message: "hello room",
  dateline: 1000,
  bootId: "boot-1",
  users: { [NOVA.uid]: NOVA },
  ...overrides,
});

describe("parseRoomMessage", () => {
  it("keys messages by boot and mid", () => {
    expect(parseRoomMessage(roomMessage())).toMatchObject({
      key: "boot-1:100",
      mid: 100,
      uid: NOVA.uid,
      text: "hello room",
    });
  });

  it("only accepts global room messages", () => {
    expect(parseRoomMessage(roomMessage({ party_id: 5 }))).toBeNull();
    expect(parseRoomMessage(roomMessage({ is_group: true }))).toBeNull();
    expect(parseRoomMessage(roomMessage({ mid: 0 }))).toBeNull();
  });
});

describe("rankOf", () => {
  it("follows HF's online-list ranks", () => {
    expect(rankOf({ usergroup: 4 })).toBe(1);
    expect(rankOf({ usergroup: 3, level: 2 })).toBe(2);
    expect(rankOf({ usergroup: 2, level: 1 })).toBe(3);
    expect(rankOf({ usergroup: 28 })).toBe(4);
    expect(rankOf({ usergroup: 9 })).toBe(5);
    expect(rankOf({ usergroup: 2 })).toBe(6);
    expect(rankOf({ usergroup: 99 })).toBe(6);
  });
});

describe("isCommand", () => {
  it("spots HF Convo commands", () => {
    expect(isCommand("/flip 100")).toBe(true);
    expect(isCommand("  /rain")).toBe(true);
    expect(isCommand("hi /flip")).toBe(false);
  });
});

describe("GlobalRoomClient", () => {
  let socket: FakeSocket;
  let client: GlobalRoomClient;

  const ready = async (bootId = "boot-1") => {
    client.connect();
    socket.fire("convo_ready", { user: ME, level: 0, bootId });
    await flush();
  };

  beforeEach(() => {
    socket = new FakeSocket();
    let uuid = 0;
    client = new GlobalRoomClient({
      postKey: "abc",
      origin: "https://hackforums.net",
      randomUUID: () => `req-${++uuid}`,
      createSocket: () => socket as unknown as SocketIOClient,
    });
  });

  it("joins the public room on ready", async () => {
    const statuses: string[] = [];
    client.on("status", (status) => statuses.push(status));
    await ready();
    expect(socket.acked[0]).toEqual(["convo_join", { publicRoom: true }]);
    expect(statuses).toEqual(["connecting", "ready"]);
  });

  it("adds messages once, with their senders", async () => {
    await ready();
    const onMessages = jest.fn();
    client.on("messages", onMessages);
    socket.fire("convo_receivemessage_bulk", [
      roomMessage(),
      roomMessage({ mid: 101 }),
    ]);
    socket.fire("convo_receivemessage", roomMessage({ mid: 101 }));
    socket.fire("convo_receivemessage", roomMessage({ party_id: 7, mid: 102 }));

    expect(client.messages.map((m) => m.mid)).toEqual([100, 101]);
    expect(onMessages).toHaveBeenCalledTimes(1);
    expect(client.users.get(NOVA.uid)).toMatchObject({
      username: "Nova",
      group: 46,
    });
  });

  it("starts over when the server restarts", async () => {
    await ready("boot-1");
    socket.fire("convo_receivemessage_bulk", [roomMessage()]);
    const onMessages = jest.fn();
    client.on("messages", onMessages);

    socket.fire("convo_ready", { user: ME, bootId: "boot-2" });
    await flush();
    expect(client.messages).toEqual([]);
    expect(onMessages).toHaveBeenCalledWith([], true);
    // The same mid in the new boot is a new message
    socket.fire("convo_receivemessage", roomMessage({ bootId: "boot-2" }));
    expect(client.messages).toHaveLength(1);
  });

  it("sorts the online list by rank, then name", async () => {
    await ready();
    socket.fire("convo_group_count", {
      count: 3,
      users: {
        1: { uid: 1, username: "zed", usergroup: 2 },
        2: { uid: 2, username: "Amy", usergroup: 2 },
        3: { uid: 3, username: "Boss", usergroup: 4 },
      },
    });
    expect(client.onlineCount).toBe(3);
    expect(client.online.map((u) => `${u.rank}:${u.username}`)).toEqual([
      "1:Boss",
      "6:Amy",
      "6:zed",
    ]);
  });

  it("sends to party -1 and refuses commands", async () => {
    await ready();
    await client.send("  hi all  ", "req-x");
    expect(socket.acked).toContainEqual([
      "convo_newmessage",
      { partyID: -1, message: "hi all", requestId: "req-x" },
    ]);
    await expect(client.send("/flip 1000")).rejects.toThrow(
      "only work on convo.php"
    );
    expect(
      socket.acked.filter(([event]) => event === "convo_newmessage")
    ).toHaveLength(1);
  });

  it("refuses to send while disconnected", async () => {
    await expect(client.send("hi")).rejects.toThrow("disconnected");
  });

  it("reports an unconfirmed send", async () => {
    await ready();
    socket.ackReplies.convo_newmessage = () => {
      throw new Error("Timed out waiting for a reply.");
    };
    await expect(client.send("hi")).rejects.toThrow("Delivery is unconfirmed");
    expect(client.isSending).toBe(false);
  });

  it("tracks who's typing, ignoring ourselves", async () => {
    await ready();
    socket.fire("type_notice_add", { uid: NOVA.uid, username: "Nova" });
    socket.fire("type_notice_add", { uid: ME.uid, username: "Me" });
    expect(Array.from(client.typing.values())).toEqual(["Nova"]);
    // Their message ends it
    socket.fire("convo_receivemessage", roomMessage());
    expect(client.typing.size).toBe(0);
  });

  it("sends typing notices only on changes", async () => {
    await ready();
    client.setTyping(true);
    client.setTyping(true);
    client.setTyping(false);
    expect(socket.emitted).toEqual([
      ["type_notice_start", true],
      ["type_notice_stop", true],
    ]);
  });

  it("leaves the room by disconnecting", async () => {
    await ready();
    socket.fire("type_notice_add", { uid: NOVA.uid, username: "Nova" });
    client.disconnect();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(client.typing.size).toBe(0);
  });
});
