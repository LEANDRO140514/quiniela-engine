# Spec: ghl-engine

## 1. Identity

| Field | Value |
|---|---|
| **Engine Name** | `ghl-engine` |
| **Package** | `@curdeeclau/ghl-engine` |
| **Contract** | `Engine` from `workflow-orchestrator` |
| **Domain** | CRM (Customer Relationship Management) |
| **Vertical Scope** | All (dental, academic, future) |
| **Runtime Model** | Provider-agnostic CRM with adapter pattern |
| **First Adapter** | GHL (GoHighLevel) — Phase 2 |

## 2. Canonical Entities

Defined in `packages/shared/src/crm/`. **The engine does not redefine these.**

### 2.1 CRMContact

```typescript
{
  id: ContactId;                    // "cnt_<ulid>" — canonical, immutable
  tenantId?: TenantId;              // "tnt_<ulid>"
  providerIds: Record<string, string>;  // { ghl: "...", chatwoot: "..." }
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;                   // E.164 preferred
  tags: string[];                   // free-form, deduplicated
  source?: string;                  // "whatsapp" | "web" | "referral" | "manual"
  createdAt: number;                // Unix ms
  updatedAt: number;                // Unix ms
  metadata: Record<string, unknown>; // extensible
}
```

### 2.2 CRMOpportunity

```typescript
{
  id: OpportunityId;                // "opp_<ulid>"
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  contactId: ContactId;             // MUST reference existing contact
  pipelineId: PipelineId;           // MUST reference existing pipeline
  stageId: string;                  // MUST be a valid stage in the pipeline
  status: 'open' | 'won' | 'lost' | 'abandoned';
  value?: number;
  currency?: string;                // ISO 4217
  expectedCloseAt?: number;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}
```

### 2.3 CRMPipeline

```typescript
{
  id: PipelineId;                   // "pip_<ulid>"
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  name: string;
  stages: PipelineStage[];          // ordered by stage.order
  active: boolean;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

PipelineStage {
  id: string;
  name: string;
  order: number;                    // unique within pipeline
  color?: string;
  metadata?: Record<string, unknown>;
}
```

### 2.4 CRMCampaign

```typescript
{
  id: CampaignId;                   // "cmp_<ulid>"
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  startAt?: number;
  endAt?: number;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}
```

## 3. Engine Contract

