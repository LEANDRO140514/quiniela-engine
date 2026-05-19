// ── Canonical Reminder ──────────────────────────────────
//
// A reminder is a scheduled notification tied to a reservation lifecycle.
// Status: scheduled → triggered | cancelled | failed

import type { ReminderId, ReservationId } from '../ids/EntityId';

export type ReminderType = 'confirmation_request' | 'upcoming' | 'follow_up' | 'custom';
export type ReminderChannel = 'whatsapp' | 'email' | 'sms' | 'push';
export type ReminderStatus = 'scheduled' | 'triggered' | 'cancelled' | 'failed';

export interface Reminder {
  id: ReminderId;
  reservationId: ReservationId;
  type: ReminderType;
  channel: ReminderChannel;
  scheduledAt: number;
  triggeredAt?: number;
  status: ReminderStatus;
  message?: string;
  createdAt: number;
  metadata: Record<string, unknown>;
}

export function createReminder(overrides: Partial<Reminder> = {}): Reminder {
  const now = Date.now();
  return {
    id: overrides.id ?? ('rmd_unknown' as ReminderId),
    reservationId: overrides.reservationId ?? ('rsv_unknown' as ReservationId),
    type: overrides.type ?? 'upcoming',
    channel: overrides.channel ?? 'whatsapp',
    scheduledAt: overrides.scheduledAt ?? 0,
    status: overrides.status ?? 'scheduled',
    createdAt: overrides.createdAt ?? now,
    metadata: overrides.metadata ?? {},
    triggeredAt: overrides.triggeredAt,
    message: overrides.message,
  };
}
