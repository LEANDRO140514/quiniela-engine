// ── Calendar Manager ─────────────────────────────────────
// Handles calendar entity CRUD against in-memory storage.
// Uses shared factory createCalendar for canonical shapes.

import type { Calendar, CalendarId } from '@curdeeclau/shared';
import { createCalendar } from '@curdeeclau/shared';
import type { CalendarError, CreateCalendarInput } from '../types';
import { TemporalValidator } from '../runtime/TemporalValidator';

export class CalendarManager {
  private temporalValidator = new TemporalValidator();

  constructor(private calendars: Map<string, Calendar>) {}

  get(id: string): Calendar | undefined {
    return this.calendars.get(id);
  }

  create(input: CreateCalendarInput): Calendar | CalendarError {
    const tzErr = this.temporalValidator.validateTimezone(input.timezone);
    if (tzErr) return tzErr;

    // I23: Validate availability window times
    if (input.availabilityWindows) {
      for (const w of input.availabilityWindows) {
        const winErr = this.temporalValidator.validateAvailabilityWindowTimes(w.startTime, w.endTime);
        if (winErr) return winErr;
      }
    }

    const id: CalendarId = `cal_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` as CalendarId;
    const now = Date.now();
    const cal = createCalendar({
      id,
      name: input.name,
      timezone: input.timezone,
      availabilityWindows: (input.availabilityWindows ?? []).map((w, i) => ({
        ...w,
        id: `avw_${Date.now().toString(36)}${i.toString(36)}`,
        calendarId: id,
      })),
      active: true,
      createdAt: now,
      updatedAt: now,
      tenantId: input.tenantId,
      metadata: input.metadata ?? {},
      providerIds: {},
    });
    this.calendars.set(id, cal);
    return cal;
  }
}