```typescript
interface Engine {
  readonly engineName: string;  // "ghl-engine"
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

The `context` parameter MUST carry:
- `conversationId?: string` — for ownership resolution
- `tenantId?: string` — for tenant scoping
- `workflowId?: string` — for event correlation
- `correlationId?: string` — for event chaining
- `actorId?: string` — for audit trail

## 4. Capabilities (actions)

### 4.1 create_contact

```
Input:  { name: string, phone?: string, email?: string, tags?: string[], source?: string, metadata?: {} }
Output: { contact: CRMContact }
Event:  ContactCreated { contact }
Errors: none (always succeeds)
```

### 4.2 update_contact

```
Input:  { contactId: string, changes: Partial<CRMContact> }
Output: { contact: CRMContact }
Event:  ContactUpdated { contactId, changes, previous }
Errors: CONTACT_NOT_FOUND
```

### 4.3 create_opportunity

```
Input:  { contactId: string, pipelineId: string, stageId: string, value?: number, currency?: string, metadata?: {} }
Output: { opportunity: CRMOpportunity }
Event:  OpportunityCreated { opportunity }
Errors: CONTACT_NOT_FOUND, PIPELINE_NOT_FOUND, INVALID_STAGE
```

### 4.4 move_opportunity

```
Input:  { opportunityId: string, targetStageId: string }
Output: { opportunity: CRMOpportunity }
Event:  OpportunityMoved { opportunityId, fromStage, toStage }
Errors: OPPORTUNITY_NOT_FOUND, INVALID_STAGE_TRANSITION, OPPORTUNITY_TERMINAL
```

### 4.5 add_tag

```
Input:  { contactId: string, tag: string }
Output: { contact: CRMContact }
Event:  TagAdded { contactId, tag }
Errors: CONTACT_NOT_FOUND
```

### 4.6 remove_tag

```
Input:  { contactId: string, tag: string }
Output: { contact: CRMContact }
Event:  TagRemoved { contactId, tag }
Errors: CONTACT_NOT_FOUND, TAG_NOT_FOUND
```

### 4.7 create_pipeline

```
Input:  { name: string, stages: { id: string, name: string, order: number, color?: string }[] }
Output: { pipeline: CRMPipeline }
Event:  PipelineCreated { pipeline }
Errors: INVALID_STAGES (must have >= 1 stage, orders must be unique)
```

### 4.8 create_campaign

```
Input:  { name: string, startAt?: number, endAt?: number }
Output: { campaign: CRMCampaign }
Event:  CampaignCreated { campaign }
Errors: INVALID_DATE_RANGE (startAt must be before endAt)
```

### 4.9 pause_campaign

```
Input:  { campaignId: string }
Output: { campaign: CRMCampaign }
Event:  CampaignPaused { campaignId, pausedAt }
Errors: CAMPAIGN_NOT_FOUND, CAMPAIGN_ALREADY_PAUSED, CAMPAIGN_ARCHIVED
```

### 4.10 resume_campaign

```
Input:  { campaignId: string }
Output: { campaign: CRMCampaign }
Event:  CampaignResumed { campaignId, resumedAt }
Errors: CAMPAIGN_NOT_FOUND, CAMPAIGN_NOT_PAUSED, CAMPAIGN_ARCHIVED
```

## 5. Event Catalog

All events conform to `DomainEvent` from `packages/shared/src/events/DomainEvent.ts`.

| Event Type | Required Payload Fields | causationId |
|---|---|---|
| `ContactCreated` | `contact: CRMContact` | execution's first event |
| `ContactUpdated` | `contactId, changes, previous` | event that triggered update |
| `OpportunityCreated` | `opportunity: CRMOpportunity` | `ContactCreated` or workflow step |
| `OpportunityMoved` | `opportunityId, fromStage, toStage` | workflow step event |
| `TagAdded` | `contactId, tag` | `ContactCreated` or `ContactUpdated` |
| `TagRemoved` | `contactId, tag` | `TagAdded` or `ContactUpdated` |
| `PipelineCreated` | `pipeline: CRMPipeline` | workflow step event |
| `CampaignCreated` | `campaign: CRMCampaign` | workflow step event |
| `CampaignPaused` | `campaignId, pausedAt` | workflow step event |
| `CampaignResumed` | `campaignId, resumedAt` | `CampaignPaused` or workflow step |

## 6. Invariants (MUST NOT be violated)

### 6.1 Identity Invariants

- **I1:** `providerIds` MUST be a separate map from the canonical `id`
- **I2:** Canonical `id` MUST use the correct prefix per entity type (`cnt_`, `opp_`, `pip_`, `cmp_`)
- **I3:** `providerIds` MUST NOT be used as the primary key in any engine operation
- **I4:** No two contacts may have the same `providerIds.ghl` value (for the same tenant)

### 6.2 Pipeline Invariants

- **I5:** Pipeline MUST have at least 1 stage
- **I6:** Stage `order` MUST be unique within a pipeline
- **I7:** `stageId` on an opportunity MUST reference a stage that exists in the opportunity's pipeline
- **I8:** Deactivating a pipeline (`active: false`) MUST NOT delete existing opportunities

### 6.3 Opportunity Invariants

- **I9:** `contactId` MUST reference an existing contact
- **I10:** `pipelineId` MUST reference an existing pipeline
- **I11:** Status `won`, `lost`, `abandoned` are TERMINAL — no further `move_opportunity`
- **I12:** `stageId` on creation MUST be a stage in the referenced pipeline

### 6.4 Campaign Invariants

- **I13:** `startAt` MUST be before `endAt` (if both are set)
- **I14:** Campaigns with status `archived` CANNOT be resumed or paused
- **I15:** Campaigns with status `completed` CANNOT be paused
- **I16:** Campaigns with status `draft` CANNOT be paused (must activate first)

### 6.5 Ownership Invariants

- **I17:** `LOCKED` ownership MUST block ALL CRM write operations
- **I18:** `SHARED` ownership MUST require explicit human approval for pipeline/opportunity mutations
- **I19:** Tag operations under `AI` ownership are allowed (AI can classify), but pipeline mutations are blocked

### 6.6 Event Invariants

- **I20:** EVERY CRM state mutation MUST emit a `DomainEvent`
- **I21:** Every event MUST carry `correlationId` when emitted within a workflow execution
- **I22:** Every event MUST carry `actorId` identifying who triggered the action

## 7. Ownership & Handoff Integration

ghl-engine reads ownership from the conversation context. It does NOT manage ownership — that is handoff-engine's responsibility.

```typescript
// Ownership gate in execute():
const owner = ownershipManager.getState(context.conversationId)?.owner ?? 'AI';

if (owner === 'LOCKED') {
  return { error: 'OWNERSHIP_LOCKED' };
}

