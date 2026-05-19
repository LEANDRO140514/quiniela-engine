// ── Reservation Lifecycle ────────────────────────────────
// Enforces reservation lifecycle invariants per OpenSpec §8.
// I9-I11: cancelled, completed, no_show are TERMINAL
// I12: reschedule = atomic cancel previous + create new
// I15: cancelling releases associated time slot
// I16: cancelling cascades to all reminders

import type { Reservation, ReservationStatus } from '@curdeeclau/shared';
import type { CalendarError } from '../types';

const TERMINAL_STATUSES: ReservationStatus[] = ['cancelled', 'completed', 'no_show'];

export class ReservationLifecycle {
  /**
   * I9-I11: Returns error if reservation is in a terminal state.
   */
  assertNotTerminal(reservation: Reservation): CalendarError | null {
    if (this.isTerminal(reservation.status)) {
      return {
        error: this.errorCodeForTerminal(reservation.status),
        message: `Reservation ${reservation.id} is in terminal status '${reservation.status}' — no further mutations allowed`,
      };
    }
    return null;
  }

  isTerminal(status: ReservationStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
  }

  /** Valid transitions per OpenSpec §8 lifecycle. */
  canTransitionTo(current: ReservationStatus, next: ReservationStatus): boolean {
    if (this.isTerminal(current)) return false;
    switch (current) {
      case 'pending': return next === 'confirmed' || next === 'cancelled';
      case 'confirmed': return next === 'completed' || next === 'no_show' || next === 'cancelled';
      default: return false;
    }
  }

  /** I12: Reschedule creates metadata linking old and new reservations. */
  buildRescheduleMetadata(previousReservationId: string): Record<string, unknown> {
    return {
      rescheduledFrom: previousReservationId,
      rescheduledAt: Date.now(),
    };
  }

  /** I16: Returns all reminder IDs that should be cancelled with this reservation. */
  getCascadingReminders(reservationId: string, _reminderIds: string[]): string[] {
    // All reminders tied to this reservation must be cancelled
    return _reminderIds;
  }

  private errorCodeForTerminal(status: ReservationStatus): 'ALREADY_CANCELLED' | 'RESERVATION_TERMINAL' {
    if (status === 'cancelled') return 'ALREADY_CANCELLED';
    return 'RESERVATION_TERMINAL';
  }
}
