import type { BufferMessage } from '../types';

export class MessageDeduplicator {
  private seen: Set<string> = new Set();
  private timestamps: Map<string, number> = new Map();

  isDuplicate(message: BufferMessage): boolean {
    const key = this.generateKey(message);
    return this.seen.has(key);
  }

  markSeen(message: BufferMessage): void {
    const key = this.generateKey(message);
    this.seen.add(key);
    this.timestamps.set(key, message.timestamp);
  }

  generateKey(message: BufferMessage): string {
    return `${message.messageId}:${message.sourceId}`;
  }

  evictOlderThan(now: number, windowMs: number): void {
    const cutoff = now - windowMs;
    for (const [key, ts] of this.timestamps) {
      if (ts < cutoff) {
        this.seen.delete(key);
        this.timestamps.delete(key);
      }
    }
  }

  get size(): number {
    return this.seen.size;
  }

  clear(): void {
    this.seen.clear();
    this.timestamps.clear();
  }
}
