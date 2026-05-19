// ── CRM Event Factories ───────────────────────────────────
//
// Every CRM state mutation emits a DomainEvent (invariant I20).
// Events conform to the canonical DomainEvent from @curdeeclau/shared.

import { createDomainEvent } from '@curdeeclau/shared';
import type { DomainEvent, CRMContact, CRMOpportunity, CRMPipeline, CRMCampaign } from '@curdeeclau/shared';
import type { CRMEngineContext } from '../types';

// ── Helpers ───────────────────────────────────────────────

function eventOverrides(context: CRMEngineContext, overrides: Partial<DomainEvent> = {}): Partial<DomainEvent> {
  return {
    tenantId: context.tenantId,
    conversationId: context.conversationId,
    workflowId: context.workflowId,
    correlationId: context.correlationId,
    causationId: context.causationId,
    actorId: context.actorId ?? 'crm-engine',
    verticalId: context.verticalId,
    ...overrides,
  };
}

// ── Contact Events ────────────────────────────────────────

export function contactCreated(contact: CRMContact, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('ContactCreated', eventOverrides(context, {
    payload: { contact },
  }));
}

export function contactUpdated(contactId: string, changes: Partial<CRMContact>, previous: CRMContact, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('ContactUpdated', eventOverrides(context, {
    payload: { contactId, changes, previous },
  }));
}

// ── Opportunity Events ────────────────────────────────────

export function opportunityCreated(opportunity: CRMOpportunity, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('OpportunityCreated', eventOverrides(context, {
    payload: { opportunity },
  }));
}

export function opportunityMoved(opportunityId: string, fromStage: string, toStage: string, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('OpportunityMoved', eventOverrides(context, {
    payload: { opportunityId, fromStage, toStage },
  }));
}

// ── Tag Events ────────────────────────────────────────────

export function tagAdded(contactId: string, tag: string, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('TagAdded', eventOverrides(context, {
    payload: { contactId, tag },
  }));
}

export function tagRemoved(contactId: string, tag: string, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('TagRemoved', eventOverrides(context, {
    payload: { contactId, tag },
  }));
}

// ── Pipeline Events ───────────────────────────────────────

export function pipelineCreated(pipeline: CRMPipeline, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('PipelineCreated', eventOverrides(context, {
    payload: { pipeline },
  }));
}

// ── Campaign Events ───────────────────────────────────────

export function campaignCreated(campaign: CRMCampaign, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('CampaignCreated', eventOverrides(context, {
    payload: { campaign },
  }));
}

export function campaignPaused(campaignId: string, pausedAt: number, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('CampaignPaused', eventOverrides(context, {
    payload: { campaignId, pausedAt },
  }));
}

export function campaignResumed(campaignId: string, resumedAt: number, context: CRMEngineContext): DomainEvent {
  return createDomainEvent('CampaignResumed', eventOverrides(context, {
    payload: { campaignId, resumedAt },
  }));
}
