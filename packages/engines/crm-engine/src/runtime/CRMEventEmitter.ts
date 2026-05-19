// ── CRM Event Emitter ────────────────────────────────────
//
// Centralized event emission for the CRM engine.
// Every CRM state mutation emits a DomainEvent (invariant I20).
// Events carry correlationId and causationId for causal chains (I21, I22).

import type { DomainEvent } from '@curdeeclau/shared';
import type { CRMEngineContext } from '../types';
import * as events from '../events/CRMEvents';
import type { CRMContact, CRMOpportunity, CRMPipeline, CRMCampaign } from '@curdeeclau/shared';

export type EventHandler = (event: DomainEvent) => void;

export class CRMEventEmitter {
  private handlers: EventHandler[] = [];
  private emitted: DomainEvent[] = [];

  /** Registers an external event listener. */
  onEvent(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  /** Returns all events emitted in this session (for testing). */
  getEmitted(): ReadonlyArray<DomainEvent> {
    return this.emitted;
  }

  /** Clears the event log. */
  clear(): void {
    this.emitted = [];
  }

  // ── Emit Methods ──────────────────────────────────────

  emitContactCreated(contact: CRMContact, context: CRMEngineContext): DomainEvent {
    const event = events.contactCreated(contact, context);
    this.dispatch(event);
    return event;
  }

  emitContactUpdated(contactId: string, changes: Partial<CRMContact>, previous: CRMContact, context: CRMEngineContext): DomainEvent {
    const event = events.contactUpdated(contactId, changes, previous, context);
    this.dispatch(event);
    return event;
  }

  emitOpportunityCreated(opportunity: CRMOpportunity, context: CRMEngineContext): DomainEvent {
    const event = events.opportunityCreated(opportunity, context);
    this.dispatch(event);
    return event;
  }

  emitOpportunityMoved(opportunityId: string, fromStage: string, toStage: string, context: CRMEngineContext): DomainEvent {
    const event = events.opportunityMoved(opportunityId, fromStage, toStage, context);
    this.dispatch(event);
    return event;
  }

  emitTagAdded(contactId: string, tag: string, context: CRMEngineContext): DomainEvent {
    const event = events.tagAdded(contactId, tag, context);
    this.dispatch(event);
    return event;
  }

  emitTagRemoved(contactId: string, tag: string, context: CRMEngineContext): DomainEvent {
    const event = events.tagRemoved(contactId, tag, context);
    this.dispatch(event);
    return event;
  }

  emitPipelineCreated(pipeline: CRMPipeline, context: CRMEngineContext): DomainEvent {
    const event = events.pipelineCreated(pipeline, context);
    this.dispatch(event);
    return event;
  }

  emitCampaignCreated(campaign: CRMCampaign, context: CRMEngineContext): DomainEvent {
    const event = events.campaignCreated(campaign, context);
    this.dispatch(event);
    return event;
  }

  emitCampaignPaused(campaignId: string, pausedAt: number, context: CRMEngineContext): DomainEvent {
    const event = events.campaignPaused(campaignId, pausedAt, context);
    this.dispatch(event);
    return event;
  }

  emitCampaignResumed(campaignId: string, resumedAt: number, context: CRMEngineContext): DomainEvent {
    const event = events.campaignResumed(campaignId, resumedAt, context);
    this.dispatch(event);
    return event;
  }

  // ── Internal ─────────────────────────────────────────

  private dispatch(event: DomainEvent): void {
    this.emitted.push(event);
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch {
        // Handlers must not break the engine
      }
    }
  }
}
