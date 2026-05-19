// ── Canonical Conversation Context ──────────────────────
//
// Every conversation in Algorithmus Platform carries this context.
// It is the runtime "envelope" that flows through message-buffer →
// classification → routing → workflow execution → handoff → recovery.

import type { ConversationId, TenantId, ExecutionId } from '../ids/EntityId';
import type { ConversationOwner } from './Ownership';
import type { SuppressionMode } from './Suppression';

export interface ConversationContext {
  /** Canonical conversation ID (conv_ prefix) */
  conversationId: ConversationId;

  /** Current workflow execution driving this conversation */
  executionId?: ExecutionId;

  /** Tenant scope */
  tenantId?: TenantId;

  /** Vertical domain */
  verticalId?: string;

  /** Current conversation owner */
  owner: ConversationOwner;

  /** Current AI suppression mode */
  suppressionMode: SuppressionMode;

  /** Conversation-level state (engine-agnostic) */
  state: Record<string, unknown>;

  /** Conversation-level metadata (extensible by adapters) */
  metadata: Record<string, unknown>;

  /** Unix ms when conversation started */
  startedAt: number;

  /** Unix ms of last update */
  updatedAt: number;
}

export function createConversationContext(
  overrides: Partial<ConversationContext> = {},
): ConversationContext {
  const now = Date.now();
  return {
    conversationId: overrides.conversationId ?? ('conv_unknown' as ConversationId),
    owner: overrides.owner ?? 'AI',
    suppressionMode: overrides.suppressionMode ?? 'NONE',
    state: overrides.state ?? {},
    metadata: overrides.metadata ?? {},
    startedAt: overrides.startedAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    executionId: overrides.executionId,
    tenantId: overrides.tenantId,
    verticalId: overrides.verticalId,
  };
}
