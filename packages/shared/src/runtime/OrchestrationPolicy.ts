// ── Canonical Orchestration Policy Contract ──────────────
//
// Declarative policy for workflow failure governance.
// Policy is data, not executable logic.
// The orchestrator interprets this policy at failure points.
//
// Constitutional observations: #12, #13, #29
//
// Policy is immutable during workflow execution.
// Each workflow may declare its own policy.
// Workflows without explicit policy use DEFAULT_ORCHESTRATION_POLICY.

/** Strategy when a step fails after retry exhaustion with no valid fallback */
export type StepExhaustionStrategy = 'abort' | 'skip' | 'escalate';

/** Strategy when an engine enters FAILED state mid-workflow */
export type EngineFailureStrategy = 'abort' | 'degrade' | 'escalate';

/** Strategy when a step's upstream dependency has failed */
export type DependencyFailureStrategy = 'abort' | 'skip_dependents';

export interface OrchestrationPolicy {
  readonly onStepExhaustion: StepExhaustionStrategy;
  readonly onEngineFailure: EngineFailureStrategy;
  readonly onDependencyFailure: DependencyFailureStrategy;
}

export const DEFAULT_ORCHESTRATION_POLICY: OrchestrationPolicy = {
  onStepExhaustion: 'abort',
  onEngineFailure: 'abort',
  onDependencyFailure: 'abort',
};
