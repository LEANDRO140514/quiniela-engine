# Design Template

Use this template when designing the architecture of a new engine or runtime concept.

---

# Design: <change-name>

## 1. Architecture Overview

ASCII diagram showing the component and its relationship to existing engines.

```
┌─────────────────────────┐
│  Upstream component      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  This component          │
│  ┌───────────────────┐  │
│  │  Internal modules  │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  Provider/Adapter  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## 2. Canonical Entities

List entities this component uses. Always reference `packages/shared/` — never redefine.

| Entity | Source | Prefix |
|---|---|---|
| `EntityName` | `shared/<path>/` | `xxx_` |

## 3. Capabilities

What can this component do? List every action/operation.

| Action | Input | Output | Side Effects |
|---|---|---|---|
| `action_name` | `{ fields }` | `{ result }` | `EventEmitted` |

## 4. Event Lifecycle

All events conform to `DomainEvent` from `shared/events/DomainEvent.ts`.

| Event Type | Payload | causationId chain |
|---|---|---|
| `EventName` | `{ fields }` | parent event |

## 5. Lifecycle States

Define the state machine if applicable.

```
State A → State B → State C (terminal)
         ↘ State D (recovery)
```

**Terminal states:** List states that cannot transition further.
**Recovery states:** List states that allow rollback or recovery.

## 6. Invariants

Numbered rules that MUST always be true.

- **I1:** Description of invariant
- **I2:** Description of invariant

Group by concern: Identity, Lifecycle, Ownership, Events.

## 7. Ownership Integration

How does this component interact with `shared/runtime/Ownership.ts`?

| Ownership | Permissions |
|---|---|
| `AI` | What AI can do |
| `HUMAN` | What humans can do |
| `SHARED` | Co-pilot permissions |
| `LOCKED` | What is blocked |

## 8. Workflow Orchestration Integration

How does this component plug into `workflow-orchestrator`?

```json
{
  "id": "step-id",
  "engine": "<engine-name>",
  "action": "<action>",
  "input": { }
}
```

## 9. Provider Abstraction

If this component has providers, define the interface.

```typescript
interface Provider {
  method(input): Promise<output>;
}
```

Implementations:
- `InMemoryProvider` — Phase 1
- `RealProviderAdapter` — Phase 2
- `PostgresProvider` — Phase 4

## 10. Error Model

All errors returned as structured results — never thrown.

| Error Code | Condition | Response |
|---|---|---|
| `ERROR_CODE` | When it occurs | `{ error, message }` |

## 11. Future: Persistence

How will this be persisted in the future?
- Schema strategy
- RLS considerations
- Migration path from in-memory

## 12. Future: Multitenancy

How will `tenantId` and `workspaceId` be enforced?
