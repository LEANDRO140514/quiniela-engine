// ── In-Memory Calendar Provider ──────────────────────────
// Phase 1 provider: stores all calendar entities in Maps.
// Implements CalendarProvider interface from types.ts.
// Wires together all 5 entity managers.

import type {
  Calendar, Reservation, TimeSlot, Reminder,
} from '@curdeeclau/shared';
import type {
  CalendarProvider,
  AvailabilityResult,
  CreateCalendarInput,
  CreateReservationInput,
  CreateReminderInput,
} from '../types';
import { CalendarManager } from '../managers/CalendarManager';
import { AvailabilityManager } from '../managers/AvailabilityManager';
import { ReservationManager } from '../managers/ReservationManager';
import { ReminderManager } from '../managers/ReminderManager';
import { TimeSlotManager } from '../managers/TimeSlotManager';

export class InMemoryCalendarProvider implements CalendarProvider {
  readonly providerName = 'InMemoryCalendarProvider';

  private calendars = new Map<string, Calendar>();
  private timeSlots = new Map<string, TimeSlot>();
  private reservations = new Map<string, Reservation>();
  private reminders = new Map<string, Reminder>();

  private calendarManager: CalendarManager;
  private timeSlotManager: TimeSlotManager;
  private reservationManager: ReservationManager;
  private reminderManager: ReminderManager;
  private availabilityManager: AvailabilityManager;

  constructor() {
    this.calendarManager = new CalendarManager(this.calendars);
    this.timeSlotManager = new TimeSlotManager(this.timeSlots);
    // Pass dummy references initially — they'll be fixed once all managers are wired
    this.reminderManager = null!;
    this.reservationManager = null!;
    this.reservationManager = new ReservationManager(
      this.reservations, this.calendarManager, this.timeSlotManager, this.reminderManager,
    );
    this.reminderManager = new ReminderManager(this.reminders, this.reservationManager);
    this.availabilityManager = new AvailabilityManager(
      this.calendarManager, this.reservationManager, this.timeSlotManager,
    );
  }

  // ── Calendar ────────────────────────────────────────────

  async getCalendar(id: string): Promise<Calendar | undefined> {
    return this.calendarManager.get(id);
  }

  async createCalendar(data: CreateCalendarInput): Promise<Calendar> {
    const result = this.calendarManager.create(data);
    if ('error' in result) throw new Error(`${result.error}: ${result.message}`);
    return result;
  }

  // ── Availability ─────────────────────────────────────────

  async checkAvailability(calendarId: string, startAt: number, endAt: number): Promise<AvailabilityResult> {
    const result = this.availabilityManager.check(calendarId, startAt, endAt);
    if ('error' in result) throw new Error(`${result.error}: ${result.message}`);
    return result;
  }

  // ── Reservations ─────────────────────────────────────────

  async createReservation(data: CreateReservationInput): Promise<Reservation> {
    const result = this.reservationManager.create(data);
    if ('error' in result) throw new Error(`${result.error}: ${result.message}`);
    return result;
  }

  async cancelReservation(id: string, reason?: string): Promise<Reservation> {
    const result = this.reservationManager.cancel(id, reason);
    if ('error' in result) throw new Error(`${result.error}: ${result.message}`);
    return result;
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    return this.reservationManager.get(id);
  }

  async findReservations(calendarId: string, startAt: number, endAt: number): Promise<Reservation[]> {
    return this.reservationManager.findInRange(calendarId, startAt, endAt);
  }

  // ── Time Slots ───────────────────────────────────────────

  async blockTimeSlot(calendarId: string, startAt: number, endAt: number, reason?: string): Promise<TimeSlot> {
    const result = this.timeSlotManager.block(calendarId, startAt, endAt, reason);
    if ('error' in result) throw new Error(`${result.error}: ${result.message}`);
    return result;
  }

  async releaseTimeSlot(id: string): Promise<TimeSlot> {
    const result = this.timeSlotManager.release(id);
    if ('error' in result) throw new Error(`${result.error}: ${result.message}`);
    return result;
  }

  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    return this.timeSlotManager.get(id);
  }

  // ── Reminders ────────────────────────────────────────────

  async createReminder(data: CreateReminderInput): Promise<Reminder> {
    const result = this.reminderManager.create(data);
    if ('error' in result) throw new Error(`${result.error}: ${result.message}`);
    return result;
  }

  async cancelReminder(id: string): Promise<Reminder> {
    const result = this.reminderManager.cancel(id);
    if ('error' in result) throw new Error(`${result.error}: ${result.message}`);
    return result;
  }

  async getReminders(reservationId: string): Promise<Reminder[]> {
    return this.reminderManager.getByReservation(reservationId);
  }
}
