import { describe, it, expect } from 'vitest';
import { OwnershipGuard } from '../runtime/OwnershipGuard';
import { CalendarEngine } from '../CalendarEngine';
import { InMemoryCalendarProvider } from '../providers/InMemoryCalendarProvider';
import type { ConversationOwner } from '@curdeeclau/shared';

describe('OwnershipGuard — permission matrix', () => {
  const guard = new OwnershipGuard();

  // I24: LOCKED blocks all writes
  it('LOCKED should allow reads only (I24)', () => {
    expect(guard.check('check_availability', 'LOCKED')).toBeNull();
    expect(guard.check('create_reservation', 'LOCKED')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('cancel_reservation', 'LOCKED')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('reschedule_reservation', 'LOCKED')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('block_time_slot', 'LOCKED')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('release_time_slot', 'LOCKED')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('create_reminder', 'LOCKED')?.error).toBe('OWNERSHIP_LOCKED');
    expect(guard.check('cancel_reminder', 'LOCKED')?.error).toBe('OWNERSHIP_LOCKED');
  });

  // I25: AI can only read + reminders
  it('AI should allow reads and reminders only (I25)', () => {
    expect(guard.check('check_availability', 'AI')).toBeNull();
    expect(guard.check('create_reminder', 'AI')).toBeNull();
    expect(guard.check('cancel_reminder', 'AI')).toBeNull();
    expect(guard.check('create_reservation', 'AI')?.error).toBe('OWNERSHIP_INSUFFICIENT');
    expect(guard.check('cancel_reservation', 'AI')?.error).toBe('OWNERSHIP_INSUFFICIENT');
    expect(guard.check('block_time_slot', 'AI')?.error).toBe('OWNERSHIP_INSUFFICIENT');
  });

  // I26: SHARED requires approval for mutations
  it('SHARED should require approval for mutations (I26)', () => {
    expect(guard.check('create_reservation', 'SHARED')?.error).toBe('APPROVAL_REQUIRED');
    expect(guard.check('cancel_reservation', 'SHARED')?.error).toBe('APPROVAL_REQUIRED');
    expect(guard.check('reschedule_reservation', 'SHARED')?.error).toBe('APPROVAL_REQUIRED');
    // With approval, should pass
    expect(guard.check('create_reservation', 'SHARED', 'usr_approver')).toBeNull();
    expect(guard.check('cancel_reservation', 'SHARED', 'usr_approver')).toBeNull();
    // Reads don't need approval
    expect(guard.check('check_availability', 'SHARED')).toBeNull();
    expect(guard.check('create_reminder', 'SHARED')).toBeNull();
  });

  // I27: HUMAN has full access
  it('HUMAN should have full access (I27)', () => {
    const actions = [
      'check_availability', 'create_reservation', 'cancel_reservation',
      'reschedule_reservation', 'block_time_slot', 'release_time_slot',
      'create_reminder', 'cancel_reminder',
    ];
    for (const action of actions) {
      expect(guard.check(action, 'HUMAN')).toBeNull();
    }
  });

  it('getAllowedActions should return correct permissions', () => {
    expect(guard.getAllowedActions('LOCKED')).toEqual({ read: true, reminders: false, mutations: false });
    expect(guard.getAllowedActions('AI')).toEqual({ read: true, reminders: true, mutations: false });
    expect(guard.getAllowedActions('HUMAN')).toEqual({ read: true, reminders: true, mutations: true });
    expect(guard.getAllowedActions('SHARED')).toEqual({ read: true, reminders: true, mutations: true });
  });
});

describe('CalendarEngine — ownership gating', () => {
  it('should block mutation under LOCKED ownership', async () => {
    const engine = new CalendarEngine({
      provider: new InMemoryCalendarProvider(),
      ownershipResolver: () => 'LOCKED',
    });

    const result = await engine.execute('create_reservation', {
      calendarId: 'cal_001',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
      title: 'Should fail',
    });
    expect(result.error).toBe('OWNERSHIP_LOCKED');
  });

  it('should allow read under LOCKED ownership', async () => {
    const engine = new CalendarEngine({
      provider: new InMemoryCalendarProvider(),
      ownershipResolver: () => 'LOCKED',
    });

    const result = await engine.execute('check_availability', {
      calendarId: 'cal_001',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
    });
    // Ownership gate passed (reads allowed), but calendar doesn't exist
    expect(result.error).toBe('CALENDAR_NOT_FOUND');
  });

  it('should block reservation creation under AI ownership', async () => {
    const engine = new CalendarEngine({
      provider: new InMemoryCalendarProvider(),
      ownershipResolver: () => 'AI',
    });

    const result = await engine.execute('create_reservation', {
      calendarId: 'cal_001',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
      title: 'Should fail',
    });
    expect(result.error).toBe('OWNERSHIP_INSUFFICIENT');
  });

  it('should allow availability check under AI ownership', async () => {
    const engine = new CalendarEngine({
      provider: new InMemoryCalendarProvider(),
      ownershipResolver: () => 'AI',
    });

    const result = await engine.execute('check_availability', {
      calendarId: 'cal_001',
      startAt: Date.now() + 36000000,
      endAt: Date.now() + 39600000,
    });
    // Ownership gate passed (reads allowed), but calendar doesn't exist
    expect(result.error).toBe('CALENDAR_NOT_FOUND');
  });

  it('should require approval under SHARED ownership', async () => {
    const engine = new CalendarEngine({
      provider: new InMemoryCalendarProvider(),
      ownershipResolver: () => 'SHARED',
    });

    const noApproval = await engine.execute('create_reservation', {
      calendarId: 'cal_001', startAt: 1, endAt: 2, title: 'Test',
    });
    expect(noApproval.error).toBe('APPROVAL_REQUIRED');

    const withApproval = await engine.execute('create_reservation', {
      calendarId: 'cal_001', startAt: 1, endAt: 2, title: 'Test', approvedBy: 'usr_001',
    });
    // Ownership gate passed, but calendar doesn't exist
    expect(withApproval.error).toBe('CALENDAR_NOT_FOUND');
  });
});
