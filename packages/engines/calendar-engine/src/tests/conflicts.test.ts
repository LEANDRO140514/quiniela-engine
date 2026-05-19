import { describe, it, expect } from 'vitest';
import { ConflictDetector } from '../runtime/ConflictDetector';
import { CalendarManager } from '../managers/CalendarManager';
import type { Calendar } from '@curdeeclau/shared';

function createAllDayCalendar(): Calendar {
  const cals = new Map<string, Calendar>();
  const cm = new CalendarManager(cals);
  const result = cm.create({
    name: 'All-Day Calendar',
    timezone: 'UTC',
    availabilityWindows: [{
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '00:00',
      endTime: '23:59',
      slotDurationMs: 3600000,
      bufferBeforeMs: 0,
      bufferAfterMs: 0,
    }],
  });
  return result as Calendar;
}

function createBufferCalendar(before: number, after: number): Calendar {
  const cals = new Map<string, Calendar>();
  const cm = new CalendarManager(cals);
  const result = cm.create({
    name: 'Buffer Calendar',
    timezone: 'UTC',
    availabilityWindows: [{
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '00:00',
      endTime: '23:59',
      slotDurationMs: 3600000,
      bufferBeforeMs: before,
      bufferAfterMs: after,
    }],
  });
  return result as Calendar;
}

describe('ConflictDetector — overlap edge cases', () => {
  const cd = new ConflictDetector();
  const cal = createAllDayCalendar();

  it('should detect exact boundary match as non-conflict', () => {
    const result = cd.check(10000, 20000, {
      calendar: cal,
      reservations: [{
        id: 'rsv_001' as any, calendarId: cal.id, timeSlotId: 'tsl_001' as any,
        title: 'Existing', status: 'confirmed' as const,
        startAt: 20000, endAt: 30000,
        providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
      }],
      timeSlots: [],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.available).toBe(true);
  });

  it('should detect boundary cross as conflict', () => {
    const result = cd.check(15000, 25000, {
      calendar: cal,
      reservations: [{
        id: 'rsv_001' as any, calendarId: cal.id, timeSlotId: 'tsl_001' as any,
        title: 'Existing', status: 'confirmed' as const,
        startAt: 20000, endAt: 30000,
        providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
      }],
      timeSlots: [],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.available).toBe(false);
  });

  it('should ignore terminated reservations (I9)', () => {
    const result = cd.check(15000, 25000, {
      calendar: cal,
      reservations: [{
        id: 'rsv_cancelled' as any, calendarId: cal.id, timeSlotId: 'tsl_001' as any,
        title: 'Cancelled', status: 'cancelled' as const,
        startAt: 20000, endAt: 30000,
        providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
      }],
      timeSlots: [],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.available).toBe(true);
  });

  it('should apply buffer windows — within buffer conflicts (I22)', () => {
    const bufCal = createBufferCalendar(600, 600);
    // Reservation at 20000-30000, buffer extends to 19400-30600
    // Try booking at 19600 — within buffer → conflict
    const result = cd.check(19600, 25000, {
      calendar: bufCal,
      reservations: [{
        id: 'rsv_001' as any, calendarId: bufCal.id, timeSlotId: 'tsl_001' as any,
        title: 'Existing', status: 'confirmed' as const,
        startAt: 20000, endAt: 30000,
        providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
      }],
      timeSlots: [],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.available).toBe(false);
  });

  it('should allow outside buffer window (I22)', () => {
    const bufCal = createBufferCalendar(600, 600);
    // Reservation at 20000-30000, buffer extends to 19400-30600
    // Try booking at 31000 — outside buffer → ok
    const result = cd.check(31000, 40000, {
      calendar: bufCal,
      reservations: [{
        id: 'rsv_001' as any, calendarId: bufCal.id, timeSlotId: 'tsl_001' as any,
        title: 'Existing', status: 'confirmed' as const,
        startAt: 20000, endAt: 30000,
        providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
      }],
      timeSlots: [],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.available).toBe(true);
  });

  it('should detect overlapping with multiple reservations', () => {
    const result = cd.check(15000, 35000, {
      calendar: cal,
      reservations: [
        {
          id: 'rsv_a' as any, calendarId: cal.id, timeSlotId: 'tsl_a' as any,
          title: 'A', status: 'confirmed' as const,
          startAt: 20000, endAt: 25000,
          providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
        },
        {
          id: 'rsv_b' as any, calendarId: cal.id, timeSlotId: 'tsl_b' as any,
          title: 'B', status: 'confirmed' as const,
          startAt: 30000, endAt: 35000,
          providerIds: {}, createdAt: 0, updatedAt: 0, metadata: {},
        },
      ],
      timeSlots: [],
    });
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.available).toBe(false);
      expect(result.conflictingSlots).toHaveLength(2);
    }
  });
});
