// ── Canonical Reservation ───────────────────────────────
//
// A reservation is a confirmed booking linking a contact to a time slot.
// Status: pending → confirmed → completed | no_show | cancelled (terminal)

import type { ReservationId, CalendarId, TimeSlotId, ContactId, TenantId } from '../ids/EntityId';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Reservation {
  id: ReservationId;
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  calendarId: CalendarId;
  timeSlotId: TimeSlotId;
  contactId?: ContactId;
  title: string;
  description?: string;
  status: ReservationStatus;
  startAt: number;
  endAt: number;
  createdAt: number;
  updatedAt: number;
  cancelledAt?: number;
  cancellationReason?: string;
  metadata: Record<string, unknown>;
}

export function createReservation(overrides: Partial<Reservation> = {}): Reservation {
  const now = Date.now();
  return {
    id: overrides.id ?? ('rsv_unknown' as ReservationId),
    providerIds: overrides.providerIds ?? {},
    calendarId: overrides.calendarId ?? ('cal_unknown' as CalendarId),
    timeSlotId: overrides.timeSlotId ?? ('tsl_unknown' as TimeSlotId),
    title: overrides.title ?? '',
    status: overrides.status ?? 'pending',
    startAt: overrides.startAt ?? 0,
    endAt: overrides.endAt ?? 0,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata ?? {},
    tenantId: overrides.tenantId,
    contactId: overrides.contactId,
    description: overrides.description,
    cancelledAt: overrides.cancelledAt,
    cancellationReason: overrides.cancellationReason,
  };
}
