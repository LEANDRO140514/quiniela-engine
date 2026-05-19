# RT-1.5 Enforcement Readiness Assessment

> **Nature:** Constitutional compliance audit. Not a remediation plan.
> **RT-2 dependency:** This document gates the RT-2 Contract Consolidation phase.
> **No implementation directives.**

---

## 1. Constitutional-Critical Violations (Block RT-2)

These violations make RT-2 consolidation impossible. The contracts they break are fundamental to runtime coherence. They MUST be resolved before engine integration can proceed.

---

### V-C1: HandoffDomainEvent Parallel Universe

| Field | Value |
|---|---|
| **Location** | `handoff-engine/src/types.ts:124`, `handoff-engine/src/events/HandoffEvents.ts` |
| **Constitution** | Article V.2 (Event Shape), V.4 (Event Catalog), V.5 (Event Chain Integrity), Article X.1 (Canonical Type Redefinition) |
| **Severity** | **CRITICAL** |

**What it is:**

The handoff engine defines `HandoffDomainEvent` — a separate type with its own ID prefix (`hdevt-`), its own factory (`makeEvent`), its own payload structure, and its own emission channel (`config.emitFn`). It is structurally incompatible with the canonical `DomainEvent` from `shared/`.

**Fields present in canonical DomainEvent but MISSING from HandoffDomainEvent:**

```
causationId     ← Causal chain reconstruction impossible
actorId         ← No audit trail — who triggered this handoff?
workspaceId     ← No workspace scoping
verticalId      ← No vertical scoping
tenantId        ← No tenant scoping
metadata        ← No provider/observability extension point
```

**Fields present in HandoffDomainEvent that diverge:**

```
payload.previousOwner   ← In canonical, this would be in payload; HandoffDomainEvent bakes it into payload structure
payload.newOwner
payload.suppressionMode
payload.handoffState
```

**Emission channel divergence:**

```typescript
// HandoffDomainEvent emission (HandoffEngine.ts:423-427)
private emitAll(events: HandoffDomainEvent[]): void {
  if (!this.config.emitFn) return;     // Private callback, NOT EventDispatcher
  for (const event of events) {
    this.config.emitFn(event);          // Bypasses entire platform event bus
  }
}
```

These events NEVER enter the platform's `EventDispatcher`. The orchestrator never sees `OwnershipChanged`, `SuppressionActivated`, `HandoffRequested`, or any handoff event.

**Why it blocks RT-2:**

Ownership synchronization is the foundational runtime concern. If handoff events can't be observed by other engines, no engine can gate on ownership — they'd each need their own ownership state, creating N copies of the truth.

**Constitutional articles violated:** V.2, V.4, V.5, X.1

---

### V-C2: Orchestrator Redefines Canonical Types

| Field | Value |
|---|---|
| **Location** | `workflow-orchestrator/src/types.ts` (entire file) |
| **Constitution** | Article III.3 (Type Authority), Article V.2 (Event Shape), Article X.1 (Canonical Type Redefinition) |
| **Severity** | **CRITICAL** |

**What it is:**

The `workflow-orchestrator/src/types.ts` defines these types locally instead of importing from `@curdeeclau/shared`:

| Local Type | Canonical Equivalent in shared/ | Divergence |
|---|---|---|
| `DomainEvent` (line 3) | `shared/src/events/DomainEvent.ts` | Drops 5 fields: `workspaceId`, `causationId`, `actorId`, `verticalId`, `metadata` |
| `WorkflowContext` (line 91) | `shared/src/workflow/WorkflowContext.ts: CanonicalWorkflowContext` | Uses `vertical: string` instead of `verticalId`; adds `steps` array; drops `previousState`, `metadata` |
| `StepResult` (line 68) | `shared/src/workflow/WorkflowContext.ts: StepResult` | Structurally similar for now, but diverges under future changes to canonical |
| `StepStatus` (line 41) | `shared/src/workflow/WorkflowContext.ts: StepStatus` | Identical values — but defined in two places |
| `StateMachine` (line 119) | `shared/src/workflow/WorkflowState.ts: CanonicalWorkflowState` | Different naming; no `version` field in canonical |
| `StateDefinition` (line 108) | `shared/src/workflow/WorkflowState.ts: WorkflowStateDefinition` | Different naming; canonical has `description` |
| `StateTransition` (line 114) | `shared/src/workflow/WorkflowState.ts: StateTransition` | Identical shape |
| `Engine` (line 32) | — | No canonical engine interface exists in shared/ yet |

