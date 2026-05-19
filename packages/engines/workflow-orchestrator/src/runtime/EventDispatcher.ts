import type { DomainEvent, RuntimeEventType, RuntimeEventHandler } from '@curdeeclau/shared';
import type { EventDispatcher as EventDispatcherInterface } from '../types';

export class InMemoryEventDispatcher implements EventDispatcherInterface {
  private handlers: Map<RuntimeEventType | '*', RuntimeEventHandler[]> = new Map();

  async dispatch(event: DomainEvent): Promise<void> {
    const type = event.type as RuntimeEventType;

    const specific = this.handlers.get(type) ?? [];
    const wildcard = this.handlers.get('*') ?? [];

    const all = [...specific, ...wildcard];

    for (const handler of all) {
      await handler(event);
    }
  }

  on(eventType: RuntimeEventType | '*', handler: RuntimeEventHandler): void {
    const existing = this.handlers.get(eventType);
    if (existing) {
      existing.push(handler);
    } else {
      this.handlers.set(eventType, [handler]);
    }
  }

  off(eventType: RuntimeEventType | '*', handler: RuntimeEventHandler): void {
    const existing = this.handlers.get(eventType);
    if (!existing) return;
    const idx = existing.indexOf(handler);
    if (idx >= 0) existing.splice(idx, 1);
  }

  listenerCount(eventType: RuntimeEventType): number {
    return this.handlers.get(eventType)?.length ?? 0;
  }
}
