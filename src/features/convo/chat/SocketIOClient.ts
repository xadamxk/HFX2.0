import { Logger } from "../../../core/Logger";

/**
 * Minimal Socket.IO v4 client (Engine.IO v4, websocket transport only).
 *
 * Supports what Convo needs: the open handshake, ping/pong, connecting the
 * default namespace with an auth payload, events, acks, sending binary data
 * (image uploads), and reconnecting with backoff. Receiving binary packets and
 * namespaces other than "/" are not supported.
 *
 * Packet format (text frames): Engine.IO type digit, then for messages ("4")
 * the Socket.IO type digit, an optional ack id and a JSON payload, e.g.
 * `42["event",data]`, `421["event",data]` (wants ack 1) and `431[result]`.
 * An event carrying binary data is `45<n>-` + ack id + JSON with each buffer
 * replaced by `{"_placeholder":true,"num":i}`, followed by the n buffers as
 * binary frames.
 */

// Engine.IO packet types
const EIO_OPEN = "0";
const EIO_CLOSE = "1";
const EIO_PING = "2";
const EIO_PONG = "3";
const EIO_MESSAGE = "4";

// Socket.IO packet types
const SIO_CONNECT = "0";
const SIO_DISCONNECT = "1";
const SIO_EVENT = "2";
const SIO_ACK = "3";
const SIO_CONNECT_ERROR = "4";
const SIO_BINARY_EVENT = "5";

type Binary = ArrayBuffer | ArrayBufferView;

const isBinary = (value: unknown): value is Binary =>
  value instanceof ArrayBuffer || ArrayBuffer.isView(value);

/**
 * Replace binary values with Socket.IO placeholders, collecting the buffers
 * in order (socket.io-parser's deconstructPacket).
 */
export function deconstructBinary(
  data: unknown,
  buffers: Binary[] = []
): { data: unknown; buffers: Binary[] } {
  const walk = (value: unknown): unknown => {
    if (isBinary(value)) {
      buffers.push(value);
      return { _placeholder: true, num: buffers.length - 1 };
    }
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, inner]) => [key, walk(inner)])
      );
    }
    return value;
  };
  return { data: walk(data), buffers };
}

export type DisconnectReason =
  | "io server disconnect"
  | "io client disconnect"
  | "ping timeout"
  | "transport close"
  | "transport error";

/** The parts of WebSocket the client uses, so tests can pass a fake. */
export interface WebSocketLike {
  readyState: number;
  send(data: string | ArrayBuffer | ArrayBufferView): void;
  close(): void;
  onopen: ((event: any) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
}

export interface SocketIOClientOptions {
  /** Full websocket URL, e.g. `wss://host/convo-ws/?EIO=4&transport=websocket`. */
  url: string;
  /** Called before every connection attempt, so each one can use a fresh ticket. */
  auth: () => Promise<Record<string, unknown>>;
  createSocket?: (url: string) => WebSocketLike;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  /** Give up after this many failed attempts in a row. */
  reconnectionAttempts?: number;
  /** How long to wait for the Socket.IO connect reply. */
  connectTimeout?: number;
}

type Handler = (...args: any[]) => void;

export interface DecodedPacket {
  type: string;
  ackId?: number;
  data?: any;
}

/** Decode the Socket.IO part of an Engine.IO message (everything after the "4"). */
export function decodeSocketPacket(payload: string): DecodedPacket | null {
  const type = payload.charAt(0);
  let index = 1;
  // Namespaces other than "/" are written as "/nsp," before the ack id
  if (payload.charAt(index) === "/") {
    const comma = payload.indexOf(",", index);
    if (comma === -1) return { type };
    index = comma + 1;
  }
  let digits = "";
  while (index < payload.length && /[0-9]/.test(payload.charAt(index))) {
    digits += payload.charAt(index++);
  }
  const packet: DecodedPacket = { type };
  if (digits) packet.ackId = parseInt(digits, 10);
  if (index < payload.length) {
    try {
      packet.data = JSON.parse(payload.slice(index));
    } catch {
      return null;
    }
  }
  return packet;
}

export class SocketIOClient {
  /** True once the Socket.IO connect has been accepted. */
  connected = false;

