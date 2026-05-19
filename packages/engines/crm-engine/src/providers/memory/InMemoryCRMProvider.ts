// ── InMemory CRM Provider ────────────────────────────────
//
// Phase 1: fully in-memory CRM data store using Maps.
// Implements the CRMProvider interface exactly.
// Provides deterministic, fast storage for testing and MVP.
//
// All entities use canonical IDs (cnt_, opp_, pip_, cmp_ prefixes).
// providerIds is a separate map from the canonical id (invariant I1).

import type { CRMProvider, CreateContactInput, CreateOpportunityInput, CreatePipelineInput, CreateCampaignInput } from '../../types';
import type { CRMContact, CRMOpportunity, CRMPipeline, CRMCampaign } from '@curdeeclau/shared';
import type { ContactId, OpportunityId, PipelineId, CampaignId, TenantId } from '@curdeeclau/shared';

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  const ts = Date.now().toString(36);
  const seq = idCounter.toString(36).padStart(4, '0');
  return `${prefix}_${ts}${seq}`;
}

export class InMemoryCRMProvider implements CRMProvider {
  readonly providerName = 'in-memory';

  private contacts: Map<string, CRMContact> = new Map();
  private opportunities: Map<string, CRMOpportunity> = new Map();
  private pipelines: Map<string, CRMPipeline> = new Map();
  private campaigns: Map<string, CRMCampaign> = new Map();

  // Provider-ID index for lookup by external provider IDs
  private providerIndex: Map<string, string> = new Map();

  // ── Contacts ─────────────────────────────────────────────

