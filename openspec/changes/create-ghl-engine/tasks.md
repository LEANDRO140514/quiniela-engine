# Tasks: create-ghl-engine

## Fase 1 — InMemoryCRMProvider + Engine Core

**Goal:** Fully functional CRM engine with in-memory storage. All CRUD operations, event emission, ownership gating.

- [ ] Create `packages/engines/ghl-engine/` with `package.json`, `tsconfig.json`
- [ ] Define `CRMProvider` interface in `src/provider/CRMProvider.ts`
- [ ] Implement `InMemoryCRMProvider` with Maps for contacts, opportunities, pipelines, campaigns
- [ ] Implement `GhlEngine` class implementing `Engine` contract (`engineName` + `execute`)
- [ ] Wire `OwnershipManager` integration — LOCKED blocks writes, SHARED requires approval
- [ ] Implement `execute()` action router: `create_contact`, `update_contact`, `create_opportunity`, `move_opportunity`, `add_tag`, `remove_tag`, `create_pipeline`, `create_campaign`, `pause_campaign`, `resume_campaign`
- [ ] Wire `DomainEvent` emission via `emitFn` callback — every mutation produces an event
- [ ] Export public types and classes in `src/index.ts`
- [ ] Write tests: `contact.test.ts`, `opportunity.test.ts`, `pipeline.test.ts`, `campaign.test.ts`, `integration.test.ts`
- [ ] Verify: typecheck, tests passing, workspace integrity

**Deliverable:** Working CRM engine usable by workflow-orchestrator and handoff-engine.

## Fase 2 — GHL Adapter

**Goal:** Real GHL API integration as a `CRMProvider` implementation.

- [ ] Implement `GHLAdapter` class implementing `CRMProvider`
- [ ] GHL OAuth token management (refresh, expiry)
- [ ] Map canonical entities ↔ GHL API schemas:
  - `CRMContact` ↔ GHL Contact
  - `CRMOpportunity` ↔ GHL Opportunity
  - `CRMPipeline` ↔ GHL Pipeline
  - `CRMCampaign` ↔ GHL Campaign
- [ ] Provider ID mapping: `providerIds.ghl = ghlContact.id` on create/update
- [ ] Error handling: GHL rate limits, timeouts, 5xx → `PROVIDER_UNAVAILABLE`
- [ ] Tests with mocked GHL API
- [ ] Config: `GHLAdapter` takes `apiKey`, `locationId`, `baseUrl`

**Deliverable:** GHL-backed CRM engine — same interface, real provider.

## Fase 3 — Webhooks

**Goal:** Inbound GHL webhooks → DomainEvent → workflow triggers.

- [ ] Webhook endpoint handler (future: Next.js API route or Supabase Edge Function)
- [ ] Webhook signature verification
- [ ] Map GHL webhook types → canonical `DomainEvent` types:
  - `ContactCreate` → `ContactCreated`
  - `ContactUpdate` → `ContactUpdated`
  - `OpportunityCreate` → `OpportunityCreated`
  - `OpportunityMove` → `OpportunityMoved`
- [ ] Enqueue events to workflow-orchestrator
- [ ] Idempotency: deduplicate by GHL webhook `id`

**Deliverable:** Real-time CRM sync — GHL changes trigger workflows.

## Fase 4 — Persistence Real

**Goal:** PostgreSQL-backed CRM storage.

- [ ] Implement `PostgresCRMProvider` (Supabase/Postgres)
- [ ] Schema: `contacts`, `opportunities`, `pipelines`, `campaigns`
- [ ] JSONB columns for `providerIds` and `metadata`
- [ ] RLS policies for `tenant_id`
- [ ] Migrations
- [ ] Tests with real Postgres (testcontainers or Supabase local)

**Deliverable:** Persistent CRM — data survives restarts.

## Fase 5 — Analytics

**Goal:** CRM observability and pipeline analytics.

- [ ] Pipeline velocity metrics (time-in-stage)
- [ ] Conversion rates (open → won, open → lost)
- [ ] Campaign performance (contacts reached, opportunities generated)
- [ ] Tag distribution analytics
- [ ] Event stream for external analytics ingestion

**Deliverable:** CRM dashboards and reporting.

## Fase 6 — Multitenancy

**Goal:** Full tenant isolation.

- [ ] `tenantId` enforcement on all queries
- [ ] `workspaceId` for sub-tenant grouping
- [ ] Tenant-aware rate limiting
- [ ] Per-tenant CRM provider configuration (tenant A uses GHL, tenant B uses HubSpot)
- [ ] Tenant provisioning / deprovisioning

**Deliverable:** Multi-clinic, multi-vertical CRM isolation.
