// ── Canonical Engine Contract ────────────────────────────
//
// Every engine in the runtime MUST satisfy this interface.
// The workflow-orchestrator dispatches execute() calls to
// registered engines using this contract.
//
// engineName: unique, stable identifier (e.g. 'handoff-engine')
// execute:    action + context → result (never throws)

export interface Engine {
  readonly engineName: string;
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
