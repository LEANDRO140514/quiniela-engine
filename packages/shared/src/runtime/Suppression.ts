// ── Canonical Suppression Model ─────────────────────────
//
// Governs what the AI agent is allowed to do during human-handoff.
// This is the source of truth for suppression across ALL engines.
//
// Modes:
//   NONE              — AI operates normally (default)
//   SILENT_OBSERVER   — AI watches but produces no output
//   ASSIST_MODE       — AI can suggest responses but cannot send them
//   FULL_SUPPRESSION  — AI is completely silenced (emergency, legal)

export type SuppressionMode =
  | 'NONE'
  | 'SILENT_OBSERVER'
  | 'ASSIST_MODE'
  | 'FULL_SUPPRESSION';

export interface SuppressionPermissions {
  canRespond: boolean;
  canSuggest: boolean;
  canObserve: boolean;
  canAct: boolean;
}

export const SUPPRESSION_MATRIX: Record<SuppressionMode, SuppressionPermissions> = {
  NONE:              { canRespond: true,  canSuggest: true,  canObserve: true,  canAct: true },
  SILENT_OBSERVER:   { canRespond: false, canSuggest: false, canObserve: true,  canAct: false },
  ASSIST_MODE:       { canRespond: false, canSuggest: true,  canObserve: true,  canAct: false },
  FULL_SUPPRESSION:  { canRespond: false, canSuggest: false, canObserve: false, canAct: false },
};

export interface SuppressionRecord {
  conversationId: string;
  mode: SuppressionMode;
  previousMode?: SuppressionMode;
  activatedAt: number;
  activatedBy?: string;
  reason?: string;
}

export function createSuppressionRecord(
  conversationId: string,
  mode: SuppressionMode,
  overrides: Partial<Omit<SuppressionRecord, 'conversationId' | 'mode'>> = {},
): SuppressionRecord {
  return {
    conversationId,
    mode,
    activatedAt: overrides.activatedAt ?? Date.now(),
    previousMode: overrides.previousMode,
    activatedBy: overrides.activatedBy,
    reason: overrides.reason,
  };
}

export function getPermissions(mode: SuppressionMode): SuppressionPermissions {
  return SUPPRESSION_MATRIX[mode];
}
