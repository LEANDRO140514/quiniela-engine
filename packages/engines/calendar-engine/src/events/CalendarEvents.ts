// ── Calendar Event Factories ─────────────────────────────
// Creates DomainEvents for all 9 calendar event types.
// Every factory accepts CalendarEngineContext fields so that
// correlationId / causationId / actorId are set on every event (I28-I30).

import type { DomainEvent, Reservation, TimeSlot, Reminder } from '@curdeeclau/shared';
import { createDomainEvent } from '@curdeeclau/shared';
import type { CalendarEngineContext } from '../types';

interface EventContext {
  context?: CalendarEngineContext;
  causationId?: string;
}

function mergeContext(base: Partial<DomainEvent>, ctx: EventContext): Partial<DomainEvent> {
  const c = ctx.context ?? {};
  return {
    ...base,
    tenantId: base.tenantId ?? c.tenantId,
    conversationId: base.conversationId ?? c.conversationId,
    workflowId: base.workflowId ?? c.workflowId,
    correlationId: base.correlationId ?? c.correlationId,
    causationId: base.causationId ?? ctx.causationId,
    actorId: base.actorId ?? c.actorId,
    verticalId: base.verticalId ?? c.verticalId,
  };
}

export function availabilityChecked(
  calendarId: string,
  startAt: number,
  endAt: number,
  available: boolean,
  conflictingSlotIds: string[],
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('AvailabilityChecked', mergeContext({
    payload: { calendarId, startAt, endAt, available, conflictingSlotIds },
  }, opts));
}

export function reservationCreated(
  reservation: Reservation,
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('ReservationCreated', mergeContext({
    payload: { reservation },
    tenantId: reservation.tenantId,
  }, opts));
}

export function reservationCancelled(
  reservationId: string,
  previousStatus: string,
  reason: string | undefined,
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('ReservationCancelled', mergeContext({
    payload: { reservationId, previousStatus, reason },
  }, opts));
}

export function reservationRescheduled(
  reservation: Reservation,
  previous: Reservation,
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('ReservationRescheduled', mergeContext({
    payload: { reservation, previous },
    tenantId: reservation.tenantId,
  }, opts));
}

export function timeSlotBlocked(
  timeSlot: TimeSlot,
  reason: string | undefined,
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('TimeSlotBlocked', mergeContext({
    payload: { timeSlot, reason },
  }, opts));
}

export function timeSlotReleased(
  timeSlotId: string,
  previousStatus: string,
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('TimeSlotReleased', mergeContext({
    payload: { timeSlotId, previousStatus },
  }, opts));
}

export function reminderCreated(
  reminder: Reminder,
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('ReminderCreated', mergeContext({
    payload: { reminder },
  }, opts));
}

export function reminderTriggered(
  reminderId: string,
  reservationId: string,
  triggeredAt: number,
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('ReminderTriggered', mergeContext({
    payload: { reminderId, reservationId, triggeredAt },
  }, opts));
}

export function reminderCancelled(
  reminderId: string,
  reservationId: string,
  reason: string,
  opts: EventContext = {},
): DomainEvent {
  return createDomainEvent('ReminderCancelled', mergeContext({
    payload: { reminderId, reservationId, reason },
  }, opts));
}
