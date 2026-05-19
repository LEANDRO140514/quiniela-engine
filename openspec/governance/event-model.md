# Event Model

## Core Principle

> **Every state change produces an event. Every event carries identity, causality, and context.**

The DomainEvent is the universal communication primitive in Algorithmus Platform. All engines emit events. All orchestration reacts to events.

## DomainEvent Structure

```typescript
interface DomainEvent {
  id: string;              // "evt_<ulid>" — globally unique
  type: string;            // Event discriminator (e.g., "ContactCreated", "WorkflowStarted")
  timestamp: number;       // Unix ms — when the event occurred

  // Scoping
  tenantId?: string;       // "tnt_<ulid>" — tenant isolation
  workspaceId?: string;    // "wsp_<ulid>" — sub-tenant grouping
  verticalId?: string;     // "dental", "academic"

  // Routing
  conversationId?: string; // "conv_<ulid>" — conversation this belongs to
  workflowId?: string;     // "wfl_<ulid>" — workflow execution scope

  // Causality
  correlationId?: string;  // Ties events in the same causal flow
  causationId?: string;    // Points to the event that directly caused this one

  // Actor
  actorId?: string;        // Who triggered this (userId, engineName, "system")

  // Data
  payload?: unknown;       // Event-specific data
  metadata?: Record<string, unknown>;  // Extensible — provider traces, observability
}
```

## Event Causality Model

```
Event A (trigger)
  └─ causationId: null (root event)
     correlationId: "corr-abc"

Event B (reaction)
  └─ causationId: Event A.id
     correlationId: "corr-abc"  (same flow)

Event C (reaction)
  └─ causationId: Event B.id
     correlationId: "corr-abc"  (same flow)
```

### Rules

1. `correlationId` ties events in the SAME execution flow
2. `causationId` points to the IMMEDIATE parent event
3. Root events have no `causationId`
4. `correlationId` persists across engine boundaries
5. Every event in a workflow execution shares the same `correlationId`

## Event Categories

| Category | Event Types | Emitted By |
|---|---|---|
| **Workflow** | `WorkflowStarted`, `WorkflowStepExecuted`, `WorkflowStepFailed`, `WorkflowCompleted`, `WorkflowFailed` | workflow-orchestrator |
| **Handoff** | `HandoffRequested`, `HandoffAccepted`, `HandoffRejected`, `OwnershipChanged`, `SuppressionActivated`, `AIRecoveryStarted`, `AIRecovered`, `HandoffClosed` | handoff-engine |
| **CRM** | `ContactCreated`, `ContactUpdated`, `OpportunityCreated`, `OpportunityMoved`, `TagAdded`, `TagRemoved`, `PipelineCreated`, `CampaignCreated`, `CampaignPaused`, `CampaignResumed` | ghl-engine |
| **Messaging** | `MessageBuffered`, `ConversationReadyToFlush` | message-buffer-engine |
| **State** | `StateTransitioned` | any engine (generic state change) |

## Event Chaining

Events form a directed acyclic graph (DAG):

```
MessageBuffered
  → ConversationReadyToFlush
    → WorkflowStarted
      → WorkflowStepExecuted (classify)
        → WorkflowStepExecuted (handoff evaluate)
          → HandoffRequested
            → HandoffAccepted
              → OwnershipChanged
                → SuppressionActivated
                  → WorkflowCompleted
```

The `correlationId` ties this entire chain together. The `causationId` reconstructs the exact causal path.

## Event Invariants

1. **I-E1:** Every mutation that changes observable state MUST emit a DomainEvent
2. **I-E2:** Events within a workflow execution MUST share the same `correlationId`
3. **I-E3:** Every event that is a direct reaction MUST carry `causationId`
4. **I-E4:** `actorId` MUST identify who or what triggered the event (not "unknown")
5. **I-E5:** Events are IMMUTABLE after creation — no updates, no deletes
6. **I-E6:** Event IDs MUST be globally unique (use ULID or UUIDv7)
7. **I-E7:** Provider-specific data belongs in `metadata`, NEVER in `payload` structure

## Event Dispatch

Events flow through `EventDispatcher`:

```typescript
interface EventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
  on(eventType: string | '*', handler: EventHandler): void;
  off(eventType: string | '*', handler: EventHandler): void;
}
```

Handlers register for specific event types or use `'*'` for all events.

## Event Naming Convention

- Past tense, PascalCase: `ContactCreated`, `OpportunityMoved`, `HandoffRequested`
- Engine prefix implicit in domain: `CampaignPaused` (ghl-engine), `MessageBuffered` (message-buffer-engine)
- No duplication: if two engines can emit similar events, they share the same event type

## Provider Events → Canonical Events

Provider-specific events (GHL webhooks, WhatsApp callbacks) are **never** emitted directly. They are mapped to canonical events by the provider adapter:

```
GHL webhook: "contact.create"
  → GHLAdapter maps to
    → DomainEvent { type: "ContactCreated", payload: { contact } }
```

This ensures provider decoupling at the event layer.
