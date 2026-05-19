# Tasks: create-calendar-engine

## Fase 1 — InMemoryCalendarProvider + Engine Core

**Goal:** Fully functional temporal coordination engine with in-memory storage. Availability checking, reservation CRUD, conflict detection, reminder lifecycle, ownership gating.

- [ ] Create `packages/engines/calendar-engine/` with `package.json`, `tsconfig.json`
- [ ] Define canonical temporal entities in `packages/shared/src/calendar/`:
  - `Calendar.ts` — `Calendar`, `AvailabilityWindow`
  - `TimeSlot.ts` — `TimeSlot` with status lifecycle
  - `Reservation.ts` — `Reservation` with status lifecycle
  - `Reminder.ts` — `Reminder` with type/channel/status
- [ ] Define `CalendarProvider` interface in `src/providers/CalendarProvider.ts`
- [ ] Implement `InMemoryCalendarProvider` with Maps for calendars, time slots, reservations, reminders
- [ ] Implement `ConflictDetector` — deterministic overlap detection with buffer windows
- [ ] Implement `CalendarEngine` class implementing `Engine` contract (`engineName` + `execute`)
- [ ] Wire `OwnershipGuard` integration — LOCKED blocks writes, AI cannot create reservations, SHARED requires approval
- [ ] Implement `execute()` action router:
  - `check_availability`, `create_reservation`, `cancel_reservation`, `reschedule_reservation`
  - `block_time_slot`, `release_time_slot`
  - `create_reminder`, `cancel_reminder`
- [ ] Wire `DomainEvent` emission — every mutation produces an event with correlationId + causationId
- [ ] Implement rescheduling as atomic cancel + create with link metadata
- [ ] Implement cascading reminder cancellation on reservation cancel
- [ ] Export public types and classes in `src/index.ts`
- [ ] Write tests:
  - `availability.test.ts` — check availability, conflict detection, buffer windows
  - `reservations.test.ts` — create, cancel, reschedule lifecycle
  - `timeslots.test.ts` — block, release, status transitions
  - `reminders.test.ts` — create, trigger, cancel, cascade
  - `ownership.test.ts` — LOCKED/AI/HUMAN/SHARED temporal permissions
  - `orchestration.test.ts` — Engine contract, event emission, correlation
  - `integration.test.ts` — End-to-end booking → reschedule → cancel workflow
- [ ] Verify: typecheck, tests passing, workspace integrity

**Deliverable:** Working temporal coordination engine usable by workflow-orchestrator, handoff-engine, and CRM engine.

## Fase 2 — Google Calendar Adapter + Outlook Adapter

**Goal:** Real calendar provider integrations as `CalendarProvider` implementations.

- [ ] Implement `GoogleCalendarAdapter` class implementing `CalendarProvider`
- [ ] Google OAuth token management (refresh, expiry)
- [ ] Map canonical entities ↔ Google Calendar API:
  - `Calendar` ↔ Google Calendar
  - `TimeSlot` ↔ Google Calendar FreeBusy
  - `Reservation` ↔ Google Calendar Event
  - `Reminder` ↔ Google Calendar Notification (or custom)
- [ ] Provider ID mapping: `providerIds.google = googleEvent.id` on create
- [ ] Implement `OutlookCalendarAdapter` class implementing `CalendarProvider`
- [ ] Microsoft Graph API token management
- [ ] Map canonical entities ↔ Outlook Calendar API
- [ ] Error handling: rate limits, timeouts, 5xx → `PROVIDER_UNAVAILABLE`
- [ ] Tests with mocked Google/Outlook APIs

**Deliverable:** Google + Outlook backed calendar engine — same interface, real providers.

## Fase 3 — Reminders Delivery

**Goal:** Actual reminder delivery via notification channels.

- [ ] Implement reminder scheduler (poll-based for Phase 3, event-driven later)
- [ ] Channel adapters: WhatsApp (via chatwoot-engine), Email (via SMTP/SendGrid), SMS (via Twilio)
- [ ] Reminder trigger → delivery → status update (triggered/failed)
- [ ] Retry policy: max 3 attempts with exponential backoff
- [ ] Reminder template rendering (contact name, appointment time, clinic name)
- [ ] Tests with fake channels

**Deliverable:** Real reminder delivery — WhatsApp, email, SMS.

## Fase 4 — Persistence Real

**Goal:** PostgreSQL-backed temporal storage.

- [ ] Implement `PostgresCalendarProvider` (Supabase/Postgres)
- [ ] Schema: `calendars`, `time_slots`, `reservations`, `reminders`, `availability_windows`
- [ ] Temporal range indexes: `GIST (tstzrange(start_at, end_at))` for efficient overlap queries
- [ ] JSONB columns for `providerIds` and `metadata`
- [ ] RLS policies for `tenant_id`
- [ ] Migrations
- [ ] Tests with real Postgres (testcontainers or Supabase local)

**Deliverable:** Persistent calendar — data survives restarts, efficient temporal queries.

## Fase 5 — Analytics

**Goal:** Temporal observability and scheduling analytics.

- [ ] Appointment volume metrics (per day/week/month, per calendar, per vertical)
- [ ] No-show rate analytics
- [ ] Cancellation reason distribution
- [ ] Rescheduling frequency (how many appointments get rescheduled before completion)
- [ ] Time-to-booking (from first contact to confirmed reservation)
- [ ] Reminder effectiveness (confirmation rate after reminder)
- [ ] Peak hour/day analysis for capacity planning
- [ ] Event stream for external analytics ingestion

**Deliverable:** Calendar dashboards and scheduling insights.

## Fase 6 — Multitenancy + Recurring Appointments

**Goal:** Full tenant isolation and recurring booking support.

- [ ] `tenantId` enforcement on all queries
- [ ] `workspaceId` for sub-tenant grouping
- [ ] `verticalId` for vertical-specific availability policies
- [ ] Per-tenant calendar provider configuration
- [ ] Recurring appointment support (ICCAL RRULE mapping to canonical recurrence)
- [ ] Recurring reservation CRUD with "this event" vs "all events" semantics
- [ ] Tenant provisioning / deprovisioning

**Deliverable:** Multi-clinic, multi-vertical temporal isolation with recurrence.
