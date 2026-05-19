// ── Reminder Scheduler ───────────────────────────────────
// Manages reminder lifecycle per OpenSpec §10.
// I17: reminder MUST reference existing reservation
// I18-I20: timing validation delegated to TemporalValidator
// I16 cascade: cancelling reservation cancels ALL its reminders

import type { Reminder, ReminderStatus, Reservation } from '@curdeeclau/shared';
import type { CalendarError } from '../types';
import { TemporalValidator } from './TemporalValidator';

export class ReminderScheduler {
  private temporalValidator = new TemporalValidator();

  /**
   * I17: Validates that the referenced reservation exists.
   */
  validateReservationExists(reservation: Reservation | undefined, reservationId: string): CalendarError | null {
    if (!reservation) {
      return {
        error: 'RESERVATION_NOT_FOUND',
        message: `Reservation ${reservationId} does not exist — reminder requires valid reservation`,
      };
    }
    return null;
  }

  /**
   * Validates reminder timing constraints (I18-I20).
   */
  validateTiming(
    type: string,
    scheduledAt: number,
    reservation: Reservation,
    now: number = Date.now(),
  ): CalendarError | null {
    const pastErr = this.temporalValidator.validateReminderNotInPast(scheduledAt, now);
    if (pastErr) return pastErr;

    return this.temporalValidator.validateReminderTiming(
      type, scheduledAt, reservation.startAt, reservation.endAt,
    );
  }

  /**
   * I16 cascade: Returns reminders that should be cancelled when a reservation is cancelled.
   * Excludes reminders that are already in a terminal state.
   */
  getCancellableReminders(reminders: Reminder[]): Reminder[] {
    return reminders.filter((r) => !this.isTerminal(r.status));
  }

  isTerminal(status: ReminderStatus): boolean {
    return status === 'triggered' || status === 'cancelled' || status === 'failed';
  }

  /** Checks if a reminder is due (scheduledAt <= now and status is 'scheduled'). */
  isDue(reminder: Reminder, now: number = Date.now()): boolean {
    return reminder.status === 'scheduled' && reminder.scheduledAt <= now;
  }
}