**Import graph:**

```
workflow-orchestrator/src/types.ts          ← defines DomainEvent, Engine, WorkflowContext...
workflow-orchestrator/src/events/DomainEvent.ts ← imports from ../types
workflow-orchestrator/src/runtime/EventDispatcher.ts ← imports from ../types
workflow-orchestrator/src/orchestrator/WorkflowOrchestrator.ts ← imports from ../types
workflow-orchestrator/src/runtime/WorkflowExecutor.ts ← imports from ../types
```

Every file in the orchestrator depends on the LOCAL definition. Zero imports from `@curdeeclau/shared`.

**Why it blocks RT-2:**

The orchestrator is the central coordination point. If it operates on a different event shape than the engines it orchestrates, integration is impossible. Event propagation across the orchestrator→engine boundary would require per-engine field mapping, breaking the universal communication primitive invariant.

**Constitutional articles violated:** III.3, V.2, X.1

---

### V-C3: Message Buffer Engine — Zero Event Integration

| Field | Value |
|---|---|
| **Location** | `message-buffer-engine/src/engine/MessageBufferEngine.ts` |
| **Constitution** | Article II.1 (I-E1: Every mutation emits DomainEvent), Article II.1 (I-E8: Events are only cross-engine mechanism), Article X.5 (Silent State Change) |
| **Severity** | **CRITICAL** |

**What it is:**

The `MessageBufferEngine` transitions through three states — `BUFFERING` → `READY_TO_FLUSH` → `FLUSHED` — with ZERO event emission. The governance event catalog declares `MessageBuffered` and `ConversationReadyToFlush` as governed event types, but the engine never creates or emits them.

```typescript
// MessageBufferEngine.ts:68-69 — silent state change to READY_TO_FLUSH
this.store.updateState(message.conversationId, 'READY_TO_FLUSH');
// No event emitted

// MessageBufferEngine.ts:96 — silent state change to FLUSHED
this.store.updateState(conversationId, 'FLUSHED');
// No event emitted
```

The engine has no `DomainEvent` import. No event factory. No emitter. No `correlationId` tracking.

**Additionally:** The engine doesn't implement the `Engine` interface:
- No `engineName` property
- No `execute(action, context)` method
- Cannot be registered with the orchestrator

**Why it blocks RT-2:**

The `ConversationReadyToFlush` event is the trigger that starts workflow execution. Without it, the orchestrator never knows a conversation needs processing. The entire event-driven orchestration chain depends on this event. It's the ignition key for the runtime.

