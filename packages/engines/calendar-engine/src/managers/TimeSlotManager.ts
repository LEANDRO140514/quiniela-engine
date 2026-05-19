// ── TimeSlot Manager ─────────────────────────────────────
// Manages time slot entity lifecycle: block, release, status transitions.
// Enforces I6 (blocked slots unavailable) and I15 (release on cancel).
// TimeSlot lifecycle: available → blocked | reserved (see OpenSpec §9).

import type { TimeSlot, TimeSlotId, CalendarId } from '@curdeeclau/shared';
import { createTimeSlot } from '@curdeeclau/shared';
import type { CalendarError } from '../types';
import { TemporalValidator } from '../runtime/TemporalValidator';

export class TimeSlotManager {
  private temporalValidator = new TemporalValidator();

  constructor(private timeSlots: Map<string, TimeSlot>) {}

  get(id: string): TimeSlot | undefined {
    return this.timeSlots.get(id);
  }

  findBlocked(calendarId: string, startAt: number, endAt: number): TimeSlot[] {
    const results: TimeSlot[] = [];
    for (const ts of this.timeSlots.values()) {
      if (ts.calendarId === calendarId && ts.status === 'blocked' &&
          startAt < ts.endAt && endAt > ts.startAt) {
        results.push(ts);
      }
    }
    return results;
  }

  block(
    calendarId: string,
    startAt: number,
    endAt: number,
    reason?: string,
  ): TimeSlot | CalendarError {
    const rangeErr = this.temporalValidator.validateTimeRange(startAt, endAt);
    if (rangeErr) return rangeErr;

    const id: TimeSlotId = `tsl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` as TimeSlotId;
    const ts = createTimeSlot({
      id,
      calendarId: calendarId as CalendarId,
      startAt,
      endAt,
      status: 'blocked',
      blockedReason: reason,
      metadata: {},
    });
    this.timeSlots.set(id, ts);
    return ts;
  }

  release(id: string): TimeSlot | CalendarError {
    const ts = this.timeSlots.get(id);
    if (!ts) {
      return { error: 'TIME_SLOT_NOT_FOUND', message: `TimeSlot ${id} not found` };
    }
    if (ts.status !== 'blocked') {
      return { error: 'TIME_SLOT_NOT_BLOCKED', message: `TimeSlot ${id} is not blocked (current: ${ts.status})` };
    }
    const released = createTimeSlot({
      ...ts,
      status: 'available',
      blockedReason: undefined,
      metadata: { ...ts.metadata, releasedAt: Date.now() },
    });
    this.timeSlots.set(id, released);
    return released;
  }

  /** Marks a slot as reserved (called by ReservationManager on create). */
  reserveFor(id: string, reservationId: string): CalendarError | null {
    const ts = this.timeSlots.get(id);
    if (!ts) {
      return { error: 'TIME_SLOT_NOT_FOUND', message: `TimeSlot ${id} not found` };
    }
    if (ts.status !== 'available') {
      return { error: 'TIME_SLOT_UNAVAILABLE', message: `TimeSlot ${id} is ${ts.status}, not available` };
    }
    this.timeSlots.set(id, createTimeSlot({ ...ts, status: 'reserved', reservationId }));
    return null;
  }

  /** Releases a reserved slot back to available (called on reservation cancel, I15). */
  releaseReservationSlot(timeSlotId: string): void {
    const ts = this.timeSlots.get(timeSlotId);
    if (ts && ts.status === 'reserved') {
      this.timeSlots.set(timeSlotId, createTimeSlot({
        ...ts, status: 'available', reservationId: undefined,
      }));
    }
  }
}
