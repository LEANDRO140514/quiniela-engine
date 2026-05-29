// ── Canonical Runtime Lifecycle Contract ─────────────────
//
// Governs runtime operational liveness aggregation and
// deterministic lifecycle coordination.
//
// Constitutional observations: #10, #23, #24, #25, #26,
//                               #27, #28, #29, #30
//
// RuntimeLifecycle governs operational runtime liveness.
// It does NOT govern semantic correctness, ownership
// convergence, workflow completion, or autonomous recovery.
//
// RuntimeState is derived from engine lifecycle states
// and bootstrap/shutdown progression (#27).
// It is NOT independently mutable.

import type { LifecycleState } from './EngineLifecycle';

export type RuntimeState =
  | 'STARTING'   // Bootstrap in progress
  | 'ALIVE'      // All declared engines READY
  | 'DEGRADED'   // At least one declared engine not READY
  | 'STOPPING'   // Shutdown in progress
  | 'STOPPED';   // All declared engines STOPPED

export type RuntimePhase = 'bootstrap' | 'running' | 'shutdown';

export interface RuntimeLifecycle {
  /** Current derived runtime state (#27) */
  readonly state: RuntimeState;

  /** Current lifecycle phase */
  readonly phase: RuntimePhase;

  /** Per-engine lifecycle states (engineName → LifecycleState) */
  readonly engines: ReadonlyMap<string, LifecycleState>;

  /** Ordered list of declared engine names (bootstrap order per #10, #30) */
  readonly engineOrder: ReadonlyArray<string>;

  /** Unix ms when runtime started */
  readonly startedAt: number;

  /**
   * Bootstrap engines in declared order.
   * Transitions phase → 'bootstrap', state → STARTING.
   * On full success: state → ALIVE, phase → 'running'.
   * On partial/total failure: state → DEGRADED.
   */
  start(): Promise<void>;

  /**
   * Shutdown engines in reverse declared order.
   * Transitions phase → 'shutdown', state → STOPPING.
   * Calls stop() on every engine that was started.
   * On completion: state → STOPPED.
   */
  stop(): Promise<void>;
}

/**
 * Pure function. Derives RuntimeState from engine lifecycle states
 * and the current runtime phase. No side effects (#27, #31).
 */
export function deriveRuntimeState(
  engines: ReadonlyMap<string, LifecycleState>,
  phase: RuntimePhase,
): RuntimeState {
  const states = [...engines.values()];

  if (phase === 'bootstrap') {
    if (states.some((s) => s === 'FAILED')) return 'DEGRADED';
    if (states.every((s) => s === 'READY')) return 'ALIVE';
    return 'STARTING';
  }

  if (phase === 'shutdown') {
    if (states.every((s) => s === 'STOPPED' || s === 'FAILED')) return 'STOPPED';
    return 'STOPPING';
  }

  // phase === 'running'
  if (states.some((s) => s === 'FAILED')) return 'DEGRADED';
  if (states.every((s) => s === 'READY')) return 'ALIVE';
  return 'DEGRADED';
}
