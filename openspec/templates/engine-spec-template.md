# Engine Spec Template

Use this template for the formal specification of a new engine.

---

# Spec: <engine-name>

## 1. Identity

| Field | Value |
|---|---|
| **Engine Name** | `<engine-name>` |
| **Package** | `@curdeeclau/<engine-name>` |
| **Contract** | `Engine` from `workflow-orchestrator` |
| **Domain** | <domain description> |
| **Vertical Scope** | All / <specific verticals> |
| **Runtime Model** | <provider-agnostic model description> |

## 2. Canonical Entities

Defined in `packages/shared/src/<path>/`. **The engine does not redefine these.**

### 2.1 EntityName

```typescript
{
  id: PrefixId;                     // "xxx_<ulid>"
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  // ... fields
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}
```

(Repeat for each entity.)

## 3. Engine Contract

```typescript
interface Engine {
  readonly engineName: string;  // "<engine-name>"
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

The `context` parameter MUST carry:
- `conversationId?: string`
- `tenantId?: string`
- `workflowId?: string`
- `correlationId?: string`
- `actorId?: string`

## 4. Capabilities (actions)

### 4.1 action_name

```
Input:  { field: type, ... }
Output: { result: type }
Event:  EventName { payload }
Errors: ERROR_CODE
```

(Repeat for each action.)

## 5. Event Catalog

All events conform to `DomainEvent` from `packages/shared/src/events/DomainEvent.ts`.

| Event Type | Required Payload Fields | causationId |
|---|---|---|
| `EventName` | `field, field` | parent event |

## 6. Invariants (MUST NOT be violated)

### 6.1 Identity Invariants
- **I1:** Description
- **I2:** Description

### 6.2 Lifecycle Invariants
- **I3:** Description

### 6.3 Ownership Invariants
- **I4:** Description

### 6.4 Event Invariants
- **I5:** Description

(Number continuously across all groups.)

## 7. Ownership & Handoff Integration

This engine reads ownership from the conversation context. It does NOT manage ownership.

```typescript
// Ownership gate in execute():
const owner = ownershipManager.getState(context.conversationId)?.owner ?? 'AI';
if (owner === 'LOCKED') return { error: 'OWNERSHIP_LOCKED' };
```

| Ownership | Permissions |
|---|---|
| `AI` | [actions allowed] |
| `HUMAN` | [actions allowed] |
| `SHARED` | [actions requiring approval] |
| `LOCKED` | **All blocked** |

## 8. Workflow Orchestration Integration

```json
{
  "id": "step-id",
  "name": "Step Name",
  "type": "action",
  "engine": "<engine-name>",
  "action": "<action>",
  "input": { }
}
```

## 9. Provider Interface

```typescript
interface Provider {
  readonly providerName: string;
  method(input): Promise<output>;
}
```

**Implementations:**
- `InMemoryProvider` — Phase 1
- `RealAdapter` — Phase 2
- `PostgresProvider` — Phase 4

## 10. Error Model

All errors are **returned as structured results**, never thrown.

| Error Code | Condition | Response |
|---|---|---|
| `ERROR_CODE` | When | `{ error, message }` |

## 11. Future: Multitenancy
## 12. Future: Observability

## 13. What This Spec Does NOT Cover
