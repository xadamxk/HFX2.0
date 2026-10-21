import { ConvoClient, parseMessage, partyUids, presence } from "./ConvoClient";
import type { SocketIOClient } from "./SocketIOClient";

const ME = {
  uid: 10,
  username: "Me",
  avatar: "./uploads/avatars/avatar_10.png",
};
const OTHER = {
  uid: 123,
  username: "Charlie",
  avatar: "./uploads/avatars/avatar_123.png",
};
const PARTY = 500;

/** Stand-in for SocketIOClient: records emits, lets tests fire server events. */
class FakeSocket {
  connected = false;
  handlers = new Map<string, ((...args: any[]) => void)[]>();
  emitted: [string, unknown][] = [];
  acked: [string, unknown][] = [];
  ackReplies: Record<string, (data: any) => any> = {
    convo_join: () => ({ ok: true, ready: true }),
    convo_loadmessages: () => ({ ok: true, hasMore: false, lastMid: 0 }),
    mark_read: () => ({ ok: true }),
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

const inboxRow = (overrides: Record<string, unknown> = {}) => ({
  mid: 900,
  message: "latest",
  dateline: 1000,
  to_uid: ME.uid,
  from_uid: OTHER.uid,
  party_id: PARTY,
  readtime: 0,
  unread: 1,
  party_data: { mpid: PARTY, party: `${ME.uid},${OTHER.uid}` },
  ...overrides,
});

const live = (overrides: Record<string, unknown> = {}) => ({
  uid: OTHER.uid,
  mid: 1001,
  party_id: PARTY,
  message: "new message",
  dateline: 2000,
  users: { [ME.uid]: ME, [OTHER.uid]: OTHER },
  party: { mpid: PARTY, party: `${ME.uid},${OTHER.uid}` },
  ...overrides,
});

describe("parseMessage", () => {
  it("skips the public room", () => {
    expect(parseMessage({ ...live(), party_id: -1 })).toBeNull();
    expect(parseMessage({ party_id: 1 })).toBeNull();
  });

  it("flags group messages", () => {
    expect(parseMessage({ ...live(), is_group: true })?.group).toBe(true);
    expect(parseMessage(live())?.group).toBeUndefined();
  });

  it("parses image messages", () => {
    expect(
      parseMessage(
        live({
          isImageDownload: true,
          imageType: "png",
          imageWidth: 4,
          imageHeight: "5",
          message: "AAAA",
        })
      )?.image
    ).toEqual({ type: "png", data: "AAAA", width: 4, height: 5 });
  });

  it("only treats Helpbot messages as HTML when trusted", () => {
    expect(parseMessage(live({ uid: 1337, trustedHtml: true }))?.html).toBe(
      true
    );
    expect(
      parseMessage(live({ uid: 99, trustedHtml: true }))?.html
    ).toBeUndefined();
  });
});

describe("presence", () => {
  const now = 1_000_000;
  it("is online within 15 minutes, away within an hour, then offline", () => {
    expect(presence(now, now)).toBe("online");
    expect(presence(now - 15 * 60, now)).toBe("online");
    expect(presence(now - 15 * 60 - 1, now)).toBe("away");
    expect(presence(now - 60 * 60, now)).toBe("away");
    expect(presence(now - 60 * 60 - 1, now)).toBe("offline");
  });

  it("is offline when last active is unknown", () => {
    expect(presence(0, now)).toBe("offline");
  });
});

describe("partyUids", () => {
  it("parses party strings", () => {
    expect(partyUids("1,574588")).toEqual([1, 574588]);
    expect(partyUids(undefined)).toEqual([]);
  });
});

describe("ConvoClient", () => {
  let socket: FakeSocket;
  let client: ConvoClient;
  let fetchMock: jest.Mock;
  let statuses: string[];

  const ready = async () => {
    client.connect();
    socket.fire("convo_ready", { user: ME, level: 0, bootId: "b" });
    await flush();
  };

  beforeEach(() => {
    socket = new FakeSocket();
    fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ ticket: "T" }),
    }));
    let uuid = 0;
    let auth: () => Promise<Record<string, unknown>> = async () => ({});
    client = new ConvoClient({
      postKey: "abc",
      origin: "https://hackforums.net",
      fetch: fetchMock as any,
      randomUUID: () => `req-${++uuid}`,
      createSocket: (a) => {
        auth = a;
        return socket as unknown as SocketIOClient;
      },
    });
    (client as any).testAuth = () => auth();
    statuses = [];
    client.on("status", (status) => statuses.push(status));
  });

  it("fetches a ticket with the post key", async () => {
    await expect((client as any).testAuth()).resolves.toEqual({ ticket: "T" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://hackforums.net/convo.php?action=socket_ticket");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.body).toBe("my_post_key=abc");
  });

  it("rejects when the ticket is missing", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "nope" }),
    });
    await expect((client as any).testAuth()).rejects.toThrow("nope");
  });

  it("joins privately and loads the inbox on ready", async () => {
    await ready();
    expect(socket.acked[0]).toEqual(["convo_join", { publicRoom: false }]);
    expect(socket.emitted).toContainEqual(["load_more_inbox", 0]);
    expect(statuses).toEqual(["connecting", "ready"]);
    expect(client.me).toMatchObject(ME);
  });

  it("stops when convo_ready has an unexpected shape", async () => {
    client.connect();
    socket.fire("convo_ready", { user: { id: 1 } });
    await flush();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(statuses).toEqual(["connecting", "ended"]);
  });

  it("builds 1:1 conversations from the inbox, newest first", async () => {
    await ready();
    socket.fire("convo_loaded_more_inbox", {
      messages: {
        900: inboxRow(),
        901: inboxRow({
          mid: 901,
          party_id: 501,
          dateline: 3000,
          from_uid: ME.uid,
          unread: 0,
          party_data: { party: `${ME.uid},7` },
        }),
        902: inboxRow({
          mid: 902,
          party_id: 502,
          party_data: { party: `${ME.uid},7,8` },
        }),
      },
      users: {
        [ME.uid]: ME,
        [OTHER.uid]: OTHER,
        7: { uid: 7, username: "Seven", avatar: "" },
      },
    });

    const conversations = client.getConversations();
    expect(conversations.map((c) => c.partyId)).toEqual([501, PARTY]);
    expect(conversations[1].other).toMatchObject(OTHER);
    expect(conversations[1].unread).toBe(1);
    expect(conversations[0].unread).toBe(0);
    expect(conversations[1].lastMessage?.text).toBe("latest");
  });

  it("counts live messages from the other user as unread, deduped", async () => {
    await ready();
    const onMessages = jest.fn();
    client.on("messages", onMessages);

    socket.fire("convo_receivemessage", live());
    socket.fire("convo_receivemessage", live());
    socket.fire("convo_receivemessage", live({ mid: 1002, uid: ME.uid }));

    const conversation = client.conversations.get(PARTY)!;
    expect(conversation.other).toMatchObject(OTHER);
    expect(conversation.unread).toBe(1);
    expect(client.getMessages(PARTY).map((m) => m.mid)).toEqual([1001, 1002]);
    expect(onMessages).toHaveBeenCalledTimes(2);
    expect(onMessages).toHaveBeenCalledWith(PARTY, true);
  });

  it("doesn't count history as unread and keeps messages in order", async () => {
    await ready();
    socket.fire("convo_receivemessage_bulk", [
      live({ mid: 5, history: true, noSound: true }),
      live({ mid: 6, history: true, noSound: true }),
    ]);
    socket.fire("convo_receivemessage_bulk", [
      live({ mid: 3, history: true, noSound: true }),
    ]);
    expect(client.getMessages(PARTY).map((m) => m.mid)).toEqual([3, 5, 6]);
    expect(client.conversations.get(PARTY)!.unread).toBe(0);
  });

  it("loads history after the last loaded message", async () => {
    await ready();
    socket.fire("convo_receivemessage_bulk", [
      live({ mid: 40, noSound: true }),
    ]);
    await client.loadHistory(PARTY);
    expect(socket.acked).toContainEqual([
      "convo_loadmessages",
      { party: PARTY, mid: 40, position: "new", bulk: true, is_group: false },
    ]);
  });

  it("loads older pages and reports when there are no more", async () => {
    await ready();
    socket.fire("convo_receivemessage_bulk", [
      live({ mid: 40, noSound: true }),
    ]);
    socket.ackReplies.convo_loadmessages = (data) => {
      if (data.position === "old") {
        socket.fire(
          "convo_receivemessage_bulk",
          Array.from({ length: 20 }, (_, i) =>
            live({ mid: 20 + i, noSound: true })
          )
        );
      }
      return { ok: true, hasMore: false };
    };
    await expect(client.loadOlder(PARTY)).resolves.toBe(true);
    expect(socket.acked).toContainEqual([
      "convo_loadmessages",
      { party: PARTY, mid: 40, position: "old", bulk: true, is_group: false },
    ]);
    socket.ackReplies.convo_loadmessages = () => ({ ok: true });
    await expect(client.loadOlder(PARTY)).resolves.toBe(false);
  });

  it("sends with a requestId and allows one pending send", async () => {
    await ready();
    let resolveAck!: (value: unknown) => void;
    socket.ackReplies.convo_newmessage = () =>
      new Promise((r) => (resolveAck = r));

    const first = client.send(PARTY, "  hello  ");
    await expect(client.send(PARTY, "again")).rejects.toThrow("pending send");
    await flush();
    expect(socket.acked).toContainEqual([
      "convo_newmessage",
      { partyID: PARTY, message: "hello", requestId: "req-1" },
    ]);
    resolveAck({ ok: true, accepted: true, messageId: 1 });
    await expect(first).resolves.toEqual({ requestId: "req-1" });
    expect(client.isSending).toBe(false);
  });

  it("uploads images with a requestId, one pending send at a time", async () => {
    await ready();
    const image = new ArrayBuffer(4);
    let ack!: (value: unknown) => void;
    socket.ackReplies.convo_imageupload = () =>
      new Promise((resolve) => (ack = resolve));

    const upload = client.sendImage(PARTY, image);
    await expect(client.send(PARTY, "hi")).rejects.toThrow("pending send");
    await flush();
    expect(socket.acked).toContainEqual([
      "convo_imageupload",
      { partyID: PARTY, imageData: image, requestId: "req-1" },
    ]);
    ack({ ok: true, accepted: true });
    await expect(upload).resolves.toEqual({ requestId: "req-1" });
    expect(client.isSending).toBe(false);
  });

  it("reports an unconfirmed send", async () => {
    await ready();
    socket.ackReplies.convo_newmessage = () => {
      throw new Error("Timed out waiting for a reply.");
    };
    await expect(client.send(PARTY, "hi")).rejects.toThrow(
      "Delivery is unconfirmed"
    );
    expect(client.isSending).toBe(false);
  });

  it("refuses to send while disconnected", async () => {
    await expect(client.send(PARTY, "hi")).rejects.toThrow("disconnected");
  });

  it("marks read and clears unread", async () => {
    await ready();
    socket.fire("convo_receivemessage", live());
    client.markRead(PARTY);
    expect(client.conversations.get(PARTY)!.unread).toBe(0);
    expect(socket.acked).toContainEqual(["mark_read", PARTY]);
  });

  it("clears unread on a read notice from another tab", async () => {
    await ready();
    socket.fire("convo_receivemessage", live());
    socket.fire("convo_read_notice", { partyID: PARTY });
    expect(client.conversations.get(PARTY)!.unread).toBe(0);
  });

  it("only sends typing notices for the last loaded party", async () => {
    await ready();
    client.setTyping(PARTY, true);
    expect(socket.emitted).not.toContainEqual(["type_notice_start", true]);

    await client.loadHistory(PARTY);
    client.setTyping(PARTY, true);
    client.setTyping(PARTY, true);
    client.setTyping(PARTY, false);
    expect(socket.emitted.filter(([e]) => e.startsWith("type_notice"))).toEqual(
      [
        ["type_notice_start", true],
        ["type_notice_stop", true],
      ]
    );
  });

  it("tracks last-active times from inbox, messages and typing", async () => {
    await ready();
    socket.fire("convo_loaded_more_inbox", {
      messages: { 900: inboxRow() },
      users: { [ME.uid]: ME, [OTHER.uid]: { ...OTHER, lastactive: 500 } },
    });
    const other = client.conversations.get(PARTY)!.other;
    expect(other.lastActive).toBe(500);

    // A stale payload never moves it back; the conversation sees updates
    socket.fire(
      "convo_receivemessage",
      live({
        dateline: 400,
        users: { [OTHER.uid]: { ...OTHER, lastactive: 300 } },
      })
    );
    expect(other.lastActive).toBe(500);
    socket.fire("convo_receivemessage", live({ mid: 1002, dateline: 2000 }));
    expect(client.conversations.get(PARTY)!.other.lastActive).toBe(2000);

    const before = Math.floor(Date.now() / 1000);
    socket.fire("type_notice_add", { uid: OTHER.uid, username: "Charlie" });
    expect(other.lastActive).toBeGreaterThanOrEqual(before);
  });

  it("relays typing notices from other users", async () => {
    await ready();
    const onTyping = jest.fn();
    client.on("typing", onTyping);
    socket.fire("type_notice_add", { uid: OTHER.uid, username: "Charlie" });
    socket.fire("type_notice_add", { uid: ME.uid, username: "Me" });
    socket.fire("type_notice_remove", { uid: OTHER.uid });
    expect(onTyping.mock.calls).toEqual([
      [OTHER.uid, true],
      [OTHER.uid, false],
    ]);
  });

  describe("groups", () => {
    const GID = 48;
    const groupMessage = (overrides: Record<string, unknown> = {}) =>
      live({ party_id: GID, is_group: true, mid: 7001, ...overrides });

    it("keeps group and DM messages apart even with the same id", async () => {
      await ready();
      const onGroup = jest.fn();
      const onDm = jest.fn();
      client.on("groupMessages", onGroup);
      client.on("messages", onDm);

      socket.fire(
        "convo_receivemessage",
        groupMessage({ party_id: PARTY, mid: 1 })
      );
      socket.fire("convo_receivemessage", live({ mid: 1 }));

      expect(client.getGroupMessages(PARTY).map((m) => m.mid)).toEqual([1]);
      expect(client.getMessages(PARTY).map((m) => m.mid)).toEqual([1]);
      expect(onGroup).toHaveBeenCalledWith(PARTY, true);
      expect(onDm).toHaveBeenCalledWith(PARTY, true);
    });

    it("tracks groups, members and local unread counts", async () => {
      await ready();
      client.setGroups([{ gid: GID, name: "Brotherhood" }]);
      socket.fire("convo_receivemessage", groupMessage());
      socket.fire(
        "convo_receivemessage",
        groupMessage({ mid: 7002, uid: ME.uid })
      );

      const group = client.groups.get(GID)!;
      expect(group.name).toBe("Brotherhood");
      expect(group.unread).toBe(1);
      expect(group.lastMessage?.mid).toBe(7002);
      expect(Array.from(group.members).sort()).toEqual([ME.uid, OTHER.uid]);

      client.markGroupRead(GID);
      expect(group.unread).toBe(0);
      // No read receipt is sent for groups
      expect(socket.acked.some(([event]) => event === "mark_read")).toBe(false);
    });

    it("adds a group it hadn't heard of when a message arrives", async () => {
      await ready();
      socket.fire("convo_receivemessage", groupMessage({ party_id: 99 }));
      expect(client.groups.get(99)?.name).toBe("Group 99");
    });

    it("doesn't count history as unread", async () => {
      await ready();
      client.setGroups([{ gid: GID, name: "Brotherhood" }]);
      socket.fire("convo_receivemessage_bulk", [
        groupMessage({ noSound: true, history: true }),
      ]);
      expect(client.groups.get(GID)!.unread).toBe(0);
    });

    it("loads group history with is_group", async () => {
      await ready();
      await client.loadGroupHistory(GID);
      expect(socket.acked).toContainEqual([
        "convo_loadmessages",
        { party: GID, mid: 0, position: "new", bulk: true, is_group: true },
      ]);
    });

    it("sends with convo_newmessage_group", async () => {
      await ready();
      socket.ackReplies.convo_newmessage_group = () => ({ ok: true });
      await client.sendGroup(GID, " hi all ");
      expect(socket.acked).toContainEqual([
        "convo_newmessage_group",
        { partyID: GID, message: "hi all", requestId: "req-1" },
      ]);
    });

    it("keeps the typing guard per chat, not per id", async () => {
      await ready();
      await client.loadGroupHistory(PARTY);
      // The DM with the same id wasn't the last load
      client.setTyping(PARTY, true);
      expect(socket.emitted).not.toContainEqual(["type_notice_start", true]);
      client.setGroupTyping(PARTY, true);
      expect(socket.emitted).toContainEqual(["type_notice_start", true]);
    });
  });

  it("reports server disconnects as ended", async () => {
    await ready();
    socket.fire("disconnect", "io server disconnect");
    expect(statuses[statuses.length - 1]).toBe("ended");
    socket.fire("disconnect", "transport close");
    expect(statuses[statuses.length - 1]).toBe("disconnected");
  });

  it("reconnects when the ticket expires", async () => {
    await ready();
    socket.fire("convo_auth_expired");
    expect(socket.disconnect).toHaveBeenCalled();
    expect(socket.connect).toHaveBeenCalledTimes(2);
  });
});