  async createContact(data: CreateContactInput): Promise<CRMContact> {
    const now = Date.now();
    const contact: CRMContact = {
      id: nextId('cnt') as ContactId,
      tenantId: data.tenantId as TenantId | undefined,
      providerIds: {},
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      tags: data.tags ?? [],
      source: data.source,
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata ?? {},
    };
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async updateContact(id: string, changes: Partial<CRMContact>): Promise<CRMContact> {
    const existing = this.contacts.get(id);
    if (!existing) {
      throw new Error(`Contact ${id} not found`);
    }
    const updated: CRMContact = {
      ...existing,
      ...changes,
      id: existing.id,
      tenantId: changes.tenantId ?? existing.tenantId,
      providerIds: changes.providerIds ?? existing.providerIds,
      tags: changes.tags ?? existing.tags,
      metadata: changes.metadata ?? existing.metadata,
      updatedAt: Date.now(),
    };
    this.contacts.set(id, updated);
    return updated;
  }

  async getContact(id: string): Promise<CRMContact | undefined> {
    return this.contacts.get(id);
  }

  async findContactByProviderId(provider: string, providerId: string): Promise<CRMContact | undefined> {
    const key = `${provider}:${providerId}`;
    const contactId = this.providerIndex.get(key);
    if (contactId) {
      return this.contacts.get(contactId);
    }
    for (const contact of this.contacts.values()) {
      if (contact.providerIds[provider] === providerId) {
        this.providerIndex.set(key, contact.id);
        return contact;
      }
    }
    return undefined;
  }

  // ── Opportunities ────────────────────────────────────────

  async createOpportunity(data: CreateOpportunityInput): Promise<CRMOpportunity> {
    const now = Date.now();
    const opportunity: CRMOpportunity = {
      id: nextId('opp') as OpportunityId,
      tenantId: data.tenantId as TenantId | undefined,
      providerIds: {},
      contactId: data.contactId as ContactId,
      pipelineId: data.pipelineId as PipelineId,
      stageId: data.stageId,
      status: 'open',
      value: data.value,
      currency: data.currency,
      expectedCloseAt: data.expectedCloseAt,
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata ?? {},
    };
    this.opportunities.set(opportunity.id, opportunity);
    return opportunity;
  }

  async moveOpportunity(id: string, stageId: string): Promise<CRMOpportunity> {
    const existing = this.opportunities.get(id);
    if (!existing) {
      throw new Error(`Opportunity ${id} not found`);
    }
    const updated: CRMOpportunity = {
      ...existing,
      stageId,
      updatedAt: Date.now(),
    };
    this.opportunities.set(id, updated);
    return updated;
  }

  async getOpportunity(id: string): Promise<CRMOpportunity | undefined> {
    return this.opportunities.get(id);
  }

  // ── Pipelines ────────────────────────────────────────────

  async createPipeline(data: CreatePipelineInput): Promise<CRMPipeline> {
    const now = Date.now();
    const pipeline: CRMPipeline = {
      id: nextId('pip') as PipelineId,
      tenantId: data.tenantId as TenantId | undefined,
      providerIds: {},
      name: data.name,
      stages: data.stages,
      active: data.active ?? true,
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata ?? {},
    };
    this.pipelines.set(pipeline.id, pipeline);
    return pipeline;
  }

  async getPipeline(id: string): Promise<CRMPipeline | undefined> {
    return this.pipelines.get(id);
  }

  // ── Campaigns ────────────────────────────────────────────

  async createCampaign(data: CreateCampaignInput): Promise<CRMCampaign> {
    const now = Date.now();
    const campaign: CRMCampaign = {
      id: nextId('cmp') as CampaignId,
      tenantId: data.tenantId as TenantId | undefined,
      providerIds: {},
      name: data.name,
      status: 'draft',
      startAt: data.startAt,
      endAt: data.endAt,
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata ?? {},
    };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async pauseCampaign(id: string): Promise<CRMCampaign> {
    const existing = this.campaigns.get(id);
    if (!existing) {
      throw new Error(`Campaign ${id} not found`);
    }
    const updated: CRMCampaign = {
      ...existing,
      status: 'paused',
      updatedAt: Date.now(),
    };
    this.campaigns.set(id, updated);
    return updated;
  }

  async resumeCampaign(id: string): Promise<CRMCampaign> {
    const existing = this.campaigns.get(id);
    if (!existing) {
      throw new Error(`Campaign ${id} not found`);
    }
    const updated: CRMCampaign = {
      ...existing,
      status: 'active',
      updatedAt: Date.now(),
    };
    this.campaigns.set(id, updated);
    return updated;
  }

  async getCampaign(id: string): Promise<CRMCampaign | undefined> {
    return this.campaigns.get(id);
  }

  // ── Tags ─────────────────────────────────────────────────

  async addTag(contactId: string, tag: string): Promise<CRMContact> {
    const existing = this.contacts.get(contactId);
    if (!existing) {
      throw new Error(`Contact ${contactId} not found`);
    }
    if (existing.tags.includes(tag)) {
      return existing;
    }
    const updated: CRMContact = {
      ...existing,
      tags: [...existing.tags, tag],
      updatedAt: Date.now(),
    };
    this.contacts.set(contactId, updated);
    return updated;
  }

  async removeTag(contactId: string, tag: string): Promise<CRMContact> {
    const existing = this.contacts.get(contactId);
    if (!existing) {
      throw new Error(`Contact ${contactId} not found`);
    }
    const updated: CRMContact = {
      ...existing,
      tags: existing.tags.filter((t: string) => t !== tag),
      updatedAt: Date.now(),
    };
    this.contacts.set(contactId, updated);
    return updated;
  }

  // ── Test Helpers (not part of CRMProvider interface) ──────

  /** Directly set campaign state (for tests). */
  async updateCampaign(id: string, changes: Partial<CRMCampaign>): Promise<CRMCampaign> {
    const existing = this.campaigns.get(id);
    if (!existing) throw new Error(`Campaign ${id} not found`);
    const updated: CRMCampaign = { ...existing, ...changes, id: existing.id, updatedAt: Date.now() };
    this.campaigns.set(id, updated);
    return updated;
  }

  /** Directly set opportunity state (for tests). */
  async updateOpportunity(id: string, changes: Partial<CRMOpportunity>): Promise<CRMOpportunity> {
    const existing = this.opportunities.get(id);
    if (!existing) throw new Error(`Opportunity ${id} not found`);
    const updated: CRMOpportunity = { ...existing, ...changes, id: existing.id, updatedAt: Date.now() };
    this.opportunities.set(id, updated);
    return updated;
  }

  clear(): void {
    this.contacts.clear();
    this.opportunities.clear();
    this.pipelines.clear();
    this.campaigns.clear();
    this.providerIndex.clear();
  }
}
