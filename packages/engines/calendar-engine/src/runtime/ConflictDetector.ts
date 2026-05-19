// ── Conflict Detector ────────────────────────────────────
// Deterministic overlap detection with buffer windows.
// Enforces invariants I5 (no overlapping reservations),
// I6 (blocked slots unavailable), I7 (one reservation per slot),
// I21 (must fall within availability window), I22 (buffer windows).

import type { Reservation, TimeSlot, Calendar, AvailabilityWindow } from '@curdeeclau/shared';
import type { AvailabilityResult, CalendarError } from '../types';
import { TemporalValidator } from './TemporalValidator';

export interface ConflictContext {
  calendar: Calendar;
  reservations: Reservation[];
  timeSlots: TimeSlot[];
}

export class ConflictDetector {
  private temporalValidator = new TemporalValidator();

  /**
   * Full conflict check per OpenSpec §7:
   * 1. Validate newStart < newEnd (I4)
   * 2. Check overlap with existing reservations (I5) + buffer windows (I22)
   * 3. Check overlap with blocked time slots (I6)
   * 4. Check falls within at least one availability window (I21)
   * 5. Return { available: boolean, conflictingSlots? }
   */
  check(
    startAt: number,
    endAt: number,
    ctx: ConflictContext,
  ): AvailabilityResult | CalendarError {
    const rangeErr = this.temporalValidator.validateTimeRange(startAt, endAt);
    if (rangeErr) return rangeErr;

    const conflictingSlots: TimeSlot[] = [];

    // I5 + I22: Check reservation overlap with buffer windows
    const activeStatuses = new Set(['pending', 'confirmed']);
    const activeReservations = ctx.reservations.filter((r) => activeStatuses.has(r.status));

    for (const rsv of activeReservations) {
      const window = this.findAvailabilityWindow(ctx.calendar, rsv.startAt);
      const bufferBefore = window?.bufferBeforeMs ?? 0;
      const bufferAfter = window?.bufferAfterMs ?? 0;
      const effectiveStart = rsv.startAt - bufferBefore;
      const effectiveEnd = rsv.endAt + bufferAfter;

      if (startAt < effectiveEnd && endAt > effectiveStart) {
        const slot = ctx.timeSlots.find((ts) => ts.id === rsv.timeSlotId);
        if (slot) conflictingSlots.push(slot);
        else conflictingSlots.push({
          id: rsv.timeSlotId,
          calendarId: rsv.calendarId,
          startAt: rsv.startAt,
          endAt: rsv.endAt,
          status: 'reserved',
          reservationId: rsv.id,
        });
      }
    }

    // I6: Check blocked time slots
    for (const ts of ctx.timeSlots) {
      if (ts.status !== 'blocked') continue;
      if (startAt < ts.endAt && endAt > ts.startAt) {
        conflictingSlots.push(ts);
      }
    }

    // I21: Must fall within at least one availability window
    const inWindow = this.isWithinAnyAvailabilityWindow(startAt, endAt, ctx.calendar.availabilityWindows);
    if (!inWindow) {
      return {
        error: 'TIME_SLOT_UNAVAILABLE',
        message: `Time range [${startAt}, ${endAt}] falls outside all availability windows`,
      };
    }

    return {
      available: conflictingSlots.length === 0,
      conflictingSlots: conflictingSlots.length > 0 ? conflictingSlots : undefined,
    };
  }

  /**
   * Finds the availability window that contains the given timestamp.
   */
  private findAvailabilityWindow(
    calendar: Calendar,
    timestamp: number,
  ): AvailabilityWindow | undefined {
    const d = new Date(timestamp);
    const dayOfWeek = d.getDay();
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return calendar.availabilityWindows.find(
      (w) => w.daysOfWeek.includes(dayOfWeek) && timeStr >= w.startTime && timeStr <= w.endTime,
    );
  }

  /**
   * I21: Checks if the full [startAt, endAt] range falls within at least one availability window.
   */
  isWithinAnyAvailabilityWindow(
    startAt: number,
    endAt: number,
    windows: AvailabilityWindow[],
  ): boolean {
    if (windows.length === 0) return false;
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const startDay = startDate.getDay();
    const endDay = endDate.getDay();
    const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    return windows.some((w) => {
      if (!w.daysOfWeek.includes(startDay)) return false;
      if (!w.daysOfWeek.includes(endDay)) return false;
      if (startTime < w.startTime) return false;
      if (endTime > w.endTime) return false;
      if (w.validFrom && startAt < w.validFrom) return false;
      if (w.validUntil && endAt > w.validUntil) return false;
      return true;
    });
  }

  /**
   * I7: Checks that a time slot does not already have an active reservation.
   */
  hasActiveReservation(
    timeSlotId: string,
    reservations: Reservation[],
  ): boolean {
    return reservations.some(
      (r) => r.timeSlotId === timeSlotId && !['cancelled', 'completed', 'no_show'].includes(r.status),
    );
  }
}
