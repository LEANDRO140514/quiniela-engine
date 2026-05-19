import { createDomainEvent } from '@curdeeclau/shared';
import type { DomainEvent, RuntimeEventType } from '@curdeeclau/shared';

export function createEvent(
  type: RuntimeEventType,
  overrides: Partial<Omit<DomainEvent, 'type'>> = {},
): DomainEvent {
  return createDomainEvent(type, overrides);
}

export function isEventType(event: DomainEvent, type: RuntimeEventType): boolean {
  return event.type === type;
}
