// ── Pipeline Manager ─────────────────────────────────────
//
// Enforces pipeline invariants:
//   I5: Pipeline must have at least 1 stage
//   I6: Stage orders must be unique
//   I8: Deactivating must not delete opportunities (not implemented here)

import type { CRMPipeline } from '@curdeeclau/shared';
import type { CRMProvider, CRMError, CRMEngineContext, CreatePipelineInput } from '../types';
import type { CRMEventEmitter } from '../runtime/CRMEventEmitter';

export class PipelineManager {
  constructor(
    private provider: CRMProvider,
    private events: CRMEventEmitter,
  ) {}

  async create(input: CreatePipelineInput, context: CRMEngineContext): Promise<{ pipeline: CRMPipeline } | CRMError> {
    // Validate stages
    if (!input.stages || input.stages.length === 0) {
      return { error: 'INVALID_STAGES', message: 'Pipeline must have at least 1 stage (I5)' };
    }
    const orders = input.stages.map((s) => s.order);
    if (new Set(orders).size !== orders.length) {
      return { error: 'INVALID_STAGES', message: 'Stage orders must be unique within a pipeline (I6)' };
    }

    const pipeline = await this.provider.createPipeline(input);
    this.events.emitPipelineCreated(pipeline, context);
    return { pipeline };
  }
}
