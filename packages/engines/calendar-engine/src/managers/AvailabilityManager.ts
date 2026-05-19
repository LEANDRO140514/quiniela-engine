// ── Availability Manager ─────────────────────────────────
// Handles availability checking: determines if a time range is free
// on a given calendar. Delegates to ConflictDetector for overlap logic.
// OpenSpec §4.1 — check_availability capability.

import type { Calendar } from '@curdeeclau/shared';
import type { CalendarError, AvailabilityResult } from '../types';
import { ConflictDetector } from '../runtime/ConflictDetector';
import type { CalendarManager } from './CalendarManager';
import type { ReservationManager } from './ReservationManager';
import type { TimeSlotManager } from './TimeSlotManager';

export class AvailabilityManager {
  private conflictDetector = new ConflictDetector();

  constructor(
    private calendarManager: CalendarManager,
    private reservationManager: ReservationManager,
    private timeSlotManager: TimeSlotManager,
  ) {}

  check(calendarId: string, startAt: number, endAt: number): AvailabilityResult | CalendarError {
    const calendar = this.calendarManager.get(calendarId);
    if (!calendar) {
      return { error: 'CALENDAR_NOT_FOUND', message: `Calendar ${calendarId} not found` };
    }

    return this.conflictDetector.check(startAt, endAt, {
      calendar,
      reservations: this.reservationManager.findByCalendar(calendarId),
      timeSlots: this.timeSlotManager.findBlocked(calendarId, startAt, endAt),
    });
  }
}
