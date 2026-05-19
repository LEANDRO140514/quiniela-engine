# Runtime Semantics

## Core Principle

> **Every state transition is explicit, observable, and recoverable.**

Algorithmus Platform governs conversational AI at runtime. This document defines the semantics that ALL engines must follow.

## Lifecycle Semantics

### State Transition Model

```
State(current) + Event(trigger) → State(next) + SideEffect(event emitted)
```

Every state transition is:
1. **Validated** — is this transition allowed from the current state?
2. **Executed** — the engine performs the action
3. **Recorded** — a `DomainEvent` is emitted with `correlationId` and `causationId`
4. **Observable** — the event is dispatched to all registered handlers

### State Categories

| Category | Description | Example |
|---|---|---|
| **Initial** | Starting state when entity/engine is created | `idle`, `draft`, `AI_ACTIVE` |
| **Transient** | Temporary state during processing | `buffering`, `HANDOFF_PENDING`, `AI_RECOVERY_PENDING` |
| **Active** | Normal operational state | `HUMAN_ACTIVE`, `active` |
| **Terminal** | Cannot transition further (except via recovery) | `won`, `lost`, `HANDOFF_CLOSED` |
| **Recovery** | Special path back from terminal or error states | `AI_RESTORED` |

### State Transition Rules

1. Initial → Transient: always allowed
2. Transient → Active: requires successful completion
3. Active → Terminal: requires explicit action (win, lose, close)
4. Terminal → Active: requires explicit recovery (not automatic)
5. Any → LOCKED: requires ownership freeze (legal/audit)

## Failure Modes

### Structured Error Responses

Engines NEVER throw exceptions for business logic errors. They return structured error results:

```typescript
// Success
{ contact: CRMContact }

// Error
{ error: "ERROR_CODE", message: "Human-readable description" }
```

### Error Categories

| Category | Example Codes | Handling |
|---|---|---|
| **Not Found** | `CONTACT_NOT_FOUND`, `PIPELINE_NOT_FOUND` | Return error, workflow can retry or escalate |
| **Invalid State** | `INVALID_STAGE_TRANSITION`, `CAMPAIGN_ARCHIVED` | Return error, workflow escalates to human |
| **Permission** | `OWNERSHIP_LOCKED`, `OWNERSHIP_INSUFFICIENT` | Return error, workflow waits for ownership change |
| **Provider** | `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT` | Return error, workflow retries with backoff |
| **Validation** | `INVALID_STAGES`, `DUPLICATE_PROVIDER_ID` | Return error, workflow corrects input |

### Retry Philosophy

- Deterministic errors (invalid state, permission) → NEVER retry
- Transient errors (provider unavailable, timeout) → Retry with backoff
- Max retries: 3, with exponential backoff (1s, 4s, 16s)
- After max retries: escalate to human via handoff-engine

## Side Effects

### Allowed Side Effects

- Emitting `DomainEvent` via `emitFn`
- Updating in-memory state (Maps)
- Calling provider adapter methods
- Scheduling timers (debounce, auto-recovery)

### Prohibited Side Effects

- Direct filesystem I/O (use provider abstraction)
- Direct HTTP calls (use provider adapter)
- Modifying another engine's state directly (go through orchestrator)
- Logging sensitive data (PII, secrets)

## Orchestration Semantics

### Engine Execution Model

```
workflow-orchestrator
  → resolves workflow step
    → resolves engine by name
      → calls engine.execute(action, context)
        → engine validates ownership
        → engine validates invariants
        → engine performs operation
        → engine emits event
        → engine returns result
      → orchestrator records step result
    → orchestrator resolves next state
  → orchestrator proceeds to next step
```

### Context Propagation

Every `execute()` call receives a context that carries:

```typescript
{
  conversationId?: string;   // For ownership resolution
  workflowId?: string;       // For event correlation
  executionId?: string;      // For tracing
  correlationId?: string;    // Ties events in this execution
  tenantId?: string;         // For tenant scoping
  actorId?: string;          // Who triggered this action
  state: Record<string, unknown>;  // Workflow state bag
}
```

The engine MUST return the result with sufficient detail for the next workflow step to consume.

## Recovery Semantics

### Recovery Paths

1. **AI → HUMAN → AI:** handoff-engine's `recover()` flow
2. **Error → Recovery:** workflow step retry or fallback
3. **Terminal → Active:** explicit recovery action (e.g., reopen opportunity)
4. **LOCKED → AI/HUMAN:** requires explicit unlock (legal/audit approval)

### Recovery Invariants

- Recovery MUST emit events: `AIRecoveryStarted`, `AIRecovered`
- Recovery MUST restore ownership to a valid state
- Recovery MUST deactivate suppression (return to `NONE`)
- Recovery MUST NOT silently revert state changes

## Deterministic Orchestration

Algorithmus Platform is **deterministic-first**:

1. Same inputs → same outputs (engines are pure-ish)
2. State transitions are rule-based, not probabilistic
3. AI may classify, suggest, or enrich — but never decide state transitions
4. Events are the **only** side effect channel
5. Workflows are explicit DAGs, not autonomous agent loops
