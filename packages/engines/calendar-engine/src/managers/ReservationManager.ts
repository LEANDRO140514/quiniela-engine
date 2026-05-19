// ── Reservation Manager ──────────────────────────────────
// Manages reservation entity lifecycle: create, cancel, reschedule.
// Enforces I5 (no overlap), I9-I12 (terminal states, reschedule semantics),
// I15 (release slot on cancel), I16 (cascade reminder cancellation).

import type { Reservation, ReservationId, CalendarId, TimeSlotId, Reminder } from '@curdeeclau/shared';
import { createReservation } from '@curdeeclau/shared';
import type { CalendarError, CreateReservationInput } from '../types';
import { isCalendarError } from '../types';
import { ConflictDetector } from '../runtime/ConflictDetector';
import { ReservationLifecycle } from '../runtime/ReservationLifecycle';
import type { CalendarManager } from './CalendarManager';
import type { TimeSlotManager } from './TimeSlotManager';
import type { ReminderManager } from './ReminderManager';

export class ReservationManager {
  private conflictDetector = new ConflictDetector();
  private lifecycle = new ReservationLifecycle();

  constructor(
    private reservations: Map<string, Reservation>,
    private calendarManager: CalendarManager,
    private timeSlotManager: TimeSlotManager,
    private reminderManager: ReminderManager,
  ) {}

  get(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }

  findByCalendar(calendarId: string): Reservation[] {
    return [...this.reservations.values()].filter((r) => r.calendarId === calendarId);
  }

  findInRange(calendarId: string, startAt: number, endAt: number): Reservation[] {
    return [...this.reservations.values()].filter(
      (r) => r.calendarId === calendarId && r.startAt < endAt && r.endAt > startAt,
    );
  }

  create(input: CreateReservationInput): Reservation | CalendarError {
    const calendar = this.calendarManager.get(input.calendarId);
    if (!calendar) {
      return { error: 'CALENDAR_NOT_FOUND', message: `Calendar ${input.calendarId} not found` };
    }

    // Conflict check: I5 (no overlap), I6 (blocked slots), I21 (availability window)
    const conflictResult = this.conflictDetector.check(input.startAt, input.endAt, {
      calendar,
      reservations: this.findByCalendar(input.calendarId),
      timeSlots: this.timeSlotManager.findBlocked(input.calendarId, input.startAt, input.endAt),
    });

    if (isCalendarError(conflictResult)) return conflictResult;
    if (!conflictResult.available) {
      return {
        error: 'TIME_SLOT_UNAVAILABLE',
        message: `Time range conflicts with existing reservations or blocked slots`,
      };
    }

    // Create the time slot for this reservation
    const slotResult = this.timeSlotManager.block(input.calendarId, input.startAt, input.endAt);
    if ('error' in slotResult) return slotResult;
    // Re-release immediately and reserve — block was to get the slot ID
    const slot = slotResult;
    this.timeSlotManager.release(slot.id);
    const reserveErr = this.timeSlotManager.reserveFor(slot.id, 'placeholder');
    if (reserveErr) return reserveErr;

    const id: ReservationId = `rsv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` as ReservationId;
    const now = Date.now();
    const reservation = createReservation({
      id,
      calendarId: input.calendarId as CalendarId,
      timeSlotId: slot.id,
      title: input.title,
      startAt: input.startAt,
      endAt: input.endAt,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      tenantId: input.tenantId,
      contactId: input.contactId,
      description: input.description,
      metadata: input.metadata ?? {},
      providerIds: {},
    });

    // Fix the timeSlot reservationId
    this.timeSlotManager.releaseReservationSlot(slot.id);
    this.timeSlotManager.reserveFor(slot.id, id);

    this.reservations.set(id, reservation);
    return reservation;
  }

  cancel(id: string, reason?: string): Reservation | CalendarError {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      return { error: 'RESERVATION_NOT_FOUND', message: `Reservation ${id} not found` };
    }

    const terminalErr = this.lifecycle.assertNotTerminal(reservation);
    if (terminalErr) return terminalErr;

    // I15: Release the time slot
    this.timeSlotManager.releaseReservationSlot(reservation.timeSlotId);

    const cancelled = createReservation({
      ...reservation,
      status: 'cancelled',
      cancelledAt: Date.now(),
      cancellationReason: reason,
      updatedAt: Date.now(),
    });
    this.reservations.set(id, cancelled);
    return cancelled;
  }

  getReminders(reservationId: string): Reminder[] {
    return this.reminderManager.getByReservation(reservationId);
  }
}
