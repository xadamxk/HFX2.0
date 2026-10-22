/**
 * Stand-in for SocketIOClient in Convo tests: records emits and acked emits,
 * answers acks from `ackReplies`, and lets tests fire server events.
 */
export class FakeConvoSocket {
  connected = false;
  connects = 0;
  disconnects = 0;
  emitted: [string, unknown][] = [];
  acked: [string, unknown][] = [];
  ackReplies: Record<string, (data: any) => any> = {
    convo_join: () => ({ ok: true, ready: true }),
    convo_newmessage: () => ({ ok: true, accepted: true }),
  };
  private readonly handlers = new Map<string, ((...args: any[]) => void)[]>();

  on(event: string, handler: (...args: any[]) => void): this {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }

  connect(): void {
    this.connected = true;
    this.connects++;
  }

  disconnect(): void {
    this.connected = false;
    this.disconnects++;
  }

  emit(event: string, data?: unknown): boolean {
    this.emitted.push([event, data]);
    return true;
  }

  emitWithAck(event: string, data: unknown): Promise<any> {
    this.acked.push([event, data]);
    const reply = this.ackReplies[event];
    // Unanswered events stay pending, like a server that never acks
    return reply
      ? Promise.resolve().then(() => reply(data))
      : new Promise(() => undefined);
  }

  fire(event: string, ...args: unknown[]): void {
    (this.handlers.get(event) ?? []).forEach((handler) => handler(...args));
  }
}
