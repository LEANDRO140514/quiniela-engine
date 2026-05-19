// ── Canonical CRM Opportunity ───────────────────────────
//
// An opportunity represents a potential deal or conversion.
// Lives in a pipeline stage. Linked to a contact.

import type { OpportunityId, ContactId, PipelineId, TenantId } from '../ids/EntityId';

export type OpportunityStatus = 'open' | 'won' | 'lost' | 'abandoned';

export interface CRMOpportunity {
  /** Canonical opportunity ID (opp_ prefix) */
  id: OpportunityId;

  /** Tenant scope */
  tenantId?: TenantId;

  /** Provider-specific IDs */
  providerIds: Record<string, string>;

  /** Owning contact */
  contactId: ContactId;

  /** Pipeline this opportunity lives in */
  pipelineId: PipelineId;

  /** Current stage within the pipeline */
  stageId: string;

  /** Current status */
  status: OpportunityStatus;

  /** Monetary value (optional) */
  value?: number;

  /** Currency code (ISO 4217, e.g. 'MXN', 'USD') */
  currency?: string;

  /** Expected close date (Unix ms) */
  expectedCloseAt?: number;

  /** Unix ms when created */
  createdAt: number;

  /** Unix ms of last update */
  updatedAt: number;

  /** Extension point */
  metadata: Record<string, unknown>;
}

export function createOpportunity(
  overrides: Partial<CRMOpportunity> = {},
): CRMOpportunity {
  const now = Date.now();
  return {
    id: overrides.id ?? ('opp_unknown' as OpportunityId),
    providerIds: overrides.providerIds ?? {},
    contactId: overrides.contactId ?? ('cnt_unknown' as ContactId),
    pipelineId: overrides.pipelineId ?? ('pip_unknown' as PipelineId),
    stageId: overrides.stageId ?? '',
    status: overrides.status ?? 'open',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata ?? {},
    tenantId: overrides.tenantId,
    value: overrides.value,
    currency: overrides.currency,
    expectedCloseAt: overrides.expectedCloseAt,
  };
}
