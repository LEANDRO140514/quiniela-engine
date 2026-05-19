// ── Ownership Guard ──────────────────────────────────────
// Enforces ownership permission matrix per OpenSpec §11.
// I24: LOCKED blocks ALL writes
// I25: AI can only read + create reminders
// I26: SHARED requires approvedBy for mutations
// I27: HUMAN has full access

import type { ConversationOwner } from '@curdeeclau/shared';
import type { CalendarError } from '../types';

const READ_ACTIONS = new Set(['check_availability']);

const REMINDER_ACTIONS = new Set(['create_reminder', 'cancel_reminder']);

const MUTATION_ACTIONS = new Set([
  'create_reservation',
  'cancel_reservation',
  'reschedule_reservation',
  'block_time_slot',
  'release_time_slot',
]);

export class OwnershipGuard {
  /**
   * Returns null if action is allowed, or a CalendarError if blocked.
   */
  check(
    action: string,
    owner: ConversationOwner,
    approvedBy?: string,
  ): CalendarError | null {
    // I24: LOCKED blocks everything except reads
    if (owner === 'LOCKED') {
      if (READ_ACTIONS.has(action)) return null;
      return {
        error: 'OWNERSHIP_LOCKED',
        message: `Action '${action}' blocked — ownership is LOCKED`,
      };
    }

    // I25: AI can read + manage reminders, but NOT mutate reservations/slots
    if (owner === 'AI') {
      if (READ_ACTIONS.has(action) || REMINDER_ACTIONS.has(action)) return null;
      return {
        error: 'OWNERSHIP_INSUFFICIENT',
        message: `Action '${action}' requires HUMAN or SHARED ownership, current: AI`,
      };
    }

    // I26: SHARED requires explicit human approval for mutations
    if (owner === 'SHARED' && MUTATION_ACTIONS.has(action)) {
      if (!approvedBy) {
        return {
          error: 'APPROVAL_REQUIRED',
          message: `Action '${action}' requires human approval under SHARED ownership`,
        };
      }
    }

    // I27: HUMAN has full access
    return null;
  }

  /**
   * Returns which actions the given owner can perform (for introspection/debugging).
   */
  getAllowedActions(owner: ConversationOwner): {
    read: boolean;
    reminders: boolean;
    mutations: boolean;
  } {
    if (owner === 'LOCKED') return { read: true, reminders: false, mutations: false };
    if (owner === 'AI') return { read: true, reminders: true, mutations: false };
    return { read: true, reminders: true, mutations: true };
  }
}
