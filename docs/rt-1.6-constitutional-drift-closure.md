# RT-1.6 — Constitutional Critical Drift Closure

> **Phase:** Pre-RT-2 gate. Only the 5 constitutional-critical blockers.
> **Doctrine:** Minimal patch. No refactors. No renames. No moves.
> **Goal:** Make the repo constitutionally safe to enter RT-2 Contract Consolidation.

---

## Blocker Summary

| ID | Blocker | Packages Affected | Est. Files |
|---|---|---|---|
| V-C1 | HandoffDomainEvent parallel universe | `handoff-engine` + `shared/` | 4 |
| V-C2 | Orchestrator canonical type redefinitions | `workflow-orchestrator` + `shared/` | 6 |
| V-C3 | Message buffer silent transitions | `message-buffer-engine` + `shared/` | 3 |
| V-C4 | Provider adapters throwing | `crm-engine` + `handoff-engine` + `calendar-engine` | 4 |
| V-C5 | Event ID non-compliance | `shared/` + `workflow-orchestrator` + `handoff-engine` | 3 |

---

## V-C1: HandoffDomainEvent Parallel Universe

### Problem

`handoff-engine` defines its own `HandoffDomainEvent` type (+ factory, + event constructors) incompatible with canonical `DomainEvent` from `shared/`. Events flow through `config.emitFn` private callback, never reaching the platform event bus.

Missing from HandoffDomainEvent: `causationId`, `actorId`, `workspaceId`, `verticalId`, `tenantId`, `metadata`.

### Affected Files

```
packages/engines/handoff-engine/src/types.ts              — Remove HandoffDomainEvent, HandoffEventType; fix emitFn sig
packages/engines/handoff-engine/src/events/HandoffEvents.ts — Rewrite to use createDomainEvent from shared/
packages/engines/handoff-engine/src/engine/HandoffEngine.ts — Update imports, emitFn calls, event construction
packages/engines/handoff-engine/package.json               — Add @curdeeclau/shared dependency
packages/shared/src/index.ts                               — Already exports DomainEvent, createDomainEvent ✓
```

### Minimal Patch Strategy

**Step 1: Add shared/ dependency**

```json
// handoff-engine/package.json
"dependencies": {
  "@curdeeclau/shared": "workspace:*"
}
```

**Step 2: Rewrite `HandoffEvents.ts` — delete all HandoffDomainEvent constructors, replace with DomainEvent factories**

The current file exports 8 event constructors that return `HandoffDomainEvent`. Replace each with a function returning `DomainEvent` via `createDomainEvent` from shared.

```typescript
// BEFORE (HandoffEvents.ts)
import type { HandoffDomainEvent, HandoffEventType, ... } from '../types';
let eventCounter = 0;
function makeEvent(...): HandoffDomainEvent { ... }
export function handoffRequested(...): HandoffDomainEvent { ... }

// AFTER
import { createDomainEvent } from '@curdeeclau/shared';
import type { DomainEvent } from '@curdeeclau/shared';

export function handoffRequested(
  conversationId: string,
  trigger: HandoffTrigger,
  matchedRuleId: string,
  reason: string,
  targetId: string,
  overrides: Partial<DomainEvent> = {},
): DomainEvent {
  return createDomainEvent('HandoffRequested', {
    conversationId,
    payload: { trigger, matchedRuleId, reason, targetId },
    ...overrides,
  });
}
```

Same pattern for all 8 event constructors: `handoffAccepted`, `handoffRejected`, `ownershipChanged`, `suppressionActivated`, `aiRecoveryStarted`, `aiRecovered`, `handoffClosed`.

**Step 3: Update `types.ts` — remove HandoffDomainEvent, fix emitFn**

