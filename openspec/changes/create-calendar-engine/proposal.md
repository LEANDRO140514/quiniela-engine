# Proposal: create-calendar-engine

## Summary

Create `@curdeeclau/calendar-engine` — the first Temporal Runtime Coordination Engine in Algorithmus Platform. `calendar-engine` governs availability, reservations, scheduling conflicts, rescheduling, cancellations, and reminders through deterministic, event-driven temporal semantics. Google Calendar will be the **first adapter**, not the runtime model.

## Problem

Algorithmus Platform currently has message-buffer, workflow-orchestrator, handoff, and CRM engines. But there is no temporal coordination runtime. Conversations can create contacts, classify intents, and route to humans — but cannot:

- Check real availability before suggesting appointment times
- Create reservations with conflict detection
- Reschedule appointments preserving audit trail
- Cancel bookings and release time slots
- Schedule automated reminders tied to reservation lifecycle
- Enforce temporal ownership (who controls the calendar at runtime)

Without this, Sarah (dental) cannot book patient appointments, and EVA (academic) cannot schedule tutoring sessions through conversational flows.

## Why Calendar Engine Is NOT a Google Calendar Wrapper

Calendar coordination is **runtime governance**, not a provider integration:

| Concern | Runtime Governance | Provider Integration |
|---|---|---|
| Availability | Overlap detection, buffer windows, timezone normalization | Google FreeBusy API |
| Reservations | Lifecycle state machine (pending → confirmed → cancelled) | Google Calendar Event CRUD |
| Conflicts | Deterministic conflict resolution rules | Google Calendar conflict policy |
| Reminders | Event-driven, lifecycle-aware reminder triggers | Google Calendar notifications |
| Ownership | AI/HUMAN/SHARED/LOCKED temporal permission matrix | Google Calendar ACLs |
| Audit | DomainEvent chain with correlationId + causationId | Google Calendar change log |

Google Calendar, Outlook, Cal.com, and Calendly are **providers**. The runtime model is **canonical temporal coordination**.

## Why Google Calendar MUST NOT Define the Runtime Model

| Anti-pattern | Consequence |
|---|---|
| Google Calendar event ID as primary key | Locked to Google; cannot migrate to Outlook or Cal.com |
| Google FreeBusy as sole availability source | Cannot enforce buffer windows, timezone rules, or custom availability policies |
| Google Calendar notification as reminder model | Cannot coordinate multi-channel reminders (WhatsApp + email + SMS) |
| Google Calendar recurrence rules as canonical | ICCAL RRULE is provider-specific; canonical recurrence must be provider-agnostic |
| Google Calendar ACLs as ownership model | Cannot integrate with Algorithmus ownership governance (AI/HUMAN/SHARED/LOCKED) |

**Correct approach:** canonical temporal entities in `packages/shared/` → provider adapters map to Google Calendar / Outlook / Cal.com schemas.

## Benefits

1. **Provider portability** — swap Google Calendar for Outlook or Cal.com without touching engine logic
2. **Vertical-agnostic** — same engine serves dental appointments (Sarah), tutoring sessions (EVA), admission meetings
3. **Deterministic temporal governance** — conflict detection, rescheduling, and cancellation follow explicit rules
4. **Event-driven** — every temporal mutation emits a `DomainEvent` with `correlationId` + `causationId`
5. **Ownership-aware** — `LOCKED` ownership blocks all schedule mutations (legal hold, clinic closure)
6. **Multitenant-ready** — `tenantId` + `workspaceId` + `verticalId` on every entity and event
7. **Reminder lifecycle** — automated, event-driven reminders decoupled from provider notification systems

## Relation to Sarah Dental

Sarah needs:
- **Appointment booking** — Nuevo Paciente → Consulta → Tratamiento → Post-operatorio
- **Availability enforcement** — clinic hours, doctor schedules, buffer windows between procedures
- **Rescheduling** — patient cancels, clinic reschedules with audit trail
- **Reminders** — WhatsApp reminder 24h before, confirmation required
- **Conflict prevention** — no double-booked doctors or rooms

calendar-engine provides the temporal runtime; Google Calendar provides the calendar storage.

## Relation to EVA Académica

EVA needs:
- **Tutoring sessions** — student ↔ tutor matching with availability windows
- **Admission interviews** — scheduled, rescheduled, cancelled with event chain
- **Class scheduling** — recurring sessions with attendance tracking
- **Reminder automation** — email + WhatsApp before sessions

calendar-engine serves both verticals without modification.

## Deterministic Temporal Governance Principles

1. **Conflicts are rule-based, not AI-decided** — overlap detection is deterministic
2. **Events are immutable** — every reservation state change produces a `DomainEvent`
3. **Provider IDs are metadata** — canonical `id` is the system of record; `providerIds.google` is an annotation
4. **Ownership gates temporal writes** — `LOCKED` ownership blocks all schedule mutations
5. **Time is normalized** — all times stored as UTC Unix ms; timezone is presentation concern
6. **Buffer windows are policy** — configurable per vertical, per service type

## Scope

**In scope for Phase 7B (implementation):**
- InMemoryCalendarProvider with availability, reservations, time slots
- Engine contract compatible with workflow-orchestrator (`execute(action, context)`)
- Event emission for all temporal lifecycle events
- Ownership-aware write guards
- Conflict detection (overlap prevention)
- Reminder creation (event emission; actual delivery is Phase 3)

**Out of scope:**
- Real Google Calendar API integration (Phase 7C)
- Real Outlook / Cal.com integration
- OAuth, webhook sync
- PostgreSQL persistence (prepared for, not implemented)
- Actual reminder delivery (email/SMS/WhatsApp)
- Recurring appointments (ICCAL RRULE mapping)
- UI calendars or dashboards
