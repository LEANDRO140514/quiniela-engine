// ── Canonical Engine Lifecycle Contract ──────────────────
//
// Every engine that participates in governed runtime
// composition MUST expose lifecycle state and start/stop
// semantics per this contract.
//
// Constitutional observations: #10, #11, #23, #24, #25, #26
//
// Lifecycle states:
//   UNINITIALIZED  — Post-constructor. start() not yet called.
//   INITIALIZING   — start() called. Async setup in progress.
//   READY          — execute() is safe to call.
//   STOPPING       — stop() called. Draining in-flight execute().
//   STOPPED        — All resources released. Terminal.
//   FAILED         — Unrecoverable error. Recoverable via start().
//
// Transitional default (engines without lifecycle):
//   Implicitly READY. Backward compatible with RT-3 engines.

export type LifecycleState =
  | 'UNINITIALIZED'
  | 'INITIALIZING'
  | 'READY'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED';

export interface LifecycleError {
  readonly error: 'lifecycle_failed';
  readonly reason: string;
  readonly fromState: LifecycleState;
  readonly targetState: LifecycleState;
  readonly cause?: unknown;
}

export interface EngineLifecycle {
  readonly lifecycleState: LifecycleState;
  start(): Promise<void>;
  stop(): Promise<void>;
}