```typescript
// REMOVE:
export interface HandoffDomainEvent { ... }
export type HandoffEventType = ...

// REMOVE local redefinitions, ADD shared imports:
import type { DomainEvent } from '@curdeeclau/shared';

// UPDATE HandoffEngineConfig:
export interface HandoffEngineConfig {
  emitFn?: (event: DomainEvent) => void;  // Was: (event: HandoffDomainEvent) => void
}
```

Also import `ConversationOwner` and `SuppressionMode` from shared instead of redefining locally:
```typescript
import type { ConversationOwner, SuppressionMode } from '@curdeeclau/shared';
// REMOVE local: export type ConversationOwner = 'AI' | 'HUMAN' | 'SHARED' | 'LOCKED';
// REMOVE local: export type SuppressionMode = 'FULL_SUPPRESSION' | 'ASSIST_MODE' | ...
```

Local types that stay (no canonical equivalent): `HandoffState`, `HandoffTrigger`, `HandoffCondition`, `HandoffTarget`, `HandoffChannel`, `AvailabilityWindow`, `HandoffRule`, `HandoffPolicySet`, `HandoffRequest`, `HandoffResult`, `HandoffEngineConfig`, `ConversationHandoffState`, `HandoffEvalContext`, `HandoffEngineInterface`.

**Step 4: Update `HandoffEngine.ts` — replace all event constructor calls**

All `handoffRequested(...)`, `ownershipChanged(...)`, etc. calls now return `DomainEvent` instead of `HandoffDomainEvent`. The `emitAll` method signature changes:

```typescript
// BEFORE
private emitAll(events: HandoffDomainEvent[]): void {
  if (!this.config.emitFn) return;
  for (const event of events) {
    this.config.emitFn(event);
  }
}

// AFTER
private emitAll(events: DomainEvent[]): void {
  if (!this.config.emitFn) return;
  for (const event of events) {
    this.config.emitFn(event);
  }
}
```

Update all event constructor imports. Add `correlationId` and `causationId` propagation from context where available.

### Expected Contract Alignment

After patch:
- Handoff engine emits canonical `DomainEvent` objects with all 13 fields.
- `causationId` and `actorId` are populated when context provides them.
- Events flow through the same `emitFn` signature the platform event bus expects.
- `ConversationOwner` and `SuppressionMode` have single source of truth in `shared/`.

### Validation Command

```bash
cd packages/engines/handoff-engine
pnpm exec tsc --noEmit
pnpm test
```

### Acceptance Criteria

- [ ] `HandoffDomainEvent` interface removed from `types.ts`
- [ ] `HandoffEventType` type removed from `types.ts`
- [ ] All 8 event constructors return `DomainEvent` (verify: `event.id` starts with `evt_`)
- [ ] `HandoffEngineConfig.emitFn` accepts `(event: DomainEvent) => void`
- [ ] `ConversationOwner` imported from `@curdeeclau/shared`, not defined locally
- [ ] `SuppressionMode` imported from `@curdeeclau/shared`, not defined locally
- [ ] All existing tests pass without modification (event shape change may require test assertion updates)
- [ ] TypeScript strict mode: zero errors

### Risk Level: **MEDIUM**

- Tests may need assertion updates if they inspect event shape.
- The `HandoffDomainEvent` type was exported from the engine's barrel — external consumers (if any) need to update.
- No runtime behavior change — same data, different envelope.

---

## V-C2: Workflow Orchestrator Canonical Type Redefinitions

### Problem

`workflow-orchestrator/src/types.ts` defines `DomainEvent`, `WorkflowContext`, `StepResult`, `StepStatus`, `StateMachine`, `StateDefinition`, `StateTransition` locally instead of importing from `@curdeeclau/shared`. The local `DomainEvent` drops 5 fields. Zero imports from shared/.

### Affected Files

