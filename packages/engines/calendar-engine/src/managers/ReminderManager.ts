// ── Reminder Manager ─────────────────────────────────────
// Manages reminder entity lifecycle: create, cancel, trigger.
// Enforces I17 (reminder requires reservation), I18-I20 (timing rules).
// I16 cascade handled by ReservationLifecycle + cancelAllForReservation.

import type { Reminder, ReminderId, ReservationId } from '@curdeeclau/shared';
import { createReminder } from '@curdeeclau/shared';
import type { CalendarError, CreateReminderInput } from '../types';
import { ReminderScheduler } from '../runtime/ReminderScheduler';
import type { ReservationManager } from './ReservationManager';

export class ReminderManager {
  private scheduler = new ReminderScheduler();

  constructor(
    private reminders: Map<string, Reminder>,
    private reservationManager: ReservationManager,
  ) {}

  get(id: string): Reminder | undefined {
    return this.reminders.get(id);
  }

  getByReservation(reservationId: string): Reminder[] {
    return [...this.reminders.values()].filter((r) => r.reservationId === reservationId);
  }

  create(input: CreateReminderInput): Reminder | CalendarError {
    // I17: Reminder must reference existing reservation
    const reservation = this.reservationManager.get(input.reservationId);
    const resErr = this.scheduler.validateReservationExists(reservation, input.reservationId);
    if (resErr) return resErr;

    // I18-I20: Validate timing constraints
    const timingErr = this.scheduler.validateTiming(
      input.type, input.scheduledAt, reservation!, Date.now(),
    );
    if (timingErr) return timingErr;

    const id: ReminderId = `rmd_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` as ReminderId;
    const now = Date.now();
    const reminder = createReminder({
      id,
      reservationId: input.reservationId as ReservationId,
      type: input.type,
      channel: input.channel,
      scheduledAt: input.scheduledAt,
      status: 'scheduled',
      message: input.message,
      createdAt: now,
      metadata: input.metadata ?? {},
    });
    this.reminders.set(id, reminder);
    return reminder;
  }

  cancel(id: string): Reminder | CalendarError {
    const reminder = this.reminders.get(id);
    if (!reminder) {
      return { error: 'REMINDER_NOT_FOUND', message: `Reminder ${id} not found` };
    }
    if (reminder.status === 'cancelled') {
      return { error: 'REMINDER_ALREADY_CANCELLED', message: `Reminder ${id} is already cancelled` };
    }
    if (this.scheduler.isTerminal(reminder.status)) {
      return { error: 'REMINDER_ALREADY_CANCELLED', message: `Reminder ${id} has terminal status '${reminder.status}'` };
    }

    const cancelled = createReminder({
      ...reminder,
      status: 'cancelled',
      metadata: { ...reminder.metadata, cancelledAt: Date.now() },
    });
    this.reminders.set(id, cancelled);
    return cancelled;
  }

  /** I16: Cancel all reminders for a reservation (cascade from reservation cancel). */
  cancelAllForReservation(reservationId: string): Reminder[] {
    const cancellable = this.scheduler.getCancellableReminders(
      this.getByReservation(reservationId),
    );
    const cancelled: Reminder[] = [];
    for (const r of cancellable) {
      const result = this.cancel(r.id);
      if (!('error' in result)) cancelled.push(result);
    }
    return cancelled;
  }
}
