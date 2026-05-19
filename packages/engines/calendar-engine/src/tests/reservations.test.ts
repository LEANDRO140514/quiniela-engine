import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCalendarProvider } from '../providers/InMemoryCalendarProvider';
import { CalendarEngine } from '../CalendarEngine';

function createEngine() {
  const provider = new InMemoryCalendarProvider();
  const engine = new CalendarEngine({ provider });
  return { engine, provider };
}

async function createTestCalendar(provider: InMemoryCalendarProvider) {
  return provider.createCalendar({
    name: 'Test Clinic',
    timezone: 'America/Mexico_City',
    availabilityWindows: [{
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '00:00',
      endTime: '23:59',
      slotDurationMs: 60 * 60 * 1000,
    }],
    tenantId: 'tnt_test',
  });
}

/** Next weekday at given hour, in ms. */
function tomorrowAt(hour: number): number {
  const d = new Date(Date.now() + 86400000);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

describe('Reservation lifecycle', () => {
  let engine: CalendarEngine;
  let calId: string;

  beforeEach(async () => {
    const s = createEngine();
    engine = s.engine;
    const cal = await createTestCalendar(s.provider);
    calId = cal.id;
  });

  it('should create and get reservation', async () => {
    const result = await engine.execute('create_reservation', {
      calendarId: calId,
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      title: 'Checkup',
      contactId: 'ctc_test123',
      description: 'Annual dental checkup',
    });

    expect(result.error).toBeUndefined();
    expect(result.reservation).toBeDefined();
    if (result.reservation) {
      const rsv = result.reservation as any;
      expect(rsv.status).toBe('pending');
      expect(rsv.title).toBe('Checkup');
      expect(rsv.id).toMatch(/^rsv_/);
    }
  });

  it('should cancel reservation and release slot (I15)', async () => {
    const created = await engine.execute('create_reservation', {
      calendarId: calId,
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      title: 'To Cancel',
    });
    const rsvId = (created.reservation as any).id;

    const result = await engine.execute('cancel_reservation', {
      reservationId: rsvId,
      reason: 'Patient cancelled',
    });

    expect(result.error).toBeUndefined();
    expect(result.reservation).toBeDefined();
    if (result.reservation) {
      const rsv = result.reservation as any;
      expect(rsv.status).toBe('cancelled');
      expect(rsv.cancellationReason).toBe('Patient cancelled');
    }
  });

  it('should reject cancellation of already cancelled (I9)', async () => {
    const created = await engine.execute('create_reservation', {
      calendarId: calId,
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      title: 'Double Cancel',
    });
    const rsvId = (created.reservation as any).id;

    await engine.execute('cancel_reservation', { reservationId: rsvId });
    const second = await engine.execute('cancel_reservation', { reservationId: rsvId });

    expect(second.error).toBeDefined();
    expect(second.error).toBe('ALREADY_CANCELLED');
  });

  it('should reject reservation on non-existent calendar', async () => {
    const result = await engine.execute('create_reservation', {
      calendarId: 'cal_nonexistent',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
      title: 'Ghost booking',
    });
    expect(result.error).toBe('CALENDAR_NOT_FOUND');
  });
});

describe('Reschedule (I12)', () => {
  let engine: CalendarEngine;
  let calId: string;

  beforeEach(async () => {
    const s = createEngine();
    engine = s.engine;
    const cal = await createTestCalendar(s.provider);
    calId = cal.id;
  });

  it('should reschedule = atomic cancel + create (I12)', async () => {
    const created = await engine.execute('create_reservation', {
      calendarId: calId,
      startAt: tomorrowAt(10),
      endAt: tomorrowAt(11),
      title: 'Reschedule Me',
    });
    const rsvId = (created.reservation as any).id;

    const result = await engine.execute('reschedule_reservation', {
      reservationId: rsvId,
      newStartAt: tomorrowAt(15),
      newEndAt: tomorrowAt(16),
    });

    expect(result.error).toBeUndefined();
    expect(result.reservation).toBeDefined();
    expect(result.previous).toBeDefined();
    if (result.reservation && result.previous) {
      const rsv = result.reservation as any;
      const prev = result.previous as any;
      expect(prev.status).toBe('cancelled');
      expect(prev.cancellationReason).toBe('Rescheduled');
      expect(rsv.status).toBe('pending');
      expect(rsv.startAt).toBe(tomorrowAt(15));
      expect(rsv.endAt).toBe(tomorrowAt(16));
      expect(rsv.metadata.rescheduledFrom).toBe(rsvId);
    }
  });
});