```
packages/engines/workflow-orchestrator/src/types.ts                — Replace local defs with imports from shared/
packages/engines/workflow-orchestrator/src/events/DomainEvent.ts   — Replace with re-export from shared/ (or delete)
packages/engines/workflow-orchestrator/src/runtime/EventDispatcher.ts — Update imports
packages/engines/workflow-orchestrator/src/orchestrator/WorkflowOrchestrator.ts — Update imports
packages/engines/workflow-orchestrator/src/runtime/WorkflowExecutor.ts — Update imports
packages/engines/workflow-orchestrator/package.json                — Add @curdeeclau/shared dependency
packages/shared/src/index.ts                                       — Ensure all needed types are exported (audit)
```

### Minimal Patch Strategy

**Step 1: Add shared/ dependency**

```json
// workflow-orchestrator/package.json
"dependencies": {
  "@curdeeclau/shared": "workspace:*"
}
```

**Step 2: Replace local DomainEvent with shared import in types.ts**

```typescript
// BEFORE (types.ts:3-12)
export interface DomainEvent {
  id: string;
  type: string;
  timestamp: number;
  conversationId?: string;
  workflowId?: string;
  tenantId?: string;
  correlationId?: string;
  payload?: unknown;
}

// AFTER
export type { DomainEvent } from '@curdeeclau/shared';
```

**Step 3: Replace local StepResult, StepStatus with shared imports**

```typescript
// BEFORE
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export interface StepResult { stepId: string; stepName: string; status: StepStatus; ... }

// AFTER
export type { StepResult, StepStatus } from '@curdeeclau/shared';
```

Verify shared/ exports these:
- `StepResult` — yes, from `shared/src/workflow/WorkflowContext.ts`
- `StepStatus` — yes, same file

**Step 4: Replace local StateMachine/StateDefinition/StateTransition with shared imports**

```typescript
// BEFORE
export interface StateDefinition { name: string; description?: string; transitions: StateTransition[]; }
export interface StateTransition { event: string; target: string; }
export interface StateMachine { id: string; vertical: string; version: string; initial: string; states: StateDefinition[]; }

// AFTER
export type { CanonicalWorkflowState as StateMachine } from '@curdeeclau/shared';
export type { WorkflowStateDefinition as StateDefinition } from '@curdeeclau/shared';
export type { StateTransition } from '@curdeeclau/shared';
```

Note: `CanonicalWorkflowState` lacks `version` field; `WorkflowStateDefinition` lacks `description`. These are additive extensions. Keep the local extensions in types.ts that ADD fields to canonical types — extending is constitutional, redefining is not.

**Step 5: Replace local WorkflowContext with extension of CanonicalWorkflowContext**

```typescript
// BEFORE
export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  vertical: string;
  conversationId?: string;
  ...
}

// AFTER
import type { CanonicalWorkflowContext } from '@curdeeclau/shared';

export interface WorkflowContext extends CanonicalWorkflowContext {
  conversationId?: string;
  correlationId?: string;
  input: Record<string, unknown>;
  state: Record<string, unknown>;
  steps: StepResult[];
  startedAt: number;
  updatedAt: number;
}
```

Field mapping: the orchestrator's `vertical: string` becomes `verticalId?: string` from canonical. Update all usages:
- `context.vertical` → `context.verticalId`
- `definition.vertical` stays (WorkflowDefinition is orchestrator-local)

**Step 6: Update EventType union to reference canonical event names**

