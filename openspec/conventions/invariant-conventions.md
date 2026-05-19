# Invariant Conventions

## Core Principle

> **An invariant is a rule that MUST always be true. Specs are incomplete without invariants. Engines are incorrect if they violate invariants.**

## What is an Invariant?

An invariant is a logical condition that holds true:
- **Before** every engine operation (precondition)
- **After** every engine operation (postcondition)
- **Across** all engine operations (system-wide)

## How to Write an Invariant

### Format

```
I<N> — <Entity | Concern>: <rule in present tense, MUST/SHALL/CANNOT>
```

### Examples

**Good:**
```
I1 — Contact: providerIds MUST remain separated from the canonical id.
I2 — Event: Every state mutation MUST emit a DomainEvent.
I3 — Ownership: LOCKED ownership SHALL block all CRM write operations.
I4 — Campaign: Campaigns with status 'archived' CANNOT be resumed or paused.
I5 — Opportunity: Status 'won', 'lost', 'abandoned' are TERMINAL — no further moves.
```

**Bad:**
```
✗ "Provider IDs should probably be separate" — too weak, no MUST/SHALL
✗ "Handle errors" — not specific, not verifiable
✗ "Be fast" — not measurable, not a logical condition
```

## Invariant Categories

Group invariants by concern:

### Identity Invariants
Rules about entity identity, IDs, and provider separation.

```
I1 — Contact: providerIds MUST remain separated from the canonical id.
I2 — Contact: The canonical id field is IMMUTABLE after creation.
I3 — Entity: All entities MUST use the correct ULID prefix per entity type.
I4 — Entity: providerIds SHALL NOT be used as primary keys in any operation.
```

### Lifecycle Invariants
Rules about valid state transitions.

```
I5 — Pipeline: A pipeline MUST have at least 1 stage.
I6 — Pipeline: Stage 'order' MUST be unique within a pipeline.
I7 — Opportunity: Status 'won', 'lost', 'abandoned' are TERMINAL.
I8 — Campaign: Campaigns with status 'archived' CANNOT be resumed or paused.
```

### Ownership Invariants
Rules about ownership gating.

```
I9 — Ownership: LOCKED ownership SHALL block ALL engine write operations.
I10 — Ownership: Every ownership transition MUST emit an OwnershipChanged event.
I11 — Ownership: Only handoff-engine MAY modify ownership state.
```

### Event Invariants
Rules about event emission and causality.

```
I12 — Event: Every CRM state mutation MUST emit a DomainEvent.
I13 — Event: Events within a workflow execution MUST share correlationId.
I14 — Event: Every event that is a direct reaction MUST carry causationId.
```

### Data Invariants
Rules about data integrity.

```
I15 — Contact: No two contacts may share the same providerIds.ghl value (same tenant).
I16 — Campaign: startAt MUST be before endAt (if both are set).
I17 — Opportunity: contactId MUST reference an existing contact.
I18 — Opportunity: pipelineId MUST reference an existing pipeline.
```

## Invariant Strength

| Strength | Keyword | Meaning |
|---|---|---|
| **Absolute** | MUST, SHALL | Always true. Violation = bug. |
| **Prohibition** | MUST NOT, CANNOT, SHALL NOT | Never allowed. Violation = security/consistency bug. |
| **Recommendation** | SHOULD | Should be true. Violation = code smell. |
| **Option** | MAY | Allowed but not required. |

Specs use **MUST** and **MUST NOT** predominantly. Recommendations are for implementation guidance, not spec requirements.

## Invariant Verification

Every invariant must be verifiable:

1. **By tests:** Unit/integration tests assert the invariant holds
2. **By type system:** TypeScript types enforce the invariant at compile time
3. **By runtime checks:** Assertions in engine code verify at runtime

Example:
```
I17 — Opportunity: contactId MUST reference an existing contact.
```
Verified by:
```typescript
// Runtime check in engine.execute():
const contact = this.provider.getContact(input.contactId);
if (!contact) return { error: 'CONTACT_NOT_FOUND' };
```

## Invariant Placement

| File | Invariants |
|---|---|
| `specs/<engine>.md` | Engine-specific invariants (entities, lifecycle, permissions) |
| `governance/event-model.md` | Event invariants (cross-cutting) |
| `governance/ownership-model.md` | Ownership invariants (cross-cutting) |
| `governance/orchestration-model.md` | Orchestration invariants (cross-cutting) |
| `governance/runtime-semantics.md` | Runtime invariants (cross-cutting) |

## Invariant Numbers

- Engine specs: continuous numbering starting from I1
- Governance docs: prefixed by concern (I-E1 for events, I-O1 for orchestration)
- No duplicate numbers within the same document
- Numbers are stable — don't renumber when adding new invariants