**Constitutional articles violated:** I-E1, I-E8, X.5, Article IV.3 (can't register with orchestrator)

---

### V-C4: Provider Adapter Throw Pattern

| Field | Value |
|---|---|
| **Location** | `InMemoryCRMProvider`, `InMemoryCalendarProvider` |
| **Constitution** | Article II.4 (I-P4: Provider failure returns structured error), Article X.7 (Engine Throwing Exceptions), Article II.5 (I-D1: Determinism) |
| **Severity** | **CRITICAL** |

**What it is:**

Provider adapters throw `Error` for business-not-found cases instead of returning structured errors:

```typescript
// InMemoryCRMProvider.ts:60
getContact(id: string): Promise<CRMContact | undefined> {
  // ...
  throw new Error(`Contact ${id} not found`);  // ← THROW, not return undefined
}
```

25 throw sites across the two InMemory providers. The `CRMEngine` does NOT wrap provider calls in try/catch — throws bubble up uncaught. The `CalendarEngine` DOES wrap in try/catch (mitigated there), but the provider violates the contract regardless.

**Why it blocks RT-2:**

If the CRM engine is integrated with the orchestrator, a `Contact not found` throw during a workflow step will crash the step execution. The orchestrator expects structured errors to emit `WorkflowStepFailed` — not unhandled exceptions. This is a runtime stability issue.

Mitigation status:
- `CRMEngine` → no try/catch around provider calls → **UNMITIGATED**
- `CalendarEngine` → wraps all provider calls in try/catch → partially mitigated

**Constitutional articles violated:** I-P4, X.7

---

### V-C5: Event ID Non-Compliance (Systemic)

| Field | Value |
|---|---|
| **Location** | 4 event factories across the codebase |
| **Constitution** | Article II.1 (I-E6: Event IDs MUST use ULID or UUIDv7) |
| **Severity** | **HIGH** — Blocks event traceability, not event flow |

**Affected factories:**

| Factory | Location | ID Format | Collision Risk |
|---|---|---|---|
| `createDomainEvent` | `shared/src/events/DomainEvent.ts:61` | `evt_${Date.now().toString(36)}${counter.toString(36)}` | Medium |
| `createEvent` | `workflow-orchestrator/src/events/DomainEvent.ts:5` | `evt-${Date.now()}-${++counter}` | High — no base-36, sequential counter |
| `makeEvent` | `handoff-engine/src/events/HandoffEvents.ts:12` | `hdevt-${Date.now()}-${eventCounter}` | High — different prefix, sequential counter |
| `nextId` | `crm-engine/src/providers/memory/InMemoryCRMProvider.ts:16` | `${prefix}_${Date.now().toString(36)}${seq}` | Low — entity IDs, not event IDs |

The `workflow-orchestrator` factory is the most dangerous: `evt-${Date.now()}-${++counter}` uses millisecond precision. At burst writes (two events within 1ms), the counter increments but on restart, the counter resets to 0. Two orchestrator instances generate identical IDs.

**Why it blocks RT-2:**

While event flow works with non-conformant IDs, RT-2 requires the ability to trace events across engine boundaries. Without globally unique IDs, event correlation is unreliable. A UUIDv7/ULID dependency must be added before integration testing.

**Constitutional articles violated:** I-E6

---

## 2. Operational Violations (Do Not Block RT-2)

These violations are constitutional non-compliance but don't prevent RT-2 consolidation. They can be resolved during or after RT-2.

---

### V-O1: Handoff Engine — Full Type Redefinition

| Severity | **HIGH** |
|---|---|

The handoff engine redefines `ConversationOwner`, `SuppressionMode`, and `HandoffState` locally in `types.ts` instead of importing from `@curdeeclau/shared`. These are structurally identical but legally separate types in TypeScript. If the canonical type changes, the handoff engine drifts silently.

**Impact:** Type fragmentation. Not a runtime blocker because values are compatible.

---

### V-O2: Handoff Engine OwnershipManager — Duplicated isTransferAllowed

| Severity | **HIGH** |
|---|---|

The `OwnershipManager.transferOwnership()` method implements its own transfer validation that is semantically DIFFERENT from `shared/src/runtime/Ownership.ts:isTransferAllowed()`:

- **Canonical (`isTransferAllowed`):** `LOCKED` on either side → returns `false`. Same-state → returns `false`.
- **OwnershipManager:** Checks `previous === 'LOCKED'` → rejects. Checks `previous === newOwner` → rejects. But allows `newOwner === 'LOCKED'` through `setLocked()` which bypasses `transferOwnership` entirely.

The canonical function is stricter. The manager has a backdoor.

**Impact:** The canonical authority is undermined. Only block if RT-2 introduces LOCKED ownership scenarios.

---

### V-O3: CRM Engine — Divergent CRMEngineContext

| Severity | **MEDIUM** |
|---|---|

`CRMEngineContext` (in `crm-engine/src/types.ts:169-179`) defines its own context shape with `[key: string]: unknown` index signature. It aligns partially with the canonical `ExecutionContext` but adds an indexer that makes type-checking weaker.

**Impact:** Linting/typecheck won't catch misspelled field access. Not a runtime issue since values are passed by key from `Record<string, unknown>`.

---

### V-O4: Calendar Engine — Isolated Event Emitter

| Severity | **MEDIUM** |
|---|---|

The `CalendarEngine` has its own `CalendarEventEmitter` that stores events in an in-memory array but never dispatches them to the platform `EventDispatcher`. Events are observable within the calendar engine but invisible to the orchestrator and other engines.

```typescript
// CalendarEngine.ts:49
private events = new CalendarEventEmitter();
// This emitter ONLY stores events locally — no platform dispatch
```

**Impact:** Calendar events can't trigger workflow steps. The orchestrator can't react to `reservationCreated` or `reminderTriggered`. This limits vertical workflow design but doesn't break existing flows.

---

### V-O5: Workflow Orchestrator — Throw on Unknown Engine/Workflow

| Severity | **MEDIUM** |
|---|---|

`WorkflowOrchestrator.ts:67`:
```typescript
throw new Error(`Workflow "${workflowId}" not found`);
```

Governance says unknown engines/worfklows produce structured errors (`step.status = 'failed'`). These throws are in the orchestration bootstrap path (registration/loading), not in step execution. The step execution path (`WorkflowExecutor`) does return structured results.

**Impact:** Startup/bootstrap throws are less dangerous than runtime throws during step execution. Still non-conformant.

---

### V-O6: GHL Engine — Stub, No Adapter Implementation

| Severity | **LOW** |
|---|---|

The GHL engine defines raw GHL-shaped types (`GHLContact`, `GHLOpportunity`) with no mapping to canonical CRM types. There's no adapter implementing `CRMProvider`. This is a stub — it doesn't integrate with anything.

**Impact:** No runtime effect. This becomes relevant when GHL integration begins.

---

### V-O7: Message Buffer Engine — No Engine Contract

| Severity | **LOW** |
|---|---|

Doesn't implement the `Engine` interface. No `engineName`, no `execute()` method. This is a standalone class with its own API (`bufferMessage`, `flushConversation`). It can't be orchestrated.

**Impact:** Cannot be wired into workflow steps. This is already captured by V-C3. Listed separately because fixing V-C3 (event emission) doesn't automatically fix the Engine contract gap.

---

## 3. Architectural Observations (Neither Violations Nor Acceptable)

### OBS-1: Engine Compliance Spectrum

```
Fully conformant:    CRM Engine, Calendar Engine
Partially conformant: Workflow Orchestrator, Handoff Engine
Non-conformant:      Message Buffer Engine, GHL Engine, Media Delivery Engine
```

### OBS-2: Cross-Engine Import Hygiene

**Clean.** No engine imports from another engine. No engine imports from the monolith (`algorithmus-*`). The monolith doesn't import from the new engines. The two generations are cleanly separated.

### OBS-3: Monolith Isolation

`algorithmus-core-engine` and `algorithmus-platform` have zero references to `packages/engines/` or `packages/shared/`. They are a self-contained system — an Express server with WhatsApp webhook → FSM orchestrator → LLM gateway → RAG service. This isolation is architecturally healthy: the new engines can be integrated incrementally without touching the working monolith.

### OBS-4: The Engine Contract Gap in shared/

`shared/` does not define a canonical `Engine` interface, `EventDispatcher` interface, or `EventType` union. The constitution says engines implement the `Engine` contract, but that contract is only defined in `workflow-orchestrator/src/types.ts` — the same file that violates Article X.1 by redefining `DomainEvent`. The canonical engine contract needs to live in `shared/`.

---

## 4. Enforcement Priority Map

```
RT-2 GATE (must resolve first):
  ┌─────────────────────────────────────────────────────┐
  │ V-C1: HandoffDomainEvent → canonical DomainEvent     │
  │ V-C2: Orchestrator imports from @curdeeclau/shared   │
  │ V-C3: Message buffer emits DomainEvents              │
  │ V-C4: Provider adapters return structured errors     │
  │ V-C5: Event IDs use ULID/UUIDv7                      │
  └─────────────────────────────────────────────────────┘
                              │
RT-2 CONCURRENT (resolve during consolidation):         │
  ┌─────────────────────────────────────────────────────┐
  │ V-O1: Handoff engine imports shared/ types           │
  │ V-O2: OwnershipManager uses canonical isTransferAllowed │
  │ OBS-4: Canonical Engine interface in shared/         │
  └─────────────────────────────────────────────────────┘
                              │
RT-3 TOLERATED (resolve post-consolidation):            │
  ┌─────────────────────────────────────────────────────┐
  │ V-O3: CRMEngineContext alignment                     │
  │ V-O4: Calendar event dispatch to platform bus        │
  │ V-O5: Orchestrator bootstrap throws                  │
  │ V-O6: GHL adapter implementation                     │
  │ V-O7: Message buffer Engine contract                 │
  └─────────────────────────────────────────────────────┘
```

---

## 5. Which Enforcement Points Should Exist First

Before any engine integration begins, these enforcement mechanisms must exist:

### E-1: Canonical Engine Contract in shared/

`packages/shared/src/` must export an `Engine` interface, an `EventDispatcher` interface, and an `EventType` union. Without these, no engine can reference the canonical contract — they must either redefine locally or depend on the orchestrator's types (creating a circular dependency).

### E-2: Canonical DomainEvent Factory with UUIDv7

`shared/src/events/DomainEvent.ts` `createDomainEvent` must generate ULID or UUIDv7 IDs. All engine event factories must call this canonical factory. The `workflow-orchestrator/src/events/DomainEvent.ts` file should be deleted in favor of importing `createDomainEvent` from shared.

### E-3: Event Dispatcher as Shared Interface

The `EventDispatcher` interface must be in `shared/`, not in the orchestrator. All engines depend on it. Having it in the orchestrator creates an inverted dependency: engines → orchestrator, when the constitution says orchestrator → engines.

### E-4: Ownership Type as Sole Authority

The `ConversationOwner` type and `isTransferAllowed` function in `shared/` must be the ONLY sources engines reference. The handoff engine's local redefinitions must be replaced with imports.

---

## 6. Dangerous Drift vs Transitional Drift

### Dangerous (must converge before any vertical goes live):

| Drift | Danger |
|---|---|
| V-C1 (HandoffDomainEvent) | No engine can observe ownership changes. Runtime governance is impossible. |
| V-C2 (Orchestrator redefines types) | Orchestrator and engines operate on incompatible event shapes. Integration is blocked. |
| V-C3 (No message buffer events) | Workflow execution never triggers. The runtime has no ignition. |
| V-C4 (Provider throws) | CRM step execution crashes on not-found. Runtime instability. |

### Transitional (expected pre-convergence state):

| Drift | Why Transitional |
|---|---|
| V-O3 (CRMEngineContext) | Context shapes will converge when `ExecutionContext` becomes the sole context type. |
| V-O4 (Calendar emitter isolated) | Calendar events aren't needed until vertical workflows that react to bookings are implemented. |
| V-O5 (Orchestrator throws) | Bootstrap throws don't affect step execution. |
| V-O6 (GHL stub) | No GHL integration exists yet. Stub is placeholder. |
| V-O7 (Message buffer no Engine contract) | Will be fixed when V-C3 is resolved; the Engine contract will be added alongside event emission. |

---

## 7. Monolith / Engine Contamination Check

```
Monolith (algorithmus-*) ────X────→ New Engines (packages/engines/)
New Engines (packages/engines/) ────X────→ Monolith (algorithmus-*)
New Engines ────X────→ Other New Engines (no cross-engine imports)
Monolith ────X────→ packages/shared/
```

**Result: Clean.** The two generations share no imports. The isolation is complete. This is architecturally ideal for incremental integration.

---

## 8. RT-2 Readiness Verdict

**RT-2 CANNOT BEGIN until V-C1 through V-C5 are resolved.**

These five violations block the fundamental assumption of RT-2: that engines can be integrated through a shared event bus and orchestration layer. Without canonical event shapes, the orchestrator and engines speak different languages.

**Estimated enforcement surface:** 5 critical fixes, all concentrated in 3 packages (handoff-engine, workflow-orchestrator, message-buffer-engine). The CRM and Calendar engines are substantially conformant already.

**The path to RT-2 is narrow but clear:** converge the event model, fix provider returns, add ULID, then integrate.
