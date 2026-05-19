# Tasks Template

Use this template for the incremental implementation roadmap.

---

# Tasks: <change-name>

## Fase 1 — Core Implementation

**Goal:** [One sentence describing the deliverable]

- [ ] Create package scaffolding (`package.json`, `tsconfig.json`)
- [ ] Define core interfaces/types
- [ ] Implement main engine class (implements `Engine` contract)
- [ ] Implement `InMemoryProvider` with Maps
- [ ] Wire event emission via `emitFn`
- [ ] Wire ownership gating
- [ ] Export public API in `src/index.ts`
- [ ] Write tests: `<unit>.test.ts` files
- [ ] Verify: typecheck, tests passing, workspace integrity

**Deliverable:** Working engine usable by workflow-orchestrator.

## Fase 2 — Provider Adapter

**Goal:** [One sentence]

- [ ] Implement adapter class implementing provider interface
- [ ] Map canonical entities ↔ provider schemas
- [ ] Provider ID mapping (`providerIds.provider = externalId`)
- [ ] Error handling: rate limits, timeouts, provider errors
- [ ] Tests with mocked provider API

**Deliverable:** Provider-backed engine — same interface, real external system.

## Fase 3 — Webhooks / Events

**Goal:** [One sentence]

- [ ] Inbound event handler
- [ ] Map provider events → canonical `DomainEvent` types
- [ ] Enqueue events to workflow-orchestrator
- [ ] Idempotency: deduplicate by provider event ID

**Deliverable:** Real-time sync — external changes trigger workflows.

## Fase 4 — Persistence

**Goal:** [One sentence]

- [ ] Implement `PostgresProvider`
- [ ] Schema: tables, columns, JSONB for extensible fields
- [ ] RLS policies for `tenant_id`
- [ ] Migrations
- [ ] Tests with real Postgres

**Deliverable:** Persistent storage — data survives restarts.

## Fase 5 — Analytics / Observability

**Goal:** [One sentence]

- [ ] Metrics definition
- [ ] Dashboard queries
- [ ] Event stream for external ingestion

**Deliverable:** Operational visibility.

## Fase 6 — Multitenancy

**Goal:** [One sentence]

- [ ] `tenantId` enforcement on all queries
- [ ] `workspaceId` sub-tenant grouping
- [ ] Per-tenant provider configuration
- [ ] Tenant provisioning / deprovisioning

**Deliverable:** Fully isolated multi-tenant CRM.
