// ── Opportunity Manager ──────────────────────────────────
//
// Enforces opportunity invariants:
//   I9:  contactId MUST reference an existing contact
//   I10: pipelineId MUST reference an existing pipeline
//   I11: Status 'won', 'lost', 'abandoned' are TERMINAL
//   I12: stageId on creation MUST be a valid stage in the pipeline

import type { CRMOpportunity } from '@curdeeclau/shared';
import type { CRMProvider, CRMError, CRMEngineContext, CreateOpportunityInput, MoveOpportunityInput } from '../types';
import type { CRMEventEmitter } from '../runtime/CRMEventEmitter';

const TERMINAL_STATUSES = new Set(['won', 'lost', 'abandoned']);

export class OpportunityManager {
  constructor(
    private provider: CRMProvider,
    private events: CRMEventEmitter,
  ) {}

  async create(input: CreateOpportunityInput, context: CRMEngineContext): Promise<{ opportunity: CRMOpportunity } | CRMError> {
    // I9: contact must exist
    const contact = await this.provider.getContact(input.contactId);
    if (!contact) {
      return { error: 'CONTACT_NOT_FOUND', message: `Contact ${input.contactId} does not exist (I9)` };
    }

    // I10: pipeline must exist
    const pipeline = await this.provider.getPipeline(input.pipelineId);
    if (!pipeline) {
      return { error: 'PIPELINE_NOT_FOUND', message: `Pipeline ${input.pipelineId} does not exist (I10)` };
    }

    // I12: stageId must be a valid stage in the pipeline
    const stage = pipeline.stages.find((s: { id: string }) => s.id === input.stageId);
    if (!stage) {
      return { error: 'INVALID_STAGE', message: `Stage "${input.stageId}" is not in pipeline "${pipeline.name}" (${input.pipelineId})` };
    }

    const opportunity = await this.provider.createOpportunity(input);
    this.events.emitOpportunityCreated(opportunity, context);
    return { opportunity };
  }

  async move(input: MoveOpportunityInput, context: CRMEngineContext): Promise<{ opportunity: CRMOpportunity } | CRMError> {
    const opportunity = await this.provider.getOpportunity(input.opportunityId);
    if (!opportunity) {
      return { error: 'OPPORTUNITY_NOT_FOUND', message: `Opportunity ${input.opportunityId} does not exist` };
    }

    // I11: terminal check
    if (TERMINAL_STATUSES.has(opportunity.status)) {
      return { error: 'OPPORTUNITY_TERMINAL', message: `Opportunity ${input.opportunityId} has terminal status "${opportunity.status}" — cannot move (I11)` };
    }

    // Validate target stage exists in pipeline
    const pipeline = await this.provider.getPipeline(opportunity.pipelineId);
    if (!pipeline) {
      return { error: 'PIPELINE_NOT_FOUND', message: `Pipeline ${opportunity.pipelineId} no longer exists` };
    }
    const targetStage = pipeline.stages.find((s: { id: string }) => s.id === input.targetStageId);
    if (!targetStage) {
      return { error: 'INVALID_STAGE_TRANSITION', message: `Target stage "${input.targetStageId}" is not in pipeline "${pipeline.name}"` };
    }

    const fromStage = opportunity.stageId;
    const updated = await this.provider.moveOpportunity(input.opportunityId, input.targetStageId);
    this.events.emitOpportunityMoved(input.opportunityId, fromStage, input.targetStageId, context);
    return { opportunity: updated };
  }
}
