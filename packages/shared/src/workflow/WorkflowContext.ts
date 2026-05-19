// ── Canonical Workflow Context ──────────────────────────
//
// The runtime shape that flows through every workflow execution.
// Aligned with workflow-orchestrator's WorkflowContext but defined
// here as the canonical contract so all engines share one definition.

import type { WorkflowId, ExecutionId, TenantId } from '../ids/EntityId';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface StepResult {
  stepId: string;
  stepName: string;
  status: StepStatus;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: number;
  completedAt?: number;
  attempts: number;
}

export interface CanonicalWorkflowContext {
  /** Workflow being executed (wf_ prefix) */
  workflowId: WorkflowId;

  /** Unique execution ID (exec_ prefix) */
  executionId: ExecutionId;

  /** Tenant scope */
  tenantId?: TenantId;

  /** Vertical domain */
  verticalId?: string;

  /** Current state-machine state */
  currentState: string;

  /** Previous state-machine state */
  previousState?: string;

  /** Input payload */
  input: Record<string, unknown>;

  /** Mutable state bag */
  state: Record<string, unknown>;

  /** Step results in execution order */
  steps: StepResult[];

  /** Unix ms when execution started */
  startedAt: number;

  /** Unix ms of last update */
  updatedAt: number;

  /** Extension point */
  metadata: Record<string, unknown>;
}

export function createWorkflowContext(
  overrides: Partial<CanonicalWorkflowContext> = {},
): CanonicalWorkflowContext {
  const now = Date.now();
  return {
    workflowId: overrides.workflowId ?? ('wfl_unknown' as WorkflowId),
    executionId: overrides.executionId ?? ('exec_unknown' as ExecutionId),
    currentState: overrides.currentState ?? 'idle',
    input: overrides.input ?? {},
    state: overrides.state ?? {},
    steps: overrides.steps ?? [],
    startedAt: overrides.startedAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata ?? {},
    tenantId: overrides.tenantId,
    verticalId: overrides.verticalId,
    previousState: overrides.previousState,
  };
}
