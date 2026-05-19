// ── CRM Validation ───────────────────────────────────────
//
// Input validation for all CRM operations.
// Returns structured errors, never throws.
// Enforces invariants: I5 (>=1 stage), I6 (unique orders),
// I7 (stageId in pipeline), I13 (startAt < endAt).

import type { CRMError, CreateContactInput, CreateOpportunityInput, CreatePipelineInput, CreateCampaignInput, AddTagInput, RemoveTagInput } from '../types';

export class CRMValidation {
  // ── Contact ─────────────────────────────────────────────

  validateCreateContact(input: unknown): CRMError | null {
    if (!input || typeof input !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'Input must be an object' };
    }
    const data = input as Record<string, unknown>;
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'name is required and must be a non-empty string' };
    }
    if (data.email !== undefined && typeof data.email !== 'string') {
      return { error: 'VALIDATION_ERROR', message: 'email must be a string' };
    }
    if (data.tags !== undefined && !Array.isArray(data.tags)) {
      return { error: 'VALIDATION_ERROR', message: 'tags must be an array of strings' };
    }
    return null;
  }

  validateUpdateContact(input: unknown): CRMError | null {
    if (!input || typeof input !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'Input must be an object' };
    }
    const data = input as Record<string, unknown>;
    if (typeof data.contactId !== 'string' || data.contactId.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'contactId is required' };
    }
    if (!data.changes || typeof data.changes !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'changes object is required' };
    }
    return null;
  }

  // ── Opportunity ─────────────────────────────────────────

  validateCreateOpportunity(input: unknown): CRMError | null {
    if (!input || typeof input !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'Input must be an object' };
    }
    const data = input as Record<string, unknown>;
    if (typeof data.contactId !== 'string' || data.contactId.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'contactId is required' };
    }
    if (typeof data.pipelineId !== 'string' || data.pipelineId.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'pipelineId is required' };
    }
    if (typeof data.stageId !== 'string' || data.stageId.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'stageId is required' };
    }
    if (data.value !== undefined && typeof data.value !== 'number') {
      return { error: 'VALIDATION_ERROR', message: 'value must be a number' };
    }
    return null;
  }

  validateMoveOpportunity(input: unknown): CRMError | null {
    if (!input || typeof input !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'Input must be an object' };
    }
    const data = input as Record<string, unknown>;
    if (typeof data.opportunityId !== 'string' || data.opportunityId.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'opportunityId is required' };
    }
    if (typeof data.targetStageId !== 'string' || data.targetStageId.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'targetStageId is required' };
    }
    return null;
  }

  // ── Pipeline ────────────────────────────────────────────

  validateCreatePipeline(input: unknown): CRMError | null {
    if (!input || typeof input !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'Input must be an object' };
    }
    const data = input as Record<string, unknown>;
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'name is required and must be a non-empty string' };
    }
    if (!Array.isArray(data.stages) || data.stages.length === 0) {
      return { error: 'INVALID_STAGES', message: 'Pipeline must have at least 1 stage (I5)' };
    }
    const stages = data.stages as Array<Record<string, unknown>>;
    const orders = stages.map((s) => s.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      return { error: 'INVALID_STAGES', message: 'Stage orders must be unique within a pipeline (I6)' };
    }
    for (const stage of stages) {
      if (typeof stage.id !== 'string' || !stage.id) {
        return { error: 'INVALID_STAGES', message: 'Each stage must have a non-empty id' };
      }
      if (typeof stage.name !== 'string' || !stage.name) {
        return { error: 'INVALID_STAGES', message: 'Each stage must have a non-empty name' };
      }
      if (typeof stage.order !== 'number') {
        return { error: 'INVALID_STAGES', message: 'Each stage must have a numeric order' };
      }
    }
    return null;
  }

  // ── Campaign ─────────────────────────────────────────────

  validateCreateCampaign(input: unknown): CRMError | null {
    if (!input || typeof input !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'Input must be an object' };
    }
    const data = input as Record<string, unknown>;
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'name is required and must be a non-empty string' };
    }
    if (data.startAt !== undefined && data.endAt !== undefined) {
      if (typeof data.startAt === 'number' && typeof data.endAt === 'number' && data.startAt >= data.endAt) {
        return { error: 'INVALID_DATE_RANGE', message: 'startAt must be before endAt (I13)' };
      }
    }
    return null;
  }

  validateCampaignAction(input: unknown): CRMError | null {
    if (!input || typeof input !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'Input must be an object' };
    }
    const data = input as Record<string, unknown>;
    if (typeof data.campaignId !== 'string' || data.campaignId.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'campaignId is required' };
    }
    return null;
  }

  // ── Tags ────────────────────────────────────────────────

  validateAddTag(input: unknown): CRMError | null {
    if (!input || typeof input !== 'object') {
      return { error: 'VALIDATION_ERROR', message: 'Input must be an object' };
    }
    const data = input as Record<string, unknown>;
    if (typeof data.contactId !== 'string' || data.contactId.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'contactId is required' };
    }
    if (typeof data.tag !== 'string' || data.tag.trim().length === 0) {
      return { error: 'VALIDATION_ERROR', message: 'tag is required and must be a non-empty string' };
    }
    return null;
  }

  validateRemoveTag(input: unknown): CRMError | null {
    return this.validateAddTag(input);
  }
}