  private readonly options: Required<
    Omit<SocketIOClientOptions, "createSocket">
  > & { createSocket: (url: string) => WebSocketLike };
  private socket: WebSocketLike | null = null;
  private readonly handlers = new Map<string, Set<Handler>>();
  private readonly acks = new Map<number, (...args: any[]) => void>();
  private nextAckId = 0;
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingWindow = 0;
  /** True while fetching auth for a new connection. */
  private opening = false;
  /** False after disconnect() or a server disconnect: don't reconnect. */
  private active = false;

  constructor(options: SocketIOClientOptions) {
    this.options = {
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      reconnectionAttempts: 10,
      connectTimeout: 20000,
      createSocket: (url) => new WebSocket(url) as unknown as WebSocketLike,
      ...options,
    };
  }

  on(event: string, handler: Handler): this {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return this;
  }

  off(event: string, handler: Handler): this {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  connect(): void {
    if (this.socket || this.opening) return;
    this.active = true;
    this.clearReconnect();
    this.open();
  }

  /** Close the connection and stop reconnecting. */
  disconnect(): void {
    this.active = false;
    this.clearReconnect();
    if (this.socket) {
      if (this.connected) this.write(EIO_MESSAGE + SIO_DISCONNECT);
      this.teardown("io client disconnect");
    }
  }

  /** Send an event without waiting for a reply. Dropped when not connected. */
  emit(event: string, ...args: unknown[]): boolean {
    if (!this.connected) return false;
    this.writeEvent([event, ...args]);
    return true;
  }

  /**
   * Send an event and resolve with the server's ack. Rejects when not
   * connected, on timeout, or if the connection drops first.
   */
  emitWithAck<T = any>(
    event: string,
    data: unknown,
    timeoutMs = 20000
  ): Promise<T> {
    if (!this.connected) {
      return Promise.reject(new Error("Not connected."));
    }
    const id = this.nextAckId++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.acks.delete(id);
        reject(new Error("Timed out waiting for a reply."));
      }, timeoutMs);
      this.acks.set(id, (result?: T, error?: Error) => {
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(result as T);
      });
      this.writeEvent([event, data], id);
    });
  }

  /** Write an event packet, as a binary event when it carries buffers. */
  private writeEvent(payload: unknown[], ackId?: number): void {
    const id = ackId === undefined ? "" : String(ackId);
    const { data, buffers } = deconstructBinary(payload);
    if (!buffers.length) {
      this.write(EIO_MESSAGE + SIO_EVENT + id + JSON.stringify(payload));
      return;
    }
    this.write(
      EIO_MESSAGE +
        SIO_BINARY_EVENT +
        buffers.length +
        "-" +
        id +
        JSON.stringify(data)
    );
    // Engine.IO v4 sends each attachment as its own binary websocket frame
    buffers.forEach((buffer) => this.write(buffer));
  }

  private async open(): Promise<void> {
    let auth: Record<string, unknown>;
    this.opening = true;
    try {
      auth = await this.options.auth();
    } catch (error) {
      this.opening = false;
      this.fire("connect_error", error);
      this.scheduleReconnect();
      return;
    }
    this.opening = false;
    if (!this.active) return;

    let socket: WebSocketLike;
    try {
      socket = this.options.createSocket(this.options.url);
    } catch (error) {
      this.fire("connect_error", error);
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;
    this.connectTimer = setTimeout(() => {
      this.fire("connect_error", new Error("Connection timed out."));
      this.teardown("transport error");
    }, this.options.connectTimeout);

    socket.onmessage = (event) => {
      if (this.socket !== socket) return;
      this.onPacket(String(event.data), auth);
    };
    socket.onclose = () => {
      if (this.socket === socket) this.teardown("transport close");
    };
    socket.onerror = () => {
      if (this.socket === socket) this.teardown("transport error");
    };
  }

  private onPacket(packet: string, auth: Record<string, unknown>): void {
    const type = packet.charAt(0);
    switch (type) {
      case EIO_OPEN: {
        try {
          const handshake = JSON.parse(packet.slice(1));
          this.pingWindow =
            (Number(handshake.pingInterval) || 25000) +
            (Number(handshake.pingTimeout) || 20000);
        } catch {
          this.pingWindow = 45000;
        }
        this.resetPingTimer();
        this.write(EIO_MESSAGE + SIO_CONNECT + JSON.stringify(auth));
        return;
      }
      case EIO_PING:
        this.resetPingTimer();
        this.write(EIO_PONG);
        return;
      case EIO_CLOSE:
        this.teardown("transport close");
        return;
      case EIO_MESSAGE:
        this.onSocketPacket(packet.slice(1));
        return;
    }
  }

  private onSocketPacket(payload: string): void {
    const packet = decodeSocketPacket(payload);
    if (!packet) return;
    switch (packet.type) {
      case SIO_CONNECT:
        this.clearConnectTimer();
        this.connected = true;
        this.attempts = 0;
        this.fire("connect");
        return;
      case SIO_CONNECT_ERROR:
        this.clearConnectTimer();
        this.fire(
          "connect_error",
          new Error(packet.data?.message || "Connection refused.")
        );
        this.teardown("transport error");
        return;
      case SIO_DISCONNECT:
        // Like socket.io-client, a server disconnect is final
        this.active = false;
        this.teardown("io server disconnect");
        return;
      case SIO_EVENT: {
        if (!Array.isArray(packet.data) || typeof packet.data[0] !== "string") {
          return;
        }
        const [event, ...args] = packet.data;
        if (packet.ackId !== undefined) {
          const ackId = packet.ackId;
          args.push((...reply: unknown[]) =>
            this.write(EIO_MESSAGE + SIO_ACK + ackId + JSON.stringify(reply))
          );
        }
        this.fire(event, ...args);
        return;
      }
      case SIO_ACK: {
        if (packet.ackId === undefined) return;
        const ack = this.acks.get(packet.ackId);
        if (!ack) return;
        this.acks.delete(packet.ackId);
        ack(Array.isArray(packet.data) ? packet.data[0] : packet.data);
        return;
      }
    }
  }

  private write(data: string | Binary): void {
    // 1 = WebSocket.OPEN
    if (this.socket && this.socket.readyState === 1) this.socket.send(data);
  }

  private fire(event: string, ...args: unknown[]): void {
    for (const handler of Array.from(this.handlers.get(event) ?? [])) {
      try {
        handler(...args);
      } catch (error) {
        Logger.error(`Convo socket handler for ${event} failed`, error);
      }
    }
  }

  private resetPingTimer(): void {
    if (this.pingTimer) clearTimeout(this.pingTimer);
    this.pingTimer = setTimeout(
      () => this.teardown("ping timeout"),
      this.pingWindow
    );
  }

  private clearConnectTimer(): void {
    if (this.connectTimer) clearTimeout(this.connectTimer);
    this.connectTimer = null;
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private teardown(reason: DisconnectReason): void {
    const socket = this.socket;
    const wasConnected = this.connected;
    this.socket = null;
    this.connected = false;
    this.clearConnectTimer();
    if (this.pingTimer) clearTimeout(this.pingTimer);
    this.pingTimer = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      try {
        socket.close();
      } catch {
        // Already closed
      }
    }
    // Fail pending acks so callers aren't left waiting
    const pending = Array.from(this.acks.values());
    this.acks.clear();
    pending.forEach((ack) => ack(undefined, new Error("Disconnected.")));

    if (wasConnected) this.fire("disconnect", reason);
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.active || this.reconnectTimer || this.socket || this.opening) {
      return;
    }
    if (this.attempts >= this.options.reconnectionAttempts) {
      this.active = false;
      this.fire("reconnect_failed");
      return;
    }
    const base = Math.min(
      this.options.reconnectionDelayMax,
      this.options.reconnectionDelay * 2 ** this.attempts
    );
    // ±50% jitter, as socket.io-client's randomizationFactor 0.5
    const delay = Math.round(base * (0.5 + Math.random()));
    this.attempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.active) this.open();
    }, delay);
  }
}
