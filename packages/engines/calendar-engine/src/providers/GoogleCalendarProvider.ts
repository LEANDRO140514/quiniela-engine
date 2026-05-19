// ── Google Calendar Provider (Phase 2 Placeholder) ───────
// Placeholder implementation for Google Calendar adapter.
// Will implement CalendarProvider in Phase 2 with real OAuth + API calls.
// Maps canonical entities ↔ Google Calendar API resources.

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

export class GoogleCalendarProvider implements CalendarProvider {
  readonly providerName = 'GoogleCalendarProvider';

  constructor(_config: { apiKey?: string; calendarId?: string; clientId?: string; clientSecret?: string } = {}) {
    // Phase 2: Initialize Google OAuth client
  }

  async getCalendar(_id: string): Promise<Calendar | undefined> {
    throw new Error('GoogleCalendarProvider.getCalendar not implemented — Phase 2');
  }

  async createCalendar(_data: CreateCalendarInput): Promise<Calendar> {
    throw new Error('GoogleCalendarProvider.createCalendar not implemented — Phase 2');
  }

  async checkAvailability(_calendarId: string, _startAt: number, _endAt: number): Promise<AvailabilityResult> {
    throw new Error('GoogleCalendarProvider.checkAvailability not implemented — Phase 2');
  }

  async createReservation(_data: CreateReservationInput): Promise<Reservation> {
    throw new Error('GoogleCalendarProvider.createReservation not implemented — Phase 2');
  }

  async cancelReservation(_id: string, _reason?: string): Promise<Reservation> {
    throw new Error('GoogleCalendarProvider.cancelReservation not implemented — Phase 2');
  }

  async getReservation(_id: string): Promise<Reservation | undefined> {
    throw new Error('GoogleCalendarProvider.getReservation not implemented — Phase 2');
  }

  async findReservations(_calendarId: string, _startAt: number, _endAt: number): Promise<Reservation[]> {
    throw new Error('GoogleCalendarProvider.findReservations not implemented — Phase 2');
  }

  async blockTimeSlot(_calendarId: string, _startAt: number, _endAt: number, _reason?: string): Promise<TimeSlot> {
    throw new Error('GoogleCalendarProvider.blockTimeSlot not implemented — Phase 2');
  }

  async releaseTimeSlot(_id: string): Promise<TimeSlot> {
    throw new Error('GoogleCalendarProvider.releaseTimeSlot not implemented — Phase 2');
  }

  async getTimeSlot(_id: string): Promise<TimeSlot | undefined> {
    throw new Error('GoogleCalendarProvider.getTimeSlot not implemented — Phase 2');
  }

  async createReminder(_data: CreateReminderInput): Promise<Reminder> {
    throw new Error('GoogleCalendarProvider.createReminder not implemented — Phase 2');
  }

  async cancelReminder(_id: string): Promise<Reminder> {
    throw new Error('GoogleCalendarProvider.cancelReminder not implemented — Phase 2');
  }

  async getReminders(_reservationId: string): Promise<Reminder[]> {
    throw new Error('GoogleCalendarProvider.getReminders not implemented — Phase 2');
  }
}
