# Orchestration Model

## Core Principle

> **Workflows are explicit, deterministic, event-driven DAGs. AI enriches context; the orchestrator decides transitions.**

The orchestrator is the central nervous system of Algorithmus Platform. It dispatches events to engines, resolves state transitions, and ensures every step is observable.

## Orchestration Architecture

```
┌──────────────────────────────────────────────┐
│            WorkflowOrchestrator               │
│                                               │
│  ┌─────────────┐  ┌───────────────────────┐  │
│  │EventDispatcher│  │   WorkflowRegistry    │  │
│  │ (pub/sub)    │  │   (workflow→steps)    │  │
│  └─────────────┘  └───────────────────────┘  │
│                                               │
│  ┌─────────────┐  ┌───────────────────────┐  │
│  │EngineRegistry│  │   WorkflowExecutor     │  │
│  │ (name→engine)│  │   (step-by-step)      │  │
│  └─────────────┘  └───────────────────────┘  │
│                                               │
│  ┌─────────────┐  ┌───────────────────────┐  │
│  │StateResolver │  │   Context Store        │  │
│  │ (FSM→next)  │  │   (execution→context)  │  │
│  └─────────────┘  └───────────────────────┘  │
└──────────────────────────────────────────────┘
```

## Event-Driven Orchestration

The orchestrator responds to events. Key triggers:

| Trigger Event | Orchestrator Action |
|---|---|
| `ConversationReadyToFlush` | `execute(wf-handle-messages, { conversationId })` |
| `HandoffRequested` | `execute(wf-handoff, { conversationId, trigger })` |
| `ContactCreated` | Next step in pipeline workflow |
| `OpportunityMoved` | Next stage action (schedule follow-up, send confirmation) |

## Engine Execution Model

```
WorkflowExecutor.execute(workflowDefinition, context, triggerEvent?)
  │
  ├─ 1. Apply trigger event (if provided)
  │      → StateResolver.resolveNextState(currentState, triggerEvent.type)
  │      → context.currentState = nextState
  │
  ├─ 2. For each step in workflowDefinition.steps:
  │      ├─ Resolve engine: engineRegistry.get(step.engine)
  │      ├─ Evaluate conditions (decision steps)
  │      ├─ Execute: engine.execute(step.action, context)
  │      ├─ Record: stepResult { stepId, status, output, error }
  │      ├─ Emit: WorkflowStepExecuted or WorkflowStepFailed
  │      └─ Advance state: resolveNextState(currentState, step.action)
  │
  └─ 3. Emit: WorkflowCompleted or WorkflowFailed
```

## Workflow Lifecycle

```
WorkflowStarted
  │
  ├─ Step 1 executed → WorkflowStepExecuted
  │   └─ State advanced → StateTransitioned
  │
  ├─ Step 2 executed → WorkflowStepExecuted
  │   └─ State advanced → StateTransitioned
  │
  ├─ Step N executed → WorkflowStepExecuted
  │
  └─ WorkflowCompleted
      └─ payload: { totalSteps, completedSteps }
```

**On failure:**
```
WorkflowStepFailed
  └─ step.error = "CONTACT_NOT_FOUND"
      └─ WorkflowFailed (if terminal)
      └─ or: fallback step (if defined in onFailure)
```

## State-Aware Execution

The orchestrator maintains a state machine per workflow. Every step execution may trigger a state transition.

```typescript
interface StateMachine {
  id: string;
  vertical: string;
  initial: string;
  states: StateDefinition[];
}

interface StateDefinition {
  name: string;
  transitions: { event: string; target: string }[];
}
```

State resolution:
```typescript
resolveNextState(currentState: string, event: string): string {
  const state = machine.states.find(s => s.name === currentState);
  const transition = state.transitions.find(t => t.event === event);
  return transition?.target ?? currentState;
}
```

## Retry Philosophy

### What Gets Retried
- Provider errors (`PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`)
- Transient infrastructure errors

### What Does NOT Get Retried
- Ownership errors (`OWNERSHIP_LOCKED`, `OWNERSHIP_INSUFFICIENT`)
- Validation errors (`CONTACT_NOT_FOUND`, `INVALID_STAGE`)
- Business logic errors (`CAMPAIGN_ARCHIVED`, `OPPORTUNITY_TERMINAL`)

### Retry Configuration

```typescript
interface FailurePolicy {
  retry: {
    maxAttempts: number;    // Default: 3
    backoffMs: number;      // Exponential multiplier: 1s, 4s, 16s
  };
  fallbackStep?: string;    // Step to execute on terminal failure
}
```

## Deterministic Orchestration

1. **Same workflow + same context → same result:** No randomness in orchestration
2. **Explicit step ordering:** Steps execute sequentially (parallel support planned, not implemented)
3. **State transitions are rule-based:** State machines dictate valid transitions
4. **AI is a tool, not the conductor:** AI may provide inputs (classification, enrichment) but never decides workflow routing
5. **Events are the only coordination primitive:** No shared mutable state between engines

## Context Propagation Across Steps

Each step's output enriches the workflow context:

```typescript
// After step 1: create_contact
context.state = {
  ...context.state,
  contactId: "cnt_01JX...",
  contactName: "Juan Pérez"
};

// Step 2: create_opportunity reads from context.state
engine.execute("create_opportunity", {
  contactId: context.state.contactId,      // from step 1
  pipelineId: "pip_dental",
  stageId: "stage_consulta"
});
```

## Orchestration Invariants

1. **O1:** Every workflow execution has a unique `executionId`
2. **O2:** Every step execution emits `WorkflowStepExecuted` or `WorkflowStepFailed`
3. **O3:** `WorkflowCompleted` carries `totalSteps` and `completedSteps` counts
4. **O4:** State transitions MUST match the state machine definition
5. **O5:** Unknown engines produce `step.status = 'failed'`, not thrown exceptions
6. **O6:** Context is immutable between steps — each step gets a new context snapshot
