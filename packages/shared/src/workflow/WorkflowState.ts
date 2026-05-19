// ── Canonical Workflow State ────────────────────────────
//
// Minimal state-machine state contract.
// Compatible with workflow-orchestrator's StateMachine model.

import type { WorkflowId } from '../ids/EntityId';

export interface StateTransition {
  event: string;
  target: string;
}

export interface WorkflowStateDefinition {
  name: string;
  description?: string;
  transitions: StateTransition[];
}

export interface CanonicalWorkflowState {
  /** Workflow this state belongs to (wf_ prefix) */
  workflowId: WorkflowId;

  /** Current state name */
  currentState: string;

  /** Previous state name */
  previousState?: string;

  /** Unix ms when current state was entered */
  enteredAt: number;

  /** Unix ms when previous state was exited */
  exitedAt?: number;

  /** How many times this state has been entered */
  visitCount: number;

  /** Extension point */
  metadata: Record<string, unknown>;
}

export function createWorkflowState(
  workflowId: WorkflowId,
  currentState: string,
  overrides: Partial<Omit<CanonicalWorkflowState, 'workflowId' | 'currentState'>> = {},
): CanonicalWorkflowState {
  const now = Date.now();
  return {
    workflowId,
    currentState,
    enteredAt: overrides.enteredAt ?? now,
    visitCount: overrides.visitCount ?? 1,
    metadata: overrides.metadata ?? {},
    previousState: overrides.previousState,
    exitedAt: overrides.exitedAt,
  };
}
