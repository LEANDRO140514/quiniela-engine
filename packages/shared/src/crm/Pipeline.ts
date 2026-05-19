// ── Canonical CRM Pipeline ──────────────────────────────
//
// A pipeline defines a sequence of stages that opportunities flow through.
// Provider-agnostic. Compatible with GHL, HubSpot, Pipedrive, custom.

import type { PipelineId, TenantId } from '../ids/EntityId';

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface CRMPipeline {
  /** Canonical pipeline ID (pip_ prefix) */
  id: PipelineId;

  /** Tenant scope */
  tenantId?: TenantId;

  /** Provider-specific IDs */
  providerIds: Record<string, string>;

  /** Display name */
  name: string;

  /** Ordered stages */
  stages: PipelineStage[];

  /** Whether this pipeline is active */
  active: boolean;

  /** Unix ms when created */
  createdAt: number;

  /** Unix ms of last update */
  updatedAt: number;

  /** Extension point */
  metadata: Record<string, unknown>;
}

export function createPipeline(
  overrides: Partial<CRMPipeline> = {},
): CRMPipeline {
  const now = Date.now();
  return {
    id: overrides.id ?? ('pip_unknown' as PipelineId),
    providerIds: overrides.providerIds ?? {},
    name: overrides.name ?? '',
    stages: overrides.stages ?? [],
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata ?? {},
    tenantId: overrides.tenantId,
  };
}
