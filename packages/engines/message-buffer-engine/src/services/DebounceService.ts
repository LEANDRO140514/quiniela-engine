type ExpireCallback = (conversationId: string) => void;

export class DebounceService {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private onExpire: ExpireCallback;

  constructor(onExpire: ExpireCallback) {
    this.onExpire = onExpire;
  }

  start(conversationId: string, waitMs: number): void {
    this.cancel(conversationId);
    const timer = setTimeout(() => {
      this.timers.delete(conversationId);
      this.onExpire(conversationId);
    }, waitMs);
    this.timers.set(conversationId, timer);
  }

  reset(conversationId: string, waitMs: number): void {
    this.start(conversationId, waitMs);
  }

  cancel(conversationId: string): void {
    const timer = this.timers.get(conversationId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(conversationId);
    }
  }

  hasTimer(conversationId: string): boolean {
    return this.timers.has(conversationId);
  }

  get activeTimers(): number {
    return this.timers.size;
  }

  destroy(): void {
    for (const [, timer] of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
