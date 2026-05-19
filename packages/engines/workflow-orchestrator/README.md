# @curdeeclau/workflow-orchestrator

Deterministic workflow orchestration runtime. Rules first, AI second.

## Phase 4 — Minimal Runtime

Event-driven coordination of engines, workflows, and state transitions.

## Architecture

```
WorkflowOrchestrator (top-level coordinator)
  ├── EventDispatcher        — in-memory pub/sub for DomainEvents
  ├── StateResolver          — validates transitions against StateMachine
  ├── WorkflowExecutor       — iterates steps, calls engines, collects results
  ├── EngineRegistry         — stores engine instances by name
  └── WorkflowRegistry       — stores workflow definitions by id
```

## Flow

```
Event received
  → EventDispatcher.dispatch(event)
  → WorkflowExecutor.execute(definition, context, triggerEvent)
    → StateResolver.validateTransition(fromState, event)
    → For each step:
      → EngineRegistry.get(step.engine).execute(step.action, context)
      → Emit WorkflowStepExecuted event
    → Emit WorkflowCompleted event
  → Return WorkflowContext
```

## API

```ts
const orchestrator = new WorkflowOrchestrator({ vertical: 'dental' });

// Registration
orchestrator.loadStateMachine(stateMachine);
orchestrator.loadWorkflow(workflowDefinition);
orchestrator.registerEngine(engine);

// Execution
const ctx = await orchestrator.execute('wf-triage', { patientId, symptoms });
await orchestrator.handleEvent(event);

// Query
orchestrator.getState(executionId);
orchestrator.getDispatcher().on('WorkflowCompleted', handler);
```

## Engine Contract

```ts
interface Engine {
  engineName: string;
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

Any engine implementing this contract can be registered and called by the orchestrator.

## Connection to Other Engines (Future)

| Engine | Integration |
|--------|-------------|
| `handoff-engine` | Register as `"handoff"` — step action `"evaluate_handoff"` triggers escalation |
| `calendar-engine` | Register as `"calendar"` — step action `"book_appointment"` reserves slot |
| `ghl-engine` | Register as `"ghl"` — step action `"create_contact"` syncs to CRM |
| `media-delivery-engine` | Register as `"media"` — step action `"send_pdf"` delivers documents |

## Prepared for Future

| Capability | Current (Phase 4) | Future |
|---|---|---|
| Event bus | In-memory `EventDispatcher` | Redis pub/sub, Kafka |
| State persistence | In-memory `Map<executionId, Context>` | PostgreSQL, Redis |
| Retries | `FailurePolicy` interface defined | Exponential backoff, DLQ |
| Multi-tenancy | `tenantId` on DomainEvent + Context | Tenant-scoped registries |
| Parallel steps | `StepType: "parallel"` defined | Concurrent executor |
| DAG workflows | `dependsOn` on WorkflowStep | Topological sort executor |
