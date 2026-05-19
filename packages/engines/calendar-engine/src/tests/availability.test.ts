import { describe, it, expect, beforeEach } from 'vitest';
import { AvailabilityManager } from '../managers/AvailabilityManager';
import { TemporalValidator } from '../runtime/TemporalValidator';
import { ConflictDetector } from '../runtime/ConflictDetector';
import { CalendarManager } from '../managers/CalendarManager';
import { ReservationManager } from '../managers/ReservationManager';
import { TimeSlotManager } from '../managers/TimeSlotManager';
import { ReminderManager } from '../managers/ReminderManager';
import type { Calendar } from '@curdeeclau/shared';
import { isValidTimezone } from '../types';

/** Next weekday (Mon=1..Fri=5) at given hour, in ms. */
function nextWeekdayHour(hour: number, dayOffset: number = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function createCalendar(daysOfWeek: number[] = [0, 1, 2, 3, 4, 5, 6]): Calendar {
  const cals = new Map<string, Calendar>();
  const cm = new CalendarManager(cals);
  const result = cm.create({
    name: 'Test Calendar',
    timezone: 'America/Mexico_City',
    availabilityWindows: [{
      daysOfWeek,
      startTime: '00:00',
      endTime: '23:59',
      slotDurationMs: 60 * 60 * 1000,
    }],
  });
  return result as Calendar;
}

function setupAllDays() {
  const cals = new Map<string, Calendar>();
  const tss = new Map();
  const rsvs = new Map();
  const rmds = new Map();

  const cm = new CalendarManager(cals);
  const tsm = new TimeSlotManager(tss as any);
  const rmm = {} as ReminderManager;
  const rsm = new ReservationManager(rsvs as any, cm, tsm, rmm);
  const rmmReal = new ReminderManager(rmds as any, rsm);
  const am = new AvailabilityManager(cm, rsm, tsm);

  const cal = createCalendar();
  cals.set(cal.id, cal);

  return { cm, tsm, rsm, rmm: rmmReal, am, cal };
}

describe('AvailabilityManager — check_availability', () => {
  let am: AvailabilityManager;
  let cal: Calendar;

  beforeEach(() => {
    const s = setupAllDays();
    am = s.am;
    cal = s.cal;
  });

  it('should return available for free slot within working hours', () => {
    const start = nextWeekdayHour(10, 1);
    const end = start + 3600000;
    const result = am.check(cal.id, start, end);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.available).toBe(true);
    }
  });

  it('should reject calendar not found', () => {
    const result = am.check('cal_nonexistent', Date.now(), Date.now() + 3600000);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toBe('CALENDAR_NOT_FOUND');
    }
  });

  it('should reject startAt >= endAt (I4)', () => {
    const result = am.check(cal.id, Date.now() + 7200000, Date.now() + 3600000);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toBe('INVALID_TIME_RANGE');
    }
  });
});

describe('TemporalValidator', () => {
  const tv = new TemporalValidator();

  it('should validate correct time range', () => {
    expect(tv.validateTimeRange(1000, 2000)).toBeNull();
  });

  it('should reject equal times (I4)', () => {
    const err = tv.validateTimeRange(1000, 1000);
    expect(err).not.toBeNull();
    expect(err!.error).toBe('INVALID_TIME_RANGE');
  });

  it('should reject inverted times', () => {
    const err = tv.validateTimeRange(2000, 1000);
    expect(err).not.toBeNull();
    expect(err!.error).toBe('INVALID_TIME_RANGE');
  });

  it('should accept valid IANA timezone', () => {
    expect(isValidTimezone('America/Mexico_City')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Europe/Madrid')).toBe(true);
  });

  it('should reject invalid timezone', () => {
    expect(isValidTimezone('Mars/Olympus')).toBe(false);
  });

  it('should validate upcoming reminder timing (I18)', () => {
    const err = tv.validateReminderTiming('upcoming', 2000, 3000, 4000);
    expect(err).toBeNull();
  });

  it('should reject upcoming reminder after startAt (I18)', () => {
    const err = tv.validateReminderTiming('upcoming', 3500, 3000, 4000);
    expect(err).not.toBeNull();
    expect(err!.error).toBe('INVALID_REMINDER_TIME');
  });

  it('should validate follow-up reminder timing (I19)', () => {
    const err = tv.validateReminderTiming('follow_up', 5000, 3000, 4000);
    expect(err).toBeNull();
  });

  it('should reject follow-up reminder before endAt (I19)', () => {
    const err = tv.validateReminderTiming('follow_up', 3500, 3000, 4000);
    expect(err).not.toBeNull();
    expect(err!.error).toBe('INVALID_REMINDER_TIME');
  });

  it('should reject reminder in the past (I20)', () => {
    const err = tv.validateReminderNotInPast(1000, Date.now());
    expect(err).not.toBeNull();
    expect(err!.error).toBe('REMINDER_TIME_IN_PAST');
  });

  it('should accept reminder in the future (I20)', () => {
    const err = tv.validateReminderNotInPast(Date.now() + 3600000, Date.now());
    expect(err).toBeNull();
  });
});

describe('ConflictDetector', () => {
  const cd = new ConflictDetector();
  const cal = createCalendar(); // All-days window 00:00-23:59

  it('should detect no conflicts on empty calendar', () => {
    const start = nextWeekdayHour(10, 1);
    const result = cd.check(start, start + 3600000, {
      calendar: cal,
      reservations: [],
      timeSlots: [],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.available).toBe(true);
    }
  });

  it('should detect conflict with overlapping reservation (I5)', () => {
    const result = cd.check(5000, 15000, {
      calendar: cal,
      reservations: [{
        id: 'rsv_001' as any, calendarId: cal.id, timeSlotId: 'tsl_001' as any,
        title: 'Existing', status: 'confirmed' as const,
        startAt: 10000, endAt: 20000,
        providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
      }],
      timeSlots: [{
        id: 'tsl_001' as any, calendarId: cal.id,
        startAt: 10000, endAt: 20000, status: 'reserved',
        reservationId: 'rsv_001' as any,
      }],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.available).toBe(false);
      expect(result.conflictingSlots).toHaveLength(1);
    }
  });

  it('should allow non-overlapping reservations', () => {
    const result = cd.check(5000, 10000, {
      calendar: cal,
      reservations: [{
        id: 'rsv_001' as any, calendarId: cal.id, timeSlotId: 'tsl_001' as any,
        title: 'Existing', status: 'confirmed' as const,
        startAt: 10000, endAt: 20000,
        providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
      }],
      timeSlots: [],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.available).toBe(true);
    }
  });

  it('should detect blocked time slot conflict (I6)', () => {
    const result = cd.check(5000, 15000, {
      calendar: cal,
      reservations: [],
      timeSlots: [{
        id: 'tsl_blocked' as any, calendarId: cal.id,
        startAt: 10000, endAt: 20000, status: 'blocked',
        blockedReason: 'Vacation',
      }],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.available).toBe(false);
    }
  });

  it('should reject range outside all availability windows (I21)', () => {
    // Create a Mon-Fri only calendar
    const mfCal = createCalendar([1, 2, 3, 4, 5]);
    // Sunday = day 0
    const sunday = new Date('2026-05-17T10:00:00Z');
    const result = cd.check(sunday.getTime(), sunday.getTime() + 3600000, {
      calendar: mfCal,
      reservations: [],
      timeSlots: [],
    });
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toBe('TIME_SLOT_UNAVAILABLE');
    }
  });
});
