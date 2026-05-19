# Design: ghl-engine

## 1. Architecture Overview

```
┌─────────────────────────────────────────────┐
│            workflow-orchestrator             │
│  execute('create_contact', ctx)             │
│  execute('move_opportunity', ctx)           │
└──────────────────┬──────────────────────────┘
                   │ Engine Contract
                   ▼
┌─────────────────────────────────────────────┐
│              ghl-engine                      │
│  ┌───────────────────────────────────────┐  │
│  │         CRMProvider (interface)        │  │
│  │  createContact / updateContact        │  │
│  │  createOpportunity / moveOpportunity  │  │
│  │  addTag / removeTag                   │  │
│  │  pauseCampaign / resumeCampaign       │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │    InMemoryCRMProvider (Phase 1)       │  │
│  │    GHLAdapter        (Phase 2)         │  │
│  │    PostgresProvider  (Phase 4)         │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │         EventEmitter                   │  │
│  │  ContactCreated, OpportunityMoved...   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 2. Canonical Entities

All entities defined in `packages/shared/src/crm/`. The engine **does not redefine** them.

| Entity | Source | Canonical ID Prefix |
|---|---|---|
| `CRMContact` | `shared/crm/Contact.ts` | `cnt_` |
| `CRMOpportunity` | `shared/crm/Opportunity.ts` | `opp_` |
| `CRMPipeline` | `shared/crm/Pipeline.ts` | `pip_` |
| `CRMCampaign` | `shared/crm/Campaign.ts` | `cmp_` |

**Provider ID separation (mandatory):**
```typescript
{
  id: "cnt_01JX2K5N8P3Q",       // canonical — never changes
  providerIds: {
    ghl: "ghl_contact_123",      // provider-specific — can change
    chatwoot: "cw_456"
  }
}
```

## 3. Engine Capabilities

The engine implements the standard Algorithmus `Engine` contract:

```typescript
interface Engine {
  readonly engineName: string;  // "ghl-engine"
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

**Supported actions:**

| Action | Input | Output | Side Effects |
|---|---|---|---|
| `create_contact` | `{ name, phone?, email?, tags?[], source? }` | `CRMContact` | emits `ContactCreated` |
| `update_contact` | `{ contactId, changes }` | `CRMContact` | emits `ContactUpdated` |
| `create_opportunity` | `{ contactId, pipelineId, stageId, value?, currency? }` | `CRMOpportunity` | emits `OpportunityCreated` |
| `move_opportunity` | `{ opportunityId, targetStageId }` | `CRMOpportunity` | emits `OpportunityMoved` |
| `add_tag` | `{ contactId, tag }` | `CRMContact` | emits `TagAdded` |
| `remove_tag` | `{ contactId, tag }` | `CRMContact` | emits `TagRemoved` |
| `create_pipeline` | `{ name, stages[] }` | `CRMPipeline` | emits `PipelineCreated` |
| `create_campaign` | `{ name, startAt?, endAt? }` | `CRMCampaign` | emits `CampaignCreated` |
| `pause_campaign` | `{ campaignId }` | `CRMCampaign` | emits `CampaignPaused` |
| `resume_campaign` | `{ campaignId }` | `CRMCampaign` | emits `CampaignResumed` |

## 4. Event Lifecycle

All events conform to `DomainEvent` from `packages/shared/src/events/DomainEvent.ts`.

**Event catalog:**

| Event Type | Payload | causationId chain |
|---|---|---|
| `ContactCreated` | `{ contact: CRMContact }` | parent event or execution |
| `ContactUpdated` | `{ contactId, changes, previous }` | parent event |
| `OpportunityCreated` | `{ opportunity: CRMOpportunity }` | parent event |
| `OpportunityMoved` | `{ opportunityId, fromStage, toStage }` | parent event |
| `TagAdded` | `{ contactId, tag }` | parent event |
| `TagRemoved` | `{ contactId, tag }` | parent event |
| `PipelineCreated` | `{ pipeline: CRMPipeline }` | parent event |
| `CampaignCreated` | `{ campaign: CRMCampaign }` | parent event |
| `CampaignPaused` | `{ campaignId, pausedAt }` | parent event |
| `CampaignResumed` | `{ campaignId, resumedAt }` | parent event |

**Event shape (canonical):**
```typescript
{
  id: "evt_01JX...",
  type: "ContactCreated",
  timestamp: 1715872800000,
  tenantId: "tnt_clinica1",
  workspaceId: "wsp_default",
  conversationId: "conv_c1",       // optional — which conversation triggered this
  workflowId: "wfl_new_patient",    // optional — which workflow is running
  correlationId: "corr-abc123",     // ties events in the same execution
  causationId: "evt_parent_event",  // points to the event that caused this one
  actorId: "usr_admin",            // who performed the action
  verticalId: "dental",
  payload: { contact: { ... } },
  metadata: { source: "whatsapp" }
}
```

## 5. Pipeline Lifecycle

```
Pipeline created (active: true)
  │
  ├─ Stages defined in order
  │   stage-1: "Nuevo Lead"
  │   stage-2: "Contactado"
  │   stage-3: "Consulta Programada"
  │   stage-4: "Tratamiento Aceptado"
  │   stage-5: "Pagado"
  │
  └─ Pipeline deactivated → opportunities freeze
```

**Invariants:**
- Pipeline must have at least 1 stage
- Stage `order` must be unique within a pipeline
- Deactivating a pipeline does not delete existing opportunities

## 6. Opportunity Lifecycle

```
Opportunity created (status: "open")
  │
  ├─ Moves through pipeline stages
  │   moveOpportunity(oppId, nextStage)
  │
  ├─ Status transitions:
  │   open → won    (deal closed successfully)
  │   open → lost   (deal lost to competitor or inaction)
  │   open → abandoned (contact unresponsive)
  │
  └─ Immutable fields: id, contactId, createdAt
```

**Invariants:**
- `pipelineId` must reference an existing pipeline
- `stageId` must be a valid stage in that pipeline
- `contactId` must reference an existing contact
- Status `won`/`lost`/`abandoned` is terminal — no further moves
- Moving to an earlier stage requires explicit `moveOpportunity` with that stage

## 7. Contact Lifecycle

```
Contact created
  │
  ├─ Tags added/removed
  │   addTag(contactId, "vip")
  │   removeTag(contactId, "cold")
  │
  ├─ Fields updated
  │   updateContact(contactId, { phone, email, name })
  │
  └─ Source tracked (whatsapp, web, referral, manual)
```

**Invariants:**
- `id` is immutable after creation
- `providerIds` can be added/updated but never removed (audit trail)
- Tags are free-form strings; deduplication is the engine's responsibility

## 8. Campaign Lifecycle

```
Campaign created (status: "draft")
  │
  ├─ Activated (status: "active")
  │   │
  │   ├─ Paused (status: "paused")
  │   │   └─ Resumed (status: "active")
  │   │
  │   └─ Completed (status: "completed")
  │       └─ Archived (status: "archived")
  │
  └─ Archived directly from draft
```

**Invariants:**
- Cannot resume an archived campaign
- Cannot pause a completed campaign
- `startAt` must be before `endAt`
- Campaigns in `draft` cannot emit campaign events to contacts

## 9. Ownership Integration

ghl-engine reads ownership state from `packages/shared/src/runtime/Ownership.ts`.

| Ownership | CRM Write Permissions |
|---|---|
| `AI` | Can create/update contacts, add tags (suggestions) |
| `HUMAN` | Full CRUD — can move opportunities, manage campaigns |
| `SHARED` | AI suggests, human confirms — write through approval gate |
| `LOCKED` | **All writes blocked** — legal hold, audit mode |

**Ownership gating in execute():**
```typescript
execute(action, context) {
  const owner = ownershipManager.getState(context.conversationId)?.owner ?? 'AI';
  
  if (owner === 'LOCKED') {
    return { error: 'OWNERSHIP_LOCKED', message: 'CRM writes blocked' };
  }
  
  if (owner === 'SHARED' && !context.approvedBy) {
    return { error: 'APPROVAL_REQUIRED', message: 'Human approval needed' };
  }
  
  // proceed with CRM operation
}
```

## 10. Workflow Orchestration Integration

```
workflow-orchestrator
  │
  ├─ Step: "create_contact"
  │   └─ engine: "ghl-engine"
  │       action: "create_contact"
  │       → ContactCreated event
  │
  ├─ Step: "create_opportunity"
  │   └─ engine: "ghl-engine"
  │       action: "create_opportunity"
  │       → OpportunityCreated event
  │
  └─ Step: "move_opportunity"
      └─ engine: "ghl-engine"
          action: "move_opportunity"
          → OpportunityMoved event
          → triggers next workflow step
```

**Example: wf-new-patient workflow integration:**
```json
{
  "steps": [
    { "id": "s1", "engine": "message-buffer", "action": "process_buffer" },
    { "id": "s2", "engine": "knowledge-engine", "action": "classify_intent" },
    { "id": "s3", "engine": "ghl-engine", "action": "create_contact" },
    { "id": "s4", "engine": "ghl-engine", "action": "create_opportunity" },
    { "id": "s5", "engine": "calendar-engine", "action": "schedule_appointment" }
  ]
}
```

## 11. CRMProvider Interface (Provider Abstraction)

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

**Implementations:**
- `InMemoryCRMProvider` — Phase 1 (this implementation)
- `GHLAdapter` — Phase 2 (wraps GHL API)
- `PostgresCRMProvider` — Phase 4 (direct Supabase/Postgres)

## 12. Future Persistence Strategy

**Phase 1 (now):** InMemoryCRMProvider — Maps, no persistence
**Phase 4 (future):** PostgresCRMProvider — Supabase Postgres with:
- `contacts` table → rows match `CRMContact` fields
- `opportunities` table → rows match `CRMOpportunity` fields
- `pipelines` table → rows match `CRMPipeline` fields
- `campaigns` table → rows match `CRMCampaign` fields
- `provider_ids` JSONB column for `providerIds`
- `metadata` JSONB column for extensibility

## 13. Future Multitenancy Strategy

All entities carry `tenantId`. Future implementation:
- Row-Level Security (RLS) on `tenant_id` column in Postgres
- `workspaceId` for sub-tenant grouping (multi-clinic dental chains)
- Engine resolves tenant from `context.tenantId` at execute time

## 14. Failure Modes

| Failure | Behavior |
|---|---|
| Invalid pipeline ID | `execute()` returns `{ error: "PIPELINE_NOT_FOUND" }` |
| Missing contact | `execute()` returns `{ error: "CONTACT_NOT_FOUND" }` |
| Duplicate providerId | `execute()` returns `{ error: "DUPLICATE_PROVIDER_ID" }` |
| LOCKED ownership | `execute()` returns `{ error: "OWNERSHIP_LOCKED" }` |
| Campaign already paused | `execute()` returns `{ error: "CAMPAIGN_ALREADY_PAUSED" }` |
| Campaign archived | `execute()` returns `{ error: "CAMPAIGN_ARCHIVED" }` |
| Invalid stage transition | `execute()` returns `{ error: "INVALID_STAGE_TRANSITION" }` |
| Provider unavailable | GHLAdapter returns `{ error: "PROVIDER_UNAVAILABLE" }` (Phase 2) |

All errors are returned as structured results — **never thrown**. This preserves workflow-orchestrator step failure handling.

## 15. Observability

Every CRM mutation emits:
- `correlationId` — ties events to a single workflow execution
- `causationId` — points to the event that triggered this mutation
- `actorId` — identifies the user, engine, or system
- `metadata` — extensible bag for provider-specific tracing data
