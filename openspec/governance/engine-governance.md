# Engine Governance

## Core Principle

> **No engine without a spec. No spec without invariants. No invariants without verification.**

Every engine in Algorithmus Platform is governed by a formal specification. The spec is the source of truth; the implementation is a verification that the spec is correct and complete.

## Engine Requirements

Every engine MUST satisfy these requirements:

### 1. Deterministic-First

- All state transitions are rule-based, not AI-decided
- `execute(action, context)` is a pure-ish function: same inputs → same outputs
- AI may suggest actions, but the engine executes them deterministically

### 2. Provider-Agnostic

- The engine's runtime model MUST NOT depend on any provider (GHL, Chatwoot, WhatsApp)
- Provider-specific logic lives in adapters implementing the engine's provider interface
- Canonical entities live in `packages/shared/` — engines reference them, never redefine them

### 3. Ownership-Aware

- Every engine reads ownership state from `shared/runtime/Ownership.ts`
- Engine actions are gated by ownership:
  - `AI`: AI-initiated actions allowed (classification, tagging, suggestions)
  - `HUMAN`: Full CRUD, pipeline mutations, campaign management
  - `SHARED`: AI suggests, human approves via explicit approval gate
  - `LOCKED`: All write operations blocked

### 4. Event-Driven

- Every mutation emits a `DomainEvent` from `shared/events/DomainEvent.ts`
- Events carry `correlationId` for workflow tracing
- Events carry `causationId` for causal chain reconstruction
- Events carry `actorId` for audit trail
- No silent state changes — if it changed, it emitted an event

### 5. Runtime-Oriented

- The engine is a runtime component, not a library
- It implements the `Engine` contract:
  ```typescript
  interface Engine {
    readonly engineName: string;
    execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
  }
  ```
- It is called by `workflow-orchestrator`, not by application code directly

## Engine Contract

```typescript
interface Engine {
  /** Unique engine identifier. Used by workflow steps to route actions. */
  readonly engineName: string;

  /**
   * Execute an action within a runtime context.
   *
   * @param action  The action to perform (e.g., "create_contact", "move_opportunity")
   * @param context The runtime context: conversationId, tenantId, workflowId, correlationId, actorId
   * @returns       Structured result: { success, data } or { error, message }
   *
   * NEVER throws. Errors are returned as structured results.
   */
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

## Engine Lifecycle

```
OpenSpec proposal
  → OpenSpec design
    → OpenSpec spec
      → Implementation (InMemory provider)
        → Tests (unit + integration)
          → Provider adapter (GHL, Chatwoot, etc.)
            → Persistence (Postgres)
              → Observability (metrics, tracing)
                → Multitenancy (tenant isolation)
```

## Prohibited Patterns

- ❌ Engine directly calling a provider API (use adapter interface)
- ❌ Engine managing its own ownership state (delegate to `shared/runtime/Ownership`)
- ❌ Engine throwing exceptions for business logic errors (return structured errors)
- ❌ Engine depending on framework-specific code (Next.js, Express)
- ❌ Engine hardcoding provider IDs as primary keys
- ❌ Engine making AI decisions autonomously
- ❌ Engine with silent side effects (no event emitted)

## Required Artifacts

Every engine MUST have:

1. **OpenSpec change folder** in `openspec/changes/<engine-name>/`
2. **Formal spec** in `openspec/changes/<engine-name>/specs/<engine-name>.md`
3. **Tests** proving every invariant holds
4. **Index export** in `src/index.ts` exporting the engine class and its types
5. **TypeScript** with strict mode, no `any`, explicit return types on public methods