Keep `EventType` local (shared/ doesn't have one) but annotate that it derives from the governed catalog.

**Step 7: Replace local createEvent with createDomainEvent from shared/**

```typescript
// Delete: workflow-orchestrator/src/events/DomainEvent.ts
// Replace all imports of { createEvent } with { createDomainEvent } from '@curdeeclau/shared'
```

Update `WorkflowOrchestrator.ts`, `WorkflowExecutor.ts`, `EventDispatcher.ts`, and test files.

**Step 8: Keep local types that have no canonical equivalent**

These stay in orchestrator `types.ts`:
- `Engine` — no canonical equivalent in shared/ yet (add to shared/ in RT-2)
- `WorkflowDefinition`, `WorkflowStep`, `StepCondition`, `FailurePolicy` — orchestrator-local
- `EngineRegistry`, `WorkflowRegistry`, `EventDispatcher` — interfaces (move to shared/ in RT-2)
- `OrchestratorConfig`, `IWorkflowOrchestrator` — orchestrator-local

### Expected Contract Alignment

After patch:
- Orchestrator imports `DomainEvent`, `StepResult`, `StepStatus`, `StateTransition` from shared/.
- Orchestrator extends `CanonicalWorkflowContext` instead of redefining.
- Local `createEvent` deleted; `createDomainEvent` from shared used everywhere.
- `DomainEvent` now carries all 13 canonical fields through the orchestrator.

### Validation Commands

```bash
cd packages/engines/workflow-orchestrator
pnpm exec tsc --noEmit
pnpm test
```

### Acceptance Criteria

- [ ] Zero `interface DomainEvent` definitions in `workflow-orchestrator/src/`
- [ ] `workflow-orchestrator/src/events/DomainEvent.ts` deleted or reduced to re-export
- [ ] All `createEvent()` calls replaced with `createDomainEvent()`
- [ ] `WorkflowContext` extends `CanonicalWorkflowContext`
- [ ] `context.vertical` → `context.verticalId` migration complete
- [ ] All existing tests pass
- [ ] TypeScript strict mode: zero errors
- [ ] `grep "interface DomainEvent" packages/engines/workflow-orchestrator/src/` returns zero results

### Risk Level: **MEDIUM-HIGH**

- `vertical` → `verticalId` rename touches multiple files (orchestrator, executor, state resolver, tests).
- Test mocks may construct DomainEvents with the old shape — need field updates.
- The `createDomainEvent` factory from shared uses a different ID format (base-36 + counter) than the orchestrator's old `createEvent` (`evt-${Date.now()}-${counter}`). Test assertions on event IDs will need updating.
- Downstream consumers of the orchestrator's exported types (no known consumers yet — engines don't import from orchestrator) would break.

---

## V-C3: Message Buffer Silent Transitions

### Problem

`MessageBufferEngine` transitions through `BUFFERING → READY_TO_FLUSH → FLUSHED` with zero `DomainEvent` emission. No event factory. No emitter callback. No `Engine` contract implementation. Cannot be registered with orchestrator.

### Affected Files

```
packages/engines/message-buffer-engine/src/types.ts                  — Add emitFn to config, add Engine contract
packages/engines/message-buffer-engine/src/engine/MessageBufferEngine.ts — Emit events, implement Engine contract
packages/engines/message-buffer-engine/package.json                  — Add @curdeeclau/shared dependency
```

### Minimal Patch Strategy

**Step 1: Add shared/ dependency**

```json
// message-buffer-engine/package.json
"dependencies": {
  "@curdeeclau/shared": "workspace:*"
}
```

**Step 2: Add emitFn to BufferConfig in types.ts**

```typescript
import type { DomainEvent } from '@curdeeclau/shared';

export interface BufferConfig {
  waitWindowMs: number;
  maxMessages: number;
  dedupWindowMs: number;
  expiryMs: number;
  emitFn?: (event: DomainEvent) => void;  // NEW
}
```

**Step 3: Add Engine contract to MessageBufferEngine**

```typescript
import { createDomainEvent } from '@curdeeclau/shared';
import type { DomainEvent } from '@curdeeclau/shared';

export class MessageBufferEngine {
  readonly engineName = 'message-buffer-engine';  // NEW

  // ... existing fields ...

  // NEW: Engine contract
  async execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    switch (action) {
      case 'buffer':
        return this.bufferMessage(context as unknown as BufferMessage) as unknown as Record<string, unknown>;
      case 'flush':
        return this.flushConversation((context as Record<string, unknown>).conversationId as string) as unknown as Record<string, unknown>;
      case 'get_state':
        return { state: this.getConversationState((context as Record<string, unknown>).conversationId as string) };
      default:
        return { error: 'VALIDATION_ERROR', message: `Unknown action: "${action}"` };
    }
  }
```

**Step 4: Emit DomainEvent on state transitions**

Add event emission at three points:

```typescript
bufferMessage(message: BufferMessage): BufferResult {
  // ... existing dedup + buffer logic ...

  // NEW: Emit MessageBuffered on every non-duplicate message
  if (!duplicate) {
    this.emit(createDomainEvent('MessageBuffered', {
      conversationId: message.conversationId,
      payload: { messageId: message.messageId, channel: message.channel },
    }));
  }

  // When buffer reaches READY_TO_FLUSH (max messages or debounce expiry)
  if (count >= this.config.maxMessages) {
    this.store.updateState(message.conversationId, 'READY_TO_FLUSH');
    this.emit(createDomainEvent('ConversationReadyToFlush', {
      conversationId: message.conversationId,
      payload: { messageCount: count, reason: 'max_messages' },
    }));
    // ...
  }
  // ...
}

private onDebounceExpired(conversationId: string): void {
  // ... existing logic ...
  this.store.updateState(conversationId, 'READY_TO_FLUSH');
  // NEW:
  const count = this.store.getMessageCount(conversationId);
  this.emit(createDomainEvent('ConversationReadyToFlush', {
    conversationId,
    payload: { messageCount: count, reason: 'debounce_expired' },
  }));
}

private emit(event: DomainEvent): void {
  this.config.emitFn?.(event);
}
```

### Expected Contract Alignment

After patch:
- `MessageBuffered` emitted on every non-duplicate message.
- `ConversationReadyToFlush` emitted when debounce expires or max messages reached.
- Engine implements `Engine` contract — can be registered with orchestrator.
- Events carry `conversationId` for workflow routing.

### Validation Commands

```bash
cd packages/engines/message-buffer-engine
pnpm exec tsc --noEmit
pnpm test
```

### Acceptance Criteria

- [ ] `MessageBufferEngine` has `engineName = 'message-buffer-engine'`
- [ ] `MessageBufferEngine` has `execute(action, context)` method
- [ ] `MessageBuffered` event emitted on `bufferMessage()` (non-duplicate path)
- [ ] `ConversationReadyToFlush` event emitted on debounce expiry
- [ ] `ConversationReadyToFlush` event emitted on max messages reached
- [ ] `emitFn` in config accepts `DomainEvent`
- [ ] Unknown action returns `{ error: 'VALIDATION_ERROR', message: '...' }` (never throws)
- [ ] All existing tests pass
- [ ] TypeScript strict mode: zero errors

### Risk Level: **LOW**

- Pure addition. No existing behavior changes.
- Event emission is fire-and-forget via callback — no async impact on buffer timing.
- Tests verify buffer behavior; event emission is observable via mock emitFn.

---

## V-C4: Provider Adapters Throwing

### Problem

Provider adapters throw `Error` for not-found and validation failures instead of returning structured errors. The constitution requires: "Engines NEVER throw exceptions for business logic errors. They return structured error results."

### Actual Scope (Re-audited)

After detailed analysis, the 25 reported throw sites reduce to these actual risks:

| Location | Throw Site | Behind Engine Guard? | Risk |
|---|---|---|---|
| `InMemoryCRMProvider.updateContact` | Contact not found | Yes — `ContactManager.update` checks existence first | Race condition only |
| `InMemoryCRMProvider.moveOpportunity` | Opportunity not found | Yes — `OpportunityManager.move` checks first | Race condition only |
| `InMemoryCRMProvider.pauseCampaign` | Campaign not found | Yes — `CampaignManager.pause` checks first | Race condition only |
| `InMemoryCRMProvider.resumeCampaign` | Campaign not found | Yes — `CampaignManager.resume` checks first | Race condition only |
| `InMemoryCRMProvider.addTag` | Contact not found | Yes — `TagManager.add` checks first | Race condition only |
| `InMemoryCRMProvider.removeTag` | Contact not found | Yes — `TagManager.remove` checks first | Race condition only |
| `InMemoryCalendarProvider.*` (8 sites) | Various | Yes — `CalendarEngine.execute` wraps in try/catch | **MITIGATED** |
| `HandoffEngine.execute` | Unknown action | No guard | **ACTIVE** |
| `WorkflowOrchestrator.execute` | Workflow not found | Bootstrap, not step execution | Low priority |
| Google Calendar stub (13) | Not implemented | Stub | Acceptable |
| GHL placeholder (14) | Not implemented | Placeholder | Acceptable |

### Affected Files (minimal scope)

```
packages/engines/handoff-engine/src/engine/HandoffEngine.ts — Replace throw with structured error (line 89)
packages/engines/crm-engine/src/entities/ContactManager.ts   — Add try/catch around provider.updateContact
packages/engines/crm-engine/src/entities/OpportunityManager.ts — Add try/catch around provider.moveOpportunity + createOpportunity
packages/engines/crm-engine/src/entities/CampaignManager.ts  — Add try/catch around provider.pauseCampaign + resumeCampaign
packages/engines/crm-engine/src/entities/TagManager.ts       — Add try/catch around provider.addTag + removeTag
```

### Minimal Patch Strategy

**Step 1: Handoff engine — return structured error instead of throw**

```typescript
// BEFORE (HandoffEngine.ts:88-90)
default:
  throw new Error(`Unknown handoff action: ${action}`);

// AFTER
default:
  return { error: 'VALIDATION_ERROR', message: `Unknown handoff action: "${action}"` } as unknown as Record<string, unknown>;
```

**Step 2: CRM entity managers — wrap mutation calls in try/catch**

Add defense-in-depth to all entity managers. The guard pattern (check existence → mutate) prevents most throws, but race conditions or provider bugs could still trigger them. The entity manager converts provider throws to structured errors:

```typescript
// In ContactManager.update():
async update(input: UpdateContactInput, context: CRMEngineContext): Promise<{ contact: CRMContact } | CRMError> {
  const existing = await this.provider.getContact(input.contactId);
  if (!existing) {
    return { error: 'CONTACT_NOT_FOUND', message: `Contact ${input.contactId} does not exist` };
  }
  try {
    const contact = await this.provider.updateContact(input.contactId, input.changes);
    this.events.emitContactUpdated(input.contactId, input.changes, previous, context);
    return { contact };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: 'PROVIDER_UNAVAILABLE', message: msg };
  }
}
```

Same pattern for:
- `OpportunityManager.create()` — wrap `provider.createOpportunity()`
- `OpportunityManager.move()` — wrap `provider.moveOpportunity()`
- `CampaignManager.pause()` — wrap `provider.pauseCampaign()`
- `CampaignManager.resume()` — wrap `provider.resumeCampaign()`
- `TagManager.add()` — wrap `provider.addTag()`
- `TagManager.remove()` — wrap `provider.removeTag()`

Note: `CampaignManager.create()`, `ContactManager.create()`, `PipelineManager.create()` also call provider methods — add try/catch for consistency.

### Expected Contract Alignment

After patch:
- No engine throws for business logic errors. All errors are `{ error, message }` returns.
- Provider throws are caught at the entity manager boundary and converted to `PROVIDER_UNAVAILABLE` errors.
- Calendar engine already does this correctly (reference pattern).

### Validation Commands

```bash
cd packages/engines/handoff-engine && pnpm test
cd packages/engines/crm-engine && pnpm test
```

### Acceptance Criteria

- [ ] `HandoffEngine.execute()` never throws — unknown action returns structured error
- [ ] All CRM entity manager mutation methods wrap provider calls in try/catch
- [ ] Provider throws converted to `{ error: 'PROVIDER_UNAVAILABLE', message }`
- [ ] All existing tests pass
- [ ] TypeScript strict mode: zero errors

### Risk Level: **LOW**

- The try/catch additions are pure defense-in-depth — the guards already prevent not-found throws.
- No behavior change in normal operation. Only race conditions or provider bugs trigger the catch path.

---

## V-C5: Event ID Non-Compliance

### Problem

All 4 event factories use `Date.now() + counter` instead of ULID or UUIDv7. Constitution I-E6 requires globally unique IDs. The `workflow-orchestrator` factory uses the most collision-prone format: `evt-${Date.now()}-${++counter}`.

### Affected Files

```
packages/shared/src/events/DomainEvent.ts                          — Replace counter with UUIDv7
packages/engines/workflow-orchestrator/src/events/DomainEvent.ts   — Deleted (replaced by shared import in V-C2)
packages/engines/handoff-engine/src/events/HandoffEvents.ts        — Replaced by createDomainEvent (V-C1)
packages/engines/crm-engine/src/providers/memory/InMemoryCRMProvider.ts — Entity ID factory (non-critical, can defer)
```

### Minimal Patch Strategy

**Step 1: Add UUIDv7 generation to shared/**

Add a lightweight UUIDv7 generator to `shared/`. No external dependency needed — a minimal implementation is ~20 lines:

```typescript
// packages/shared/src/events/uuid7.ts (NEW FILE)
export function uuidv7(): string {
  const ms = Date.now();
  const bytes = new Uint8Array(16);
  
  // Timestamp (48 bits)
  bytes[0] = (ms >>> 40) & 0xff;
  bytes[1] = (ms >>> 32) & 0xff;
  bytes[2] = (ms >>> 24) & 0xff;
  bytes[3] = (ms >>> 16) & 0xff;
  bytes[4] = (ms >>> 8) & 0xff;
  bytes[5] = ms & 0xff;
  
  // Random (74 bits) — 10 bits from crypto, 64 from Math.random fallback
  crypto.getRandomValues(bytes.subarray(6, 16));
  
  // Version (7) and variant (10xx)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}
```

Alternative: add `uuid` package dependency. For minimality, the inline implementation avoids a new dependency.

**Step 2: Update createDomainEvent in shared/**

```typescript
// BEFORE
let counter = 0;
export function createDomainEvent(type: string, overrides: Partial<DomainEvent> = {}): DomainEvent {
  counter += 1;
  return {
    id: overrides.id ?? `evt_${Date.now().toString(36)}${counter.toString(36).padStart(4, '0')}`,
    // ...
  };
}

// AFTER
import { uuidv7 } from './uuid7';

export function createDomainEvent(type: string, overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    id: overrides.id ?? `evt_${uuidv7()}`,
    // ...
  };
}
```

**Step 3: V-C1 and V-C2 already converge to createDomainEvent**

After V-C1 and V-C2 patches:
- `handoff-engine` uses `createDomainEvent` from shared/ ✓
- `workflow-orchestrator` uses `createDomainEvent` from shared/ ✓
- Only remaining local factory: `InMemoryCRMProvider.nextId()` — entity IDs, not event IDs. Lower priority.

**Step 4: Update entity ID factory (optional, can defer to RT-2)**

`InMemoryCRMProvider.nextId()` uses `Date.now().toString(36) + counter`. Entity IDs don't have the same uniqueness requirement as event IDs. Can defer.

### Expected Contract Alignment

After patch:
- All DomainEvents carry UUIDv7 IDs.
- `createDomainEvent` is the single event factory.
- I-E6 satisfied.

### Validation Commands

```bash
cd packages/shared
pnpm test
pnpm exec tsc --noEmit
```

### Acceptance Criteria

- [ ] `createDomainEvent().id` matches pattern `evt_[0-9a-f]{32}` (UUIDv7 hex)
- [ ] Two events created in same millisecond have different IDs
- [ ] `shared/src/events/DomainEvent.ts` has no `counter` variable
- [ ] All shared/ tests pass
- [ ] No `Date.now()` usage in event ID generation

### Risk Level: **LOW**

- UUIDv7 is a drop-in replacement. Same length, same format family.
- No external dependency needed.
- Entity ID factory (`nextId`) is not changed — it's not an event ID.

---

## Shared/ Additions Required

Two types currently missing from `shared/` that V-C1, V-C2, V-C3 need:

### 1. EventType Union

```typescript
// packages/shared/src/events/EventType.ts (NEW FILE)
export type EventType =
  | 'MessageBuffered'
  | 'ConversationReadyToFlush'
  | 'WorkflowStarted'
  | 'WorkflowStepExecuted'
  | 'WorkflowStepFailed'
  | 'WorkflowCompleted'
  | 'WorkflowFailed'
  | 'StateTransitioned'
  | 'HandoffRequested'
  | 'HandoffAccepted'
  | 'HandoffRejected'
  | 'OwnershipChanged'
  | 'SuppressionActivated'
  | 'AIRecoveryStarted'
  | 'AIRecovered'
  | 'HandoffClosed'
  | 'ContactCreated'
  | 'ContactUpdated'
  | 'OpportunityCreated'
  | 'OpportunityMoved'
  | 'TagAdded'
  | 'TagRemoved'
  | 'PipelineCreated'
  | 'CampaignCreated'
  | 'CampaignPaused'
  | 'CampaignResumed'
  | 'TimeSlotReserved'
  | 'ReservationCancelled'
  | 'ReminderTriggered';
```

This is the governed catalog from Constitution Article V.4. Add to `shared/src/index.ts` exports.

### 2. EventDispatcher Interface

```typescript
// packages/shared/src/events/EventDispatcher.ts (NEW FILE)
import type { DomainEvent } from './DomainEvent';
import type { EventType } from './EventType';

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

export interface EventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
  on(eventType: EventType | '*', handler: EventHandler): void;
  off(eventType: EventType | '*', handler: EventHandler): void;
}
```

This is the canonical dispatch interface. Add to `shared/src/index.ts` exports.

---

## Execution Order

Dependencies between blockers:

```
V-C5 (UUIDv7)           ← No dependencies. Do first.
    ↓
Shared/ additions       ← No dependencies. Do second.
    ↓
V-C1 (Handoff events)   ← Depends on createDomainEvent from shared/
V-C2 (Orchestrator)     ← Depends on createDomainEvent + canonical types from shared/
V-C3 (Message buffer)   ← Depends on createDomainEvent from shared/
    ↓
V-C4 (Provider throws)  ← Independent. Can run parallel to V-C1/V-C2/V-C3.
```

Recommended execution sequence:
1. **V-C5 + shared/ additions** — single PR
2. **V-C1, V-C2, V-C3** — three parallel PRs (independent engines)
3. **V-C4** — follow-up PR

---

## RT-2 Gate Check

After all 5 blockers are resolved, verify:

```bash
# No engine defines its own DomainEvent
grep -r "interface DomainEvent" packages/engines/ --include="*.ts"
# Expected: zero results

# No engine throws for business logic
grep -r "throw new Error" packages/engines/*/src/engine/ --include="*.ts"
# Expected: zero results (stubs and test helpers excluded)

# All event IDs use UUIDv7
grep -r "createDomainEvent" packages/engines/ --include="*.ts" | wc -l
# Expected: all engines that emit events use createDomainEvent

# All engines import from shared/
grep -r "@curdeeclau/shared" packages/engines/*/package.json --include="*.json"
# Expected: all 7 engines have the dependency

# TypeScript compiles clean
pnpm -r exec tsc --noEmit
```

---

*RT-1.6 plan complete. Awaiting authorization to execute. No physical changes yet.*
