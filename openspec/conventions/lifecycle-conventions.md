# Lifecycle Conventions

## Core Principle

> **Every entity has a defined lifecycle. Terminal states are explicit. Recovery paths are documented.**

## State Naming Convention

| State Type | Naming Pattern | Example |
|---|---|---|
| Initial | Descriptive | `idle`, `draft`, `AI_ACTIVE` |
| Transient | Present participle | `buffering`, `classifying`, `HANDOFF_PENDING` |
| Active | Descriptive | `HUMAN_ACTIVE`, `active` |
| Terminal | Past tense / final | `won`, `lost`, `HANDOFF_CLOSED`, `completed` |
| Recovery | `*_RECOVERY_*` or `*_RESTORED` | `AI_RECOVERY_PENDING`, `AI_RESTORED` |

## Lifecycle Categories

### Linear Lifecycle

No branches. States proceed in fixed order.

```
A → B → C → D (terminal)
```

Example: Message buffer
```
IDLE → BUFFERING → READY_TO_FLUSH → FLUSHED
```

### Branching Lifecycle

Multiple paths from a state, determined by conditions.

```
        ┌→ B → D (terminal)
A →     │
        └→ C → E (terminal)
```

Example: Opportunity
```
        ┌→ won (terminal)
open →  │
        ├→ lost (terminal)
        │
        └→ abandoned (terminal)
```

### Reversible Lifecycle

States can transition forward and backward.

```
A ⇄ B ⇄ C → D (terminal)
```

Example: Ownership
```
AI ⇄ HUMAN ⇄ SHARED
  (LOCKED is terminal)
```

### Cyclic Lifecycle

Entity returns to initial state after completion.

```
A → B → C → A
```

Example: Conversation flow
```
idle → classifying → routing → responding → idle
```

## Terminal States

A terminal state means **no further transitions without explicit recovery**.

| Entity | Terminal States |
|---|---|
| Opportunity | `won`, `lost`, `abandoned` |
| Campaign | `archived` |
| Handoff | `HANDOFF_CLOSED` |
| Ownership | `LOCKED` (requires explicit unlock) |
| Workflow Execution | `WorkflowCompleted`, `WorkflowFailed` |

### Terminal State Rules

1. Terminal states MUST be documented in the entity's spec
2. Transitions FROM terminal states require explicit recovery actions
3. Recovery from terminal MUST emit an event
4. Terminal state transitions are NEVER automatic

## Recovery States

Recovery is the path back from an error or terminal state.

```
Terminal → Recovery Pending → Recovery Complete
```

Example:
```
HANDOFF_CLOSED → (no direct recovery — new handoff required)

HUMAN_ACTIVE → AI_RECOVERY_PENDING → AI_RESTORED
```

### Recovery Rules

1. Recovery states use `*_RECOVERY_PENDING` or `*_RECOVERY_*` naming
2. Recovery completion emits a `*Recovered` or `*Restored` event
3. Recovery MUST restore ownership and suppression to valid states
4. Failed recovery returns to the previous state, not an undefined state

## Ownership Lifecycle

```
AI_ACTIVE ──────────────────────────────────────────→
  │                                                    │
  ├─ handoff requested → HANDOFF_PENDING              │
  │   ├─ accepted → HUMAN_ACTIVE                      │
  │   │   ├─ recovery → AI_RECOVERY_PENDING          │
  │   │   │   └─ complete → AI_RESTORED              │
  │   │   └─ close → HANDOFF_CLOSED                  │
  │   └─ rejected → AI_ACTIVE                         │
  │                                                    │
  └─ assist mode → AI_ASSISTED_HUMAN                  │
      └─ deactivate → AI_ACTIVE                       │
```

## Workflow Execution Lifecycle

```
WorkflowStarted
  │
  ├─ Step 1 → WorkflowStepExecuted
  │   └─ State advanced
  │
  ├─ Step N → WorkflowStepExecuted
  │
  └─ WorkflowCompleted
```

On step failure:
```
WorkflowStepFailed
  ├─ Retry (if retry policy)
  │   └─ Step retried → WorkflowStepExecuted
  └─ Terminal failure → WorkflowFailed
      └─ Fallback step (if defined)
```

## Convention Rules

1. Every spec MUST include a lifecycle diagram (ASCII)
2. Terminal states MUST be explicitly listed
3. Recovery paths MUST be documented
4. Lifecycle diagrams use `→` for forward, `⇄` for reversible, `└─` `├─` for branches
