// ── Engine ────────────────────────────────────────────
export { HandoffEngine } from './engine/HandoffEngine';

// ── Managers ───────────────────────────────────────────
export { HandoffPolicyEvaluator } from './policies/HandoffPolicyEvaluator';
export { OwnershipManager } from './ownership/OwnershipManager';
export { SuppressionManager } from './suppression/SuppressionManager';
export { RecoveryManager } from './recovery/RecoveryManager';

// ── Events ─────────────────────────────────────────────
export {
  handoffRequested,
  handoffAccepted,
  handoffRejected,
  ownershipChanged,
  suppressionActivated,
  aiRecoveryStarted,
  aiRecovered,
  handoffClosed,
} from './events/HandoffEvents';

// ── Types ──────────────────────────────────────────────
export type {
  DomainEvent,
  ConversationOwner,
  SuppressionMode,
  HandoffState,
  HandoffTrigger,
  HandoffEventType,
  HandoffEventPayload,
  HandoffCondition,
  HandoffTarget,
  HandoffChannel,
  AvailabilityWindow,
  HandoffRule,
  HandoffPolicySet,
  HandoffRequest,
  HandoffResult,
  HandoffEngineConfig,
  ConversationHandoffState,
  HandoffEvalContext,
  HandoffEngineInterface,
} from './types';

export type { SuppressionPermissions } from './suppression/SuppressionManager';
export type { RecoveryResult } from './recovery/RecoveryManager';
