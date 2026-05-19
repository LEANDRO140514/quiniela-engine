// ── Calendar Event Emitter ───────────────────────────────
// Centralized event emitter that stores events in memory and
// notifies registered handlers. Supports the I28-I30 invariants:
// every mutation emits a DomainEvent with correlationId and actorId.

import type { DomainEvent } from '@curdeeclau/shared';

export type CalendarEventHandler = (event: DomainEvent) => void | Promise<void>;

export class CalendarEventEmitter {
  private events: DomainEvent[] = [];
  private handlers: CalendarEventHandler[] = [];

  get emittedCount(): number {
    return this.events.length;
  }

  get emittedEvents(): readonly DomainEvent[] {
    return this.events;
  }

  emit(event: DomainEvent): void {
    this.events.push(event);
    for (const handler of this.handlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch(() => { /* fire-and-forget — handler failures are non-fatal */ });
        }
      } catch {
        /* handler errors never break the emit loop */
      }
    }
  }

  on(handler: CalendarEventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const idx = this.handlers.indexOf(handler);
      if (idx !== -1) this.handlers.splice(idx, 1);
    };
  }

  clear(): void {
    this.events = [];
    this.handlers = [];
  }

  /** Returns events matching a type, optionally since a given timestamp. */
  filter(type?: string, since?: number): DomainEvent[] {
    let result = this.events;
    if (type) result = result.filter((e) => e.type === type);
    if (since !== undefined) result = result.filter((e) => e.timestamp >= since);
    return result;
  }

  /** Returns the last emitted event of a given type, or undefined. */
  lastOfType(type: string): DomainEvent | undefined {
    for (let i = this.events.length - 1; i >= 0; i--) {
      if (this.events[i].type === type) return this.events[i];
    }
    return undefined;
  }
}
