// ── Canonical TimeSlot ──────────────────────────────────
//
// A time slot is a specific block of time on a calendar.
// Status: available → blocked or reserved → (released) available.

import type { TimeSlotId, CalendarId, ReservationId } from '../ids/EntityId';

export type TimeSlotStatus = 'available' | 'blocked' | 'reserved';

export interface TimeSlot {
  id: TimeSlotId;
  calendarId: CalendarId;
  startAt: number;
  endAt: number;
  status: TimeSlotStatus;
  reservationId?: ReservationId;
  blockedReason?: string;
  metadata?: Record<string, unknown>;
}

export function createTimeSlot(overrides: Partial<TimeSlot> = {}): TimeSlot {
  return {
    id: overrides.id ?? ('tsl_unknown' as TimeSlotId),
    calendarId: overrides.calendarId ?? ('cal_unknown' as CalendarId),
    startAt: overrides.startAt ?? 0,
    endAt: overrides.endAt ?? 0,
    status: overrides.status ?? 'available',
    reservationId: overrides.reservationId,
    blockedReason: overrides.blockedReason,
    metadata: overrides.metadata,
  };
}
