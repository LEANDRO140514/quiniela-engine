// ── Canonical Entity ID ──────────────────────────────────
//
// All Algorithmus Platform entities use prefixed string IDs.
// Prefix convention: 3-4 lowercase letters + underscore (usr_, cnt_, conv_, etc.)
// Body: ULID or UUIDv7 compatible (26+ chars, sortable, unique).
//
// Examples:
//   usr_01JX2K5N8P3Q7R0A1B4C6D9E
//   cnt_01JX2K5N8P3Q7R0A1B4C6D9F
//   wf_01JX2K5N8P3Q7R0A1B4C6D9G

export type EntityId = string;

// ── Branded Domain ID Types ─────────────────────────────

export type ConversationId = EntityId & { __brand?: 'ConversationId' };
export type WorkflowId = EntityId & { __brand?: 'WorkflowId' };
export type TenantId = EntityId & { __brand?: 'TenantId' };
export type ContactId = EntityId & { __brand?: 'ContactId' };
export type OpportunityId = EntityId & { __brand?: 'OpportunityId' };
export type PipelineId = EntityId & { __brand?: 'PipelineId' };
export type CampaignId = EntityId & { __brand?: 'CampaignId' };
export type EventId = EntityId & { __brand?: 'EventId' };
export type ExecutionId = EntityId & { __brand?: 'ExecutionId' };
export type UserId = EntityId & { __brand?: 'UserId' };
export type CalendarId = EntityId & { __brand?: 'CalendarId' };
export type TimeSlotId = EntityId & { __brand?: 'TimeSlotId' };
export type ReservationId = EntityId & { __brand?: 'ReservationId' };
export type ReminderId = EntityId & { __brand?: 'ReminderId' };

// ── Valid Prefix Registry ───────────────────────────────

export const VALID_PREFIXES = [
  'usr',   // User
  'cnt',   // Contact
  'opp',   // Opportunity
  'pip',   // Pipeline
  'cmp',   // Campaign
  'evt',   // Event
  'wfl',   // Workflow
  'exec',  // Execution
  'conv',  // Conversation
  'msg',   // Message
  'tnt',   // Tenant
  'wsp',   // Workspace
  'vrt',   // Vertical
  'cal',   // Calendar
  'tsl',   // TimeSlot
  'rsv',   // Reservation
  'rmd',   // Reminder
  'avw',   // AvailabilityWindow
] as const;

export type IdPrefix = (typeof VALID_PREFIXES)[number];

// ── Helpers ─────────────────────────────────────────────

export function isValidId(id: string): id is EntityId {
  if (!id || typeof id !== 'string') return false;
  const parts = id.split('_');
  if (parts.length < 2) return false;
  return VALID_PREFIXES.includes(parts[0] as IdPrefix);
}

export function getPrefix(id: EntityId): string | undefined {
  const idx = id.indexOf('_');
  if (idx === -1) return undefined;
  return id.slice(0, idx);
}

export function matchesPrefix(id: EntityId, prefix: IdPrefix): boolean {
  return getPrefix(id) === prefix;
}

export function assertId(id: string, expectedPrefix: IdPrefix): void {
  if (!isValidId(id) || getPrefix(id) !== expectedPrefix) {
    throw new Error(`Invalid ID "${id}": expected prefix "${expectedPrefix}_"`);
  }
}
