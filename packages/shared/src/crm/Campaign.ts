// ── Canonical CRM Campaign ──────────────────────────────
//
// A campaign represents an outbound marketing/sales automation sequence.
// Provider-agnostic. Compatible with GHL, Mailchimp, custom engines.

import type { CampaignId, TenantId } from '../ids/EntityId';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface CRMCampaign {
  /** Canonical campaign ID (cmp_ prefix) */
  id: CampaignId;

  /** Tenant scope */
  tenantId?: TenantId;

  /** Provider-specific IDs */
  providerIds: Record<string, string>;

  /** Display name */
  name: string;

  /** Current status */
  status: CampaignStatus;

  /** Unix ms when campaign starts sending */
  startAt?: number;

  /** Unix ms when campaign ends */
  endAt?: number;

  /** Unix ms when created */
  createdAt: number;

  /** Unix ms of last update */
  updatedAt: number;

  /** Extension point */
  metadata: Record<string, unknown>;
}

export function createCampaign(
  overrides: Partial<CRMCampaign> = {},
): CRMCampaign {
  const now = Date.now();
  return {
    id: overrides.id ?? ('cmp_unknown' as CampaignId),
    providerIds: overrides.providerIds ?? {},
    name: overrides.name ?? '',
    status: overrides.status ?? 'draft',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata ?? {},
    tenantId: overrides.tenantId,
    startAt: overrides.startAt,
    endAt: overrides.endAt,
  };
}