const humanGatedActions = ['move_opportunity', 'pause_campaign', 'resume_campaign'];
if (humanGatedActions.includes(action) && owner === 'AI') {
  return { error: 'OWNERSHIP_INSUFFICIENT', message: 'Requires HUMAN or SHARED ownership' };
}
```

## 8. Workflow Orchestration Integration

ghl-engine is a standard engine. Any workflow step can call it:

```json
{
  "id": "create-crm-contact",
  "name": "Create CRM Contact",
  "type": "action",
  "engine": "ghl-engine",
  "action": "create_contact",
  "input": {
    "name": "{{state.contactName}}",
    "phone": "{{state.contactPhone}}",
    "source": "whatsapp"
  }
}
```

The workflow-orchestrator's `WorkflowExecutor` calls `engine.execute(action, context)` — the ghl-engine resolves the action, performs the CRM operation, emits an event, and returns the result to the workflow context.

## 9. CRMProvider Interface

```typescript
interface CRMProvider {
  readonly providerName: string;

  // Contacts
  createContact(data: CreateContactInput): Promise<CRMContact>;
  updateContact(id: ContactId, changes: Partial<CRMContact>): Promise<CRMContact>;
  getContact(id: ContactId): Promise<CRMContact | undefined>;
  findContactByProviderId(provider: string, providerId: string): Promise<CRMContact | undefined>;

  // Opportunities
  createOpportunity(data: CreateOpportunityInput): Promise<CRMOpportunity>;
  moveOpportunity(id: OpportunityId, stageId: string): Promise<CRMOpportunity>;
  getOpportunity(id: OpportunityId): Promise<CRMOpportunity | undefined>;

  // Pipelines
  createPipeline(data: CreatePipelineInput): Promise<CRMPipeline>;
  getPipeline(id: PipelineId): Promise<CRMPipeline | undefined>;

  // Campaigns
  createCampaign(data: CreateCampaignInput): Promise<CRMCampaign>;
  pauseCampaign(id: CampaignId): Promise<CRMCampaign>;
  resumeCampaign(id: CampaignId): Promise<CRMCampaign>;

  // Tags
  addTag(contactId: ContactId, tag: string): Promise<CRMContact>;
  removeTag(contactId: ContactId, tag: string): Promise<CRMContact>;
}
```

**Phase 1 implementation:** `InMemoryCRMProvider`
**Phase 2 implementation:** `GHLAdapter implements CRMProvider`
**Phase 4 implementation:** `PostgresCRMProvider implements CRMProvider`

## 10. Provider Abstraction Model

```
┌──────────────────────────────┐
│        GhlEngine              │  ← Engine contract + ownership gates + events
│   (owns CRMProvider ref)      │
└──────────┬───────────────────┘
           │ depends on interface (not implementation)
           ▼
┌──────────────────────────────┐
│      CRMProvider (interface)  │  ← Defined in this engine
└──────────┬───────────────────┘
           │
     ┌─────┴─────┬──────────────┐
     ▼           ▼              ▼
InMemoryCRM   GHLAdapter   PostgresCRM
Provider      (Phase 2)    Provider (Phase 4)
(Phase 1)
```

The engine NEVER imports GHL types directly. The GHL adapter is injected at construction time:

```typescript
// Phase 1
const engine = new GhlEngine({ provider: new InMemoryCRMProvider() });

// Phase 2
const engine = new GhlEngine({ provider: new GHLAdapter({ apiKey, locationId }) });
```

## 11. Error Model

All errors are **returned as structured results**, never thrown.

```typescript
// Success
{ contact: CRMContact }

// Error
{ error: "CONTACT_NOT_FOUND", message: "Contact cnt_xxx does not exist" }
{ error: "OWNERSHIP_LOCKED", message: "CRM writes blocked — ownership is LOCKED" }
{ error: "INVALID_STAGE_TRANSITION", message: "Stage 'closed' is not in pipeline 'pip_xxx'" }
{ error: "CAMPAIGN_ARCHIVED", message: "Campaign cmp_xxx is archived — cannot modify" }
{ error: "OPPORTUNITY_TERMINAL", message: "Opportunity opp_xxx has terminal status 'won'" }
```

## 12. Future: Multitenancy

All entities carry `tenantId: "tnt_<ulid>"`. Future enforcement:
- Engine resolves `tenantId` from `context.tenantId` at execute time
- `CRMProvider` implementations scope all queries by tenant
- Postgres RLS: `CREATE POLICY tenant_isolation ON contacts USING (tenant_id = current_setting('app.tenant_id'))`
- Workspace grouping: `workspaceId: "wsp_<ulid>"` for multi-clinic chains

## 13. Future: Observability

- Every event carries `correlationId` linking it to a workflow execution
- Every event carries `causationId` linking it to its parent event
- `metadata` on every entity and event for provider-specific tracing
- Event stream consumable by external analytics (Kafka, Postgres WAL, Supabase Realtime)

## 14. What This Spec Does NOT Cover

- GHL OAuth token lifecycle (Phase 2)
- Webhook signature verification (Phase 3)
- Database migrations (Phase 4)
- Analytics dashboards (Phase 5)
- Rate limiting and SLA enforcement (Phase 6)
- UI components for CRM management
