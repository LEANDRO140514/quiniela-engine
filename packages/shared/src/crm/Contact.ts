// ── Canonical CRM Contact ───────────────────────────────
//
// Provider-agnostic contact entity.
// Provider-specific IDs live in `providerIds`, never in `id`.

import type { ContactId, TenantId } from '../ids/EntityId';

export interface CRMContact {
  /** Canonical contact ID (cnt_ prefix) */
  id: ContactId;

  /** Tenant scope */
  tenantId?: TenantId;

  /** Provider-specific IDs (ghl, chatwoot, whatsapp, custom) */
  providerIds: Record<string, string>;

  /** Display name */
  name: string;

  /** Given name (optional, for personalization) */
  firstName?: string;

  /** Family name (optional) */
  lastName?: string;

  /** Primary email */
  email?: string;

  /** Primary phone (E.164 preferred) */
  phone?: string;

  /** Free-form tags */
  tags: string[];

  /** Contact source (e.g. 'whatsapp', 'web', 'referral') */
  source?: string;

  /** Unix ms of first interaction */
  createdAt: number;

  /** Unix ms of last interaction */
  updatedAt: number;

  /** Extension point for provider adapters */
  metadata: Record<string, unknown>;
}

export function createContact(
  overrides: Partial<CRMContact> = {},
): CRMContact {
  const now = Date.now();
  return {
    id: overrides.id ?? ('cnt_unknown' as ContactId),
    providerIds: overrides.providerIds ?? {},
    name: overrides.name ?? '',
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata ?? {},
    tenantId: overrides.tenantId,
    firstName: overrides.firstName,
    lastName: overrides.lastName,
    email: overrides.email,
    phone: overrides.phone,
    source: overrides.source,
  };
}
