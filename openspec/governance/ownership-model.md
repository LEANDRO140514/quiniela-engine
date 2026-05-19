# Ownership Model

## Core Principle

> **Ownership is runtime governance, not a feature flag. It gates every engine operation.**

The ownership model defines who controls a conversation and what they are allowed to do. It is a cross-cutting concern that every engine must respect.

## Ownership States

| State | Description | Use Case |
|---|---|---|
| `AI` | AI agent is in full control | Default state — normal conversational operation |
| `HUMAN` | Human operator has taken over | Handoff accepted — human is actively managing |
| `SHARED` | AI and human co-pilot | AI suggests responses, human approves before sending |
| `LOCKED` | Ownership frozen | Legal hold, audit mode, compliance freeze |

## Ownership Transitions

```
AI ──────────→ HUMAN    (handoff accepted)
AI ──────────→ SHARED   (assist mode activated)
AI ──────────→ LOCKED   (legal hold, compliance)

HUMAN ───────→ AI       (recovery completed)
HUMAN ───────→ SHARED   (human enables assist)
HUMAN ───────→ LOCKED   (legal hold)

SHARED ──────→ AI       (human disables assist)
SHARED ──────→ HUMAN    (human takes full control)
SHARED ──────→ LOCKED   (legal hold)

LOCKED ──────→ (no transition — requires explicit unlock)
```

### Transition Rules

1. `AI → HUMAN`: handoff-engine `accept()`
2. `HUMAN → AI`: handoff-engine `recover()`
3. `AI → SHARED`: suppression `ASSIST_MODE` activation
4. `SHARED/HUMAN/AI → LOCKED`: explicit `setLocked()` call (legal/compliance trigger)
5. `LOCKED → AI`: explicit unlock — requires audit justification
6. Same-state transitions are NO-OPs

### Prohibited Transitions

- `LOCKED → *`: Cannot unlock without explicit action
- `AI → AI`: No-op, rejected
- `* → *` without event emission: Every transition emits `OwnershipChanged`

## Ownership-Aware Engine Operations

Every engine's `execute()` method gates actions by ownership:

```typescript
function ownershipGate(owner: ConversationOwner, action: string): boolean {
  switch (owner) {
    case 'AI':
      // AI can classify, tag, create contacts — cannot mutate pipelines or campaigns
      return ['create_contact', 'add_tag', 'remove_tag', 'update_contact'].includes(action);

    case 'HUMAN':
      // Humans have full access
      return true;

    case 'SHARED':
      // AI suggests, human approves — engine returns APPROVAL_REQUIRED for gated actions
      if (['move_opportunity', 'pause_campaign', 'resume_campaign'].includes(action)) {
        return context.approvedBy !== undefined;
      }
      return true;

    case 'LOCKED':
      // All write operations blocked
      return false;

    default:
      return false;
  }
}
```

### Permission Matrix

| Action | AI | HUMAN | SHARED | LOCKED |
|---|---|---|---|---|
| Create contact | ✓ | ✓ | ✓ | ✗ |
| Update contact | ✓ | ✓ | ✓ | ✗ |
| Add/remove tags | ✓ | ✓ | ✓ | ✗ |
| Create opportunity | ✗ | ✓ | ✗¹ | ✗ |
| Move opportunity | ✗ | ✓ | ✗¹ | ✗ |
| Create pipeline | ✗ | ✓ | ✗ | ✗ |
| Pause/resume campaign | ✗ | ✓ | ✗¹ | ✗ |

¹ Allowed if `context.approvedBy` is present (human co-approval)

## Ownership & Suppression Interaction

Ownership and suppression are coupled:

| Ownership | Default Suppression | Meaning |
|---|---|---|
| `AI` | `NONE` | AI operates freely |
| `HUMAN` | `FULL_SUPPRESSION` | AI is silent while human works |
| `SHARED` | `ASSIST_MODE` | AI suggests, doesn't send |
| `LOCKED` | `FULL_SUPPRESSION` | AI frozen, human frozen |

When ownership changes, suppression is updated automatically by `handoff-engine`.

## Ownership Record

Every ownership change creates an `OwnershipRecord`:

```typescript
interface OwnershipRecord {
  conversationId: string;
  owner: ConversationOwner;
  previousOwner?: ConversationOwner;
  changedAt: number;        // Unix ms
  changedBy?: string;       // userId or engineName
  reason?: string;          // Why ownership changed
}
```

This record is the audit trail for ownership transitions.

## Governance Rules

1. **G1:** No engine may bypass ownership gates
2. **G2:** `LOCKED` ownership blocks ALL writes across ALL engines
3. **G3:** Every ownership transition emits `OwnershipChanged` event
4. **G4:** `OwnershipRecord` is immutable — no updates, no deletes
5. **G5:** Ownership is per-conversation, not per-tenant
6. **G6:** Engines read ownership; only handoff-engine writes it
