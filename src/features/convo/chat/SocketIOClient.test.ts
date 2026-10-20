import {
  decodeSocketPacket,
  SocketIOClient,
  WebSocketLike,
} from "./SocketIOClient";

class FakeSocket implements WebSocketLike {
  readyState = 1;
  sent: string[] = [];
  closed = false;
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  constructor(readonly url: string) {}

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.closed = true;
    this.readyState = 3;
  }

  /** Deliver a frame from the server. */
  receive(data: string) {
    this.onmessage?.({ data });
  }
}

const OPEN =
  '0{"sid":"abc","upgrades":[],"pingInterval":25000,"pingTimeout":20000,"maxPayload":3100000}';

const flush = () =>
  new Promise((resolve) => jest.requireActual("timers").setImmediate(resolve));

describe("decodeSocketPacket", () => {
  it("decodes events, ack requests and acks", () => {
    expect(decodeSocketPacket('2["a",1]')).toEqual({
      type: "2",
      data: ["a", 1],
    });
    expect(decodeSocketPacket('212["a"]')).toEqual({
      type: "2",
      ackId: 12,
      data: ["a"],
    });
    expect(decodeSocketPacket('31[{"ok":true}]')).toEqual({
      type: "3",
      ackId: 1,
      data: [{ ok: true }],
    });
    expect(decodeSocketPacket('0{"sid":"x"}')).toEqual({
      type: "0",
      data: { sid: "x" },
    });
    expect(decodeSocketPacket("1")).toEqual({ type: "1" });
  });

  it("skips a namespace prefix", () => {
    expect(decodeSocketPacket('2/chat,3["a"]')).toEqual({
      type: "2",
      ackId: 3,
      data: ["a"],
    });
  });

  it("returns null for malformed JSON", () => {
    expect(decodeSocketPacket("2[oops")).toBeNull();
  });
});

describe("SocketIOClient", () => {
  let sockets: FakeSocket[];
  let auth: jest.Mock;
  let client: SocketIOClient;

  const latest = () => sockets[sockets.length - 1];

  /** Run the handshake on the latest socket. */
  const handshake = async () => {
    await flush();
    latest().receive(OPEN);
    latest().receive('40{"sid":"def"}');
  };

  beforeEach(() => {
    jest.useFakeTimers();
    sockets = [];
    let ticket = 0;
    auth = jest.fn(async () => ({ ticket: `t${++ticket}` }));
    client = new SocketIOClient({
      url: "wss://example.test/ws/?EIO=4&transport=websocket",
      auth,
      createSocket: (url) => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
    });
  });

  afterEach(() => {
    client.disconnect();
    jest.useRealTimers();
  });

  it("connects with the auth payload and fires connect", async () => {
    const onConnect = jest.fn();
    client.on("connect", onConnect);
    client.connect();
    await flush();

    expect(latest().url).toBe(
      "wss://example.test/ws/?EIO=4&transport=websocket"
    );
    latest().receive(OPEN);
    expect(latest().sent).toEqual(['40{"ticket":"t1"}']);

    latest().receive('40{"sid":"def"}');
    expect(client.connected).toBe(true);
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("answers pings with pongs", async () => {
    client.connect();
    await handshake();
    latest().receive("2");
    expect(latest().sent).toContain("3");
  });

  it("dispatches events and replies to server acks", async () => {
    const onReady = jest.fn();
    client.on("convo_ready", onReady);
    client.connect();
    await handshake();

    latest().receive('42["convo_ready",{"user":{"uid":1}}]');
    expect(onReady).toHaveBeenCalledWith({ user: { uid: 1 } });

    const onAsk = jest.fn((data, reply) => reply("pong"));
    client.on("ask", onAsk);
    latest().receive('427["ask","ping"]');
    expect(latest().sent).toContain('437["pong"]');
  });

  it("emits events and resolves acks", async () => {
    client.connect();
    await handshake();

    expect(client.emit("load_more_inbox", 0)).toBe(true);
    expect(latest().sent).toContain('42["load_more_inbox",0]');

    const reply = client.emitWithAck("convo_join", { publicRoom: false });
    expect(latest().sent).toContain('420["convo_join",{"publicRoom":false}]');
    latest().receive('430[{"ok":true,"ready":true}]');
    await expect(reply).resolves.toEqual({ ok: true, ready: true });
  });

  it("does not send while disconnected", async () => {
    expect(client.emit("x")).toBe(false);
    await expect(client.emitWithAck("x", 1)).rejects.toThrow("Not connected.");
  });

  it("times out an ack", async () => {
    client.connect();
    await handshake();
    const reply = client.emitWithAck("slow", 1, 1000);
    jest.advanceTimersByTime(1000);
    await expect(reply).rejects.toThrow("Timed out");
  });

  it("rejects pending acks and reconnects with a fresh ticket when the transport closes", async () => {
    const onDisconnect = jest.fn();
    client.on("disconnect", onDisconnect);
    client.connect();
    await handshake();
    const reply = client.emitWithAck("x", 1);

    latest().onclose?.({});
    await expect(reply).rejects.toThrow("Disconnected.");
    expect(onDisconnect).toHaveBeenCalledWith("transport close");
    expect(client.connected).toBe(false);

    jest.advanceTimersByTime(2000);
    await flush();
    expect(sockets).toHaveLength(2);
    latest().receive(OPEN);
    expect(latest().sent).toEqual(['40{"ticket":"t2"}']);
  });

  it("reconnects when the server stops pinging", async () => {
    client.on("disconnect", jest.fn());
    client.connect();
    await handshake();
    jest.advanceTimersByTime(45000);
    expect(sockets[0].closed).toBe(true);
    jest.advanceTimersByTime(2000);
    await flush();
    expect(sockets).toHaveLength(2);
  });

  it("does not reconnect after a server disconnect", async () => {
    const onDisconnect = jest.fn();
    client.on("disconnect", onDisconnect);
    client.connect();
    await handshake();

    latest().receive("41");
    expect(onDisconnect).toHaveBeenCalledWith("io server disconnect");
    jest.advanceTimersByTime(60000);
    await flush();
    expect(sockets).toHaveLength(1);
  });

  it("reports connect errors and retries", async () => {
    const onError = jest.fn();
    client.on("connect_error", onError);
    client.connect();
    await flush();
    latest().receive(OPEN);
    latest().receive('44{"message":"bad ticket"}');

    expect(onError).toHaveBeenCalledWith(new Error("bad ticket"));
    expect(client.connected).toBe(false);
    jest.advanceTimersByTime(2000);
    await flush();
    expect(sockets).toHaveLength(2);
  });

  it("gives up after the attempt limit", async () => {
    const onFailed = jest.fn();
    client.on("reconnect_failed", onFailed);
    client.on("connect_error", jest.fn());
    auth.mockRejectedValue(new Error("no ticket"));
    client.connect();
    for (let i = 0; i < 12; i++) {
      await flush();
      jest.advanceTimersByTime(30000);
    }
    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(sockets).toHaveLength(0);
  });

  it("stops after disconnect()", async () => {
    client.connect();
    await handshake();
    client.disconnect();
    expect(latest().sent).toContain("41");
    expect(latest().closed).toBe(true);
    jest.advanceTimersByTime(60000);
    await flush();
    expect(sockets).toHaveLength(1);
  });
});
