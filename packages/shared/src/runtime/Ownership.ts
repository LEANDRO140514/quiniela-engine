// ── Canonical Ownership Model ───────────────────────────
//
// Governs who controls a conversation at any point in time.
// This is the source of truth for ownership across ALL engines.
//
// States:
//   AI      — AI agent is in full control (default)
//   HUMAN   — Human operator has taken over
//   SHARED  — AI and human co-pilot (AI suggests, human decides)
//   LOCKED  — Ownership frozen; no transfers allowed (legal hold, audit)
//
// RT-4 Propagation (Constitutional observations: #13–#22):
//   Ownership is authoritative runtime state (#14).
//   Propagation is event-driven (#15), serialized + monotonic (#16).
//   Orchestrator is single-writer per conversation (#18).
//   Engines maintain local execution-authoritative views (#19).
//   Ownership scope is strictly conversation-level (#20).
//   Every transition carries minimal causal attribution (#22).

export type ConversationOwner = 'AI' | 'HUMAN' | 'SHARED' | 'LOCKED';

// ── RT-4: Causal Attribution ────────────────────────────

/**
 * Why ownership changed. Every OwnershipChanged event
 * must carry a cause value (#22).
 */
export type OwnershipChangeCause =
  | 'system_init'            // Initial ownership on conversation creation
  | 'handoff_accepted'       // Human accepted handoff transfer
  | 'handoff_rejected'       // Human rejected handoff → AI resumes
  | 'supervisor_takeover'    // External supervisor forcibly took control
  | 'supervisor_release'     // External supervisor returned control to AI
  | 'co_pilot_activated'     // SHARED mode activated
  | 'co_pilot_deactivated'   // SHARED mode deactivated
  | 'escalation'             // Workflow escalation suspended authority
  | 'escalation_resolved'    // Escalation resolved without ownership change
  | 'compliance_lock'        // Legal/compliance → LOCKED
  | 'compliance_unlock';     // Defined for future use. No transition out of LOCKED in RT-4.

// ── Ownership Record ────────────────────────────────────

export interface OwnershipRecord {
  readonly conversationId: string;
  readonly owner: ConversationOwner;
  readonly previousOwner?: ConversationOwner;
  /** RT-4: Monotonic sequence number per conversation (#16). Optional for backward compat. */
  readonly sequence?: number;
  /** RT-4: Why ownership changed (#22). Optional for backward compat. */
  readonly cause?: OwnershipChangeCause;
  readonly changedAt: number;
  readonly changedBy?: string;
  readonly reason?: string;
}

/**
 * RT-4: Payload shape for OwnershipChanged domain events.
 * Narrower than OwnershipRecord — sequence and cause are required
 * for propagation events emitted by the single-writer orchestrator (#18).
 */
export interface OwnershipChangedPayload {
  readonly conversationId: string;
  readonly owner: ConversationOwner;
  readonly previousOwner: ConversationOwner | null;
  readonly sequence: number;
  readonly cause: OwnershipChangeCause;
  readonly changedAt: number;
  readonly initiatedBy?: string;
  readonly workflowId?: string;
  readonly reason?: string;
}

// ── Factories & Validators ──────────────────────────────

export function createOwnershipRecord(
  conversationId: string,
  owner: ConversationOwner,
  overrides: Partial<Omit<OwnershipRecord, 'conversationId' | 'owner'>> = {},
): OwnershipRecord {
  return {
    conversationId,
    owner,
    changedAt: overrides.changedAt ?? Date.now(),
    previousOwner: overrides.previousOwner,
    sequence: overrides.sequence,
    cause: overrides.cause,
    changedBy: overrides.changedBy,
    reason: overrides.reason,
  };
}

/**
 * Validates basic ownership transition rules.
 * Preserved for backward compatibility.
 *
 * For RT-4 cause-aware validation, use validateOwnershipTransition.
 */
export function isTransferAllowed(from: ConversationOwner, to: ConversationOwner): boolean {
  if (from === 'LOCKED' || to === 'LOCKED') return false;
  if (from === to) return false;
  return true;
}

/**
 * RT-4: Cause-aware ownership transition validation.
 *
 * Extends isTransferAllowed with:
 *   - LOCKED is absorbing (outbound transitions always invalid)
 *   - → LOCKED transitions are valid (compliance_lock)
 *   - Identity transitions (X → X) are always invalid
 *   - Non-LOCKED → non-LOCKED transitions are valid
 */
export function validateOwnershipTransition(
  from: ConversationOwner,
  to: ConversationOwner,
): boolean {
  if (from === 'LOCKED') return false;        // Absorbing — can't transition out
  if (from === to) return false;              // Identity no-op
  if (to === 'LOCKED') return true;           // Any → LOCKED is valid (compliance_lock)
  return true;                                // AI ⇄ HUMAN ⇄ SHARED
}
