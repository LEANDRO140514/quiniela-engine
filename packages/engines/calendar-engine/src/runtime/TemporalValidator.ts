// ── Temporal Validator ───────────────────────────────────
// Validates time ranges, timezones, and temporal constraints.
// Enforces invariants I4 (startAt < endAt), I8 (valid IANA timezone).
// Also validates reminder timing (I18-I20).

import type { CalendarError } from '../types';
import { isValidTimezone } from '../types';

export class TemporalValidator {
  /**
   * I4: startAt MUST be strictly before endAt.
   */
  validateTimeRange(startAt: number, endAt: number): CalendarError | null {
    if (startAt >= endAt) {
      return {
        error: 'INVALID_TIME_RANGE',
        message: `startAt (${startAt}) must be strictly before endAt (${endAt})`,
      };
    }
    return null;
  }

  /**
   * I8: Timezone MUST be a valid IANA timezone identifier.
   */
  validateTimezone(timezone: string): CalendarError | null {
    if (!isValidTimezone(timezone)) {
      return {
        error: 'INVALID_TIMEZONE',
        message: `Timezone '${timezone}' is not a valid IANA timezone`,
      };
    }
    return null;
  }

  /**
   * I18: scheduledAt for 'upcoming' type MUST be before reservation startAt.
   * I19: scheduledAt for 'follow_up' type MUST be after reservation endAt.
   */
  validateReminderTiming(
    type: string,
    scheduledAt: number,
    reservationStartAt: number,
    reservationEndAt: number,
  ): CalendarError | null {
    if (type === 'upcoming' && scheduledAt >= reservationStartAt) {
      return {
        error: 'INVALID_REMINDER_TIME',
        message: `Upcoming reminder scheduledAt (${scheduledAt}) must be before reservation startAt (${reservationStartAt})`,
      };
    }
    if (type === 'follow_up' && scheduledAt <= reservationEndAt) {
      return {
        error: 'INVALID_REMINDER_TIME',
        message: `Follow-up reminder scheduledAt (${scheduledAt}) must be after reservation endAt (${reservationEndAt})`,
      };
    }
    return null;
  }

  /**
   * I20: scheduledAt MUST NOT be in the past at creation time.
   */
  validateReminderNotInPast(scheduledAt: number, now: number = Date.now()): CalendarError | null {
    if (scheduledAt <= now) {
      return {
        error: 'REMINDER_TIME_IN_PAST',
        message: `scheduledAt (${scheduledAt}) must be in the future (now: ${now})`,
      };
    }
    return null;
  }

  /**
   * I23: startTime MUST be before endTime in every AvailabilityWindow.
   */
  validateAvailabilityWindowTimes(startTime: string, endTime: string): CalendarError | null {
    if (startTime >= endTime) {
      return {
        error: 'INVALID_TIME_RANGE',
        message: `AvailabilityWindow startTime '${startTime}' must be before endTime '${endTime}'`,
      };
    }
    return null;
  }
}
