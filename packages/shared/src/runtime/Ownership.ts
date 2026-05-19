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

export type ConversationOwner = 'AI' | 'HUMAN' | 'SHARED' | 'LOCKED';

export interface OwnershipRecord {
  conversationId: string;
  owner: ConversationOwner;
  previousOwner?: ConversationOwner;
  changedAt: number;
  changedBy?: string;
  reason?: string;
}

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
    changedBy: overrides.changedBy,
    reason: overrides.reason,
  };
}

export function isTransferAllowed(from: ConversationOwner, to: ConversationOwner): boolean {
  if (from === 'LOCKED' || to === 'LOCKED') return false;
  if (from === to) return false;
  return true;
}
