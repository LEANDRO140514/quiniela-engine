// ── Canonical Domain Event ──────────────────────────────
//
// All events flowing through Algorithmus Platform conform to this shape.
// Engine-specific events extend this via payload discrimination.
//
// Design principles:
//   - Provider-agnostic: no Chatwoot/GHL/WhatsApp fields at this layer
//   - Multitenant-ready: tenantId + workspaceId on every event
//   - Causality: correlationId (same flow) + causationId (parent event)
//   - Actor-tracking: actorId identifies who triggered the event (user, system, engine)

export interface DomainEvent {
  /** Unique event ID (evt_ prefix) */
  id: string;

  /** Event type discriminator (e.g. 'WorkflowStarted', 'HandoffRequested') */
  type: string;

  /** Unix timestamp in milliseconds */
  timestamp: number;

  /** Tenant scope */
  tenantId?: string;

  /** Workspace scope (sub-tenant grouping) */
  workspaceId?: string;

  /** Conversation this event belongs to */
  conversationId?: string;

  /** Workflow execution this event belongs to */
  workflowId?: string;

  /** Links events within the same causal flow */
  correlationId?: string;

  /** Points to the event that directly caused this one */
  causationId?: string;

  /** Who or what triggered this event (userId, engineName, 'system') */
  actorId?: string;

  /** Vertical domain (e.g. 'dental', 'academic') */
  verticalId?: string;

  /** Event-specific data */
  payload?: unknown;

  /** Extension point for provider adapters, observability, etc. */
  metadata?: Record<string, unknown>;
}

import { uuidv7 } from './uuid7';

// ── Factory ─────────────────────────────────────────────

export function createDomainEvent(
  type: string,
  overrides: Partial<DomainEvent> = {},
): DomainEvent {
  return {
    id: overrides.id ?? `evt_${uuidv7()}`,
    type,
    timestamp: overrides.timestamp ?? Date.now(),
    payload: overrides.payload,
    metadata: overrides.metadata,
    tenantId: overrides.tenantId,
    workspaceId: overrides.workspaceId,
    conversationId: overrides.conversationId,
    workflowId: overrides.workflowId,
    correlationId: overrides.correlationId,
    causationId: overrides.causationId,
    actorId: overrides.actorId,
    verticalId: overrides.verticalId,
  };
}

export function isDomainEvent(candidate: unknown): candidate is DomainEvent {
  if (!candidate || typeof candidate !== 'object') return false;
  const e = candidate as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.type === 'string' &&
    typeof e.timestamp === 'number'
  );
}
