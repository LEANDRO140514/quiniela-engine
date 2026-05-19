# Proposal: create-ghl-engine

## Summary

Create `@curdeeclau/ghl-engine` — the first enterprise-grade CRM engine in Algorithmus Platform. GHL (GoHighLevel) will be the **first adapter**, not the runtime model. The engine itself is a provider-agnostic CRM runtime that governs contacts, opportunities, pipelines, and campaigns through deterministic, event-driven semantics.

## Problem

Algorithmus Platform currently has no CRM runtime. Conversations flow through message-buffer → classification → routing, but once a contact is identified or an opportunity emerges, there is no engine to:

- Create and manage contacts with provider-independent identity
- Track opportunities through pipeline stages
- Manage campaigns and their lifecycle
- Emit CRM lifecycle events for downstream orchestration
- Maintain ownership-aware write guards (AI vs HUMAN vs LOCKED)

Without this, Sarah (dental) and EVA (academic) cannot build pipeline-aware conversational flows.

## Why CRM Runtime Abstraction Matters

CRM is **not** a provider integration. CRM is:

1. **Contact identity** — canonical IDs decoupled from GHL/WhatsApp/Chatwoot
2. **Pipeline governance** — stages, transitions, business rules
3. **Opportunity tracking** — value, status, expected close
4. **Campaign lifecycle** — draft → active → paused → completed → archived
5. **Ownership-aware writes** — AI can suggest, HUMAN can commit, LOCKED blocks all

GHL, HubSpot, Pipedrive, and Notion are **providers**. The runtime model is **canonical**.

## Why GHL MUST NOT Define the Runtime Model

| Anti-pattern | Consequence |
|---|---|
| GHL contact ID as primary key | Locked to GHL; cannot migrate providers |
| GHL pipeline stages hardcoded | Vertical-specific pipelines become impossible |
| GHL webhook format as domain events | Provider coupling leaks into orchestration |
| GHL tags as canonical tags | No provider-agnostic tag governance |

**Correct approach:** canonical entities in `packages/shared/crm/` → provider adapters map to GHL schemas.

## Benefits

1. **Provider portability** — swap GHL for HubSpot without touching engine logic
2. **Vertical-agnostic** — same engine serves dental (Sarah) and academic (EVA)
3. **Deterministic governance** — CRM state transitions follow explicit rules, not AI decisions
4. **Event-driven** — every mutation emits a `DomainEvent` with `correlationId` + `causationId`
5. **Ownership-aware** — `LOCKED` ownership blocks all CRM writes (legal hold, audit)
6. **Multitenant-ready** — `tenantId` + `workspaceId` on every entity and event

## Relation to EVA Académica

EVA needs the same CRM primitives as Sarah:
- **Contact** — prospective student, parent, counselor
- **Opportunity** — enrollment application through admission pipeline
- **Campaign** — open house invitations, exam reminders

ghl-engine serves both verticals without modification.

## Relation to Sarah

Sarah already has `handoff-policy.json` defining human targets. ghl-engine provides:
- **CRMContact** for those targets (Directora Clínica, Recepcionista Senior, etc.)
- **CRMPipeline** for patient journey: Nuevo Paciente → Consulta → Tratamiento → Post-operatorio
- **CRMOpportunity** for treatment value tracking

## Deterministic Governance Principles

1. **AI can only suggest** — CRM mutations require explicit workflow steps or human approval
2. **Events are immutable** — every state change produces a `DomainEvent`; events are the audit log
3. **Provider IDs are metadata** — canonical `id` is the system of record; `providerIds.ghl` is an annotation
4. **Ownership gates writes** — `LOCKED` ownership blocks all CRM write operations
5. **No AI-in-the-loop for CRM** — pipeline advancement, tag assignment, campaign state changes are rule-driven

## Scope

**In scope for Fase 6B (implementation):**
- InMemoryCRMProvider with full CRUD for contacts, opportunities, pipelines, campaigns
- Engine contract compatible with workflow-orchestrator (`execute(action, context)`)
- Event emission for all CRM lifecycle events
- Ownership-aware write guards
- Tag management

**Out of scope:**
- Real GHL API integration (Fase 6C)
- OAuth, webhooks, realtime sync
- PostgreSQL persistence (prepared for, not implemented)
- UI dashboards
