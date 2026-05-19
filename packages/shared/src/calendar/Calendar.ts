// ── Canonical Calendar ──────────────────────────────────
//
// A calendar is a named temporal container with availability rules.
// Provider-agnostic. Compatible with Google Calendar, Outlook, Cal.com.

import type { CalendarId, TenantId } from '../ids/EntityId';

export interface AvailabilityWindow {
  id: string;
  calendarId: CalendarId;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  bufferBeforeMs?: number;
  bufferAfterMs?: number;
  slotDurationMs: number;
  validFrom?: number;
  validUntil?: number;
  metadata?: Record<string, unknown>;
}

export interface Calendar {
  id: CalendarId;
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  name: string;
  timezone: string;
  availabilityWindows: AvailabilityWindow[];
  active: boolean;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

export function createCalendar(overrides: Partial<Calendar> = {}): Calendar {
  const now = Date.now();
  return {
    id: overrides.id ?? ('cal_unknown' as CalendarId),
    providerIds: overrides.providerIds ?? {},
    name: overrides.name ?? '',
    timezone: overrides.timezone ?? 'UTC',
    availabilityWindows: overrides.availabilityWindows ?? [],
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata ?? {},
    tenantId: overrides.tenantId,
  };
}
