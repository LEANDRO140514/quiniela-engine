// ── Canonical Execution Context ─────────────────────────
//
// Wraps a single workflow execution. Created by the orchestrator,
// consumed by every engine participating in a workflow step.

import type { ExecutionId, WorkflowId, ConversationId, TenantId } from '../ids/EntityId';

export interface ExecutionContext {
  /** Unique execution ID (exec_ prefix) */
  executionId: ExecutionId;

  /** Workflow being executed (wf_ prefix) */
  workflowId: WorkflowId;

  /** Parent conversation */
  conversationId?: ConversationId;

  /** Tenant scope */
  tenantId?: TenantId;

  /** Vertical domain */
  verticalId?: string;

  /** Current state-machine state name */
  currentState: string;

  /** Previous state-machine state name */
  previousState?: string;

  /** Input payload that triggered this execution */
  input: Record<string, unknown>;

  /** Mutable state bag shared across steps */
  state: Record<string, unknown>;

  /** Correlation ID tying events of this execution together */
  correlationId?: string;

  /** Unix ms when execution started */
  startedAt: number;

  /** Unix ms of last update */
  updatedAt: number;
}

export function createExecutionContext(
  overrides: Partial<ExecutionContext> = {},
): ExecutionContext {
  const now = Date.now();
  return {
    executionId: overrides.executionId ?? ('exec_unknown' as ExecutionId),
    workflowId: overrides.workflowId ?? ('wfl_unknown' as WorkflowId),
    currentState: overrides.currentState ?? 'idle',
    input: overrides.input ?? {},
    state: overrides.state ?? {},
    startedAt: overrides.startedAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    conversationId: overrides.conversationId,
    tenantId: overrides.tenantId,
    verticalId: overrides.verticalId,
    previousState: overrides.previousState,
    correlationId: overrides.correlationId,
  };
}
