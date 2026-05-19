# Spec: calendar-engine

## 1. Identity

| Field | Value |
|---|---|
| **Engine Name** | `calendar-engine` |
| **Package** | `@curdeeclau/calendar-engine` |
| **Contract** | `Engine` from `workflow-orchestrator` |
| **Domain** | Temporal Coordination (scheduling, availability, reservations, reminders) |
| **Vertical Scope** | All (dental, academic, future) |
| **Runtime Model** | Provider-agnostic temporal coordination with adapter pattern |
| **First Adapter** | Google Calendar — Phase 2 |

## 2. Canonical Entities

Defined in `packages/shared/src/calendar/`. **The engine does not redefine these.**

### 2.1 Calendar

```typescript
{
  id: CalendarId;                    // "cal_<ulid>" — canonical, immutable
  tenantId?: TenantId;               // "tnt_<ulid>"
  providerIds: Record<string, string>;  // { google: "...", outlook: "..." }
  name: string;                      // "Clínica Dental — Dr. Ramírez"
  timezone: string;                  // IANA timezone (e.g. "America/Mexico_City")
  availabilityWindows: AvailabilityWindow[];
  active: boolean;
  createdAt: number;                 // Unix ms
  updatedAt: number;                 // Unix ms
  metadata: Record<string, unknown>; // extensible
}

AvailabilityWindow {
  id: string;                        // "avw_<ulid>"
  calendarId: CalendarId;
  daysOfWeek: number[];              // 0=Sun..6=Sat
  startTime: string;                 // "09:00"
  endTime: string;                   // "18:00"
  bufferBeforeMs?: number;
  bufferAfterMs?: number;
  slotDurationMs: number;
  validFrom?: number;
  validUntil?: number;
  metadata?: Record<string, unknown>;
}
```

### 2.2 TimeSlot

```typescript
{
  id: TimeSlotId;                    // "tsl_<ulid>"
  calendarId: CalendarId;
  startAt: number;                   // Unix ms
  endAt: number;                     // Unix ms
  status: 'available' | 'blocked' | 'reserved';
  reservationId?: ReservationId;
  metadata?: Record<string, unknown>;
}
```

### 2.3 Reservation

```typescript
{
  id: ReservationId;                 // "rsv_<ulid>"
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  calendarId: CalendarId;
  timeSlotId: TimeSlotId;
  contactId?: ContactId;             // from CRM — who this reservation is for
  title: string;
  description?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  startAt: number;                   // Unix ms
  endAt: number;                     // Unix ms
  createdAt: number;
  updatedAt: number;
  cancelledAt?: number;
  cancellationReason?: string;
  metadata: Record<string, unknown>;
}
```

### 2.4 Reminder

```typescript
{
  id: ReminderId;                    // "rmd_<ulid>"
  reservationId: ReservationId;
  type: 'confirmation_request' | 'upcoming' | 'follow_up' | 'custom';
  channel: 'whatsapp' | 'email' | 'sms' | 'push';
  scheduledAt: number;               // Unix ms — when to trigger
  triggeredAt?: number;
  status: 'scheduled' | 'triggered' | 'cancelled' | 'failed';
  message?: string;
  createdAt: number;
  metadata: Record<string, unknown>;
}
```

## 3. Engine Contract

```typescript
interface Engine {
  readonly engineName: string;  // "calendar-engine"
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

### 4.1 check_availability

```
Input:  { calendarId: string, startAt: number, endAt: number }
Output: { available: boolean, conflictingSlots?: TimeSlot[], suggestions?: TimeSlot[] }
Event:  AvailabilityChecked { calendarId, startAt, endAt, available }
Errors: CALENDAR_NOT_FOUND, INVALID_TIME_RANGE
```

### 4.2 create_reservation

```
Input:  { calendarId: string, startAt: number, endAt: number, title: string, contactId?: string, description?: string }
Output: { reservation: Reservation }
Event:  ReservationCreated { reservation }
Errors: CALENDAR_NOT_FOUND, TIME_SLOT_UNAVAILABLE, INVALID_TIME_RANGE
```

### 4.3 cancel_reservation

```
Input:  { reservationId: string, reason?: string }
Output: { reservation: Reservation }
Event:  ReservationCancelled { reservationId, reason?, previousStatus }
Errors: RESERVATION_NOT_FOUND, ALREADY_CANCELLED, RESERVATION_TERMINAL
```

### 4.4 reschedule_reservation

```
Input:  { reservationId: string, newStartAt: number, newEndAt: number }
Output: { reservation: Reservation, previous: Reservation }
Event:  ReservationRescheduled { reservation, previous }
Errors: RESERVATION_NOT_FOUND, TIME_SLOT_UNAVAILABLE, INVALID_TIME_RANGE, RESERVATION_TERMINAL
```

### 4.5 block_time_slot

```
Input:  { calendarId: string, startAt: number, endAt: number, reason?: string }
Output: { timeSlot: TimeSlot }
Event:  TimeSlotBlocked { timeSlot, reason? }
Errors: CALENDAR_NOT_FOUND, TIME_SLOT_UNAVAILABLE, INVALID_TIME_RANGE
```

### 4.6 release_time_slot

```
Input:  { timeSlotId: string }
Output: { timeSlot: TimeSlot }
Event:  TimeSlotReleased { timeSlotId, previousStatus }
Errors: TIME_SLOT_NOT_FOUND, TIME_SLOT_NOT_BLOCKED
```

### 4.7 create_reminder

```
Input:  { reservationId: string, type: string, channel: string, scheduledAt: number, message?: string }
Output: { reminder: Reminder }
Event:  ReminderCreated { reminder }
Errors: RESERVATION_NOT_FOUND, INVALID_REMINDER_TIME, REMINDER_TIME_IN_PAST
```

### 4.8 cancel_reminder

```
Input:  { reminderId: string }
Output: { reminder: Reminder }
Event:  ReminderCancelled { reminderId, reservationId, reason }
Errors: REMINDER_NOT_FOUND, REMINDER_ALREADY_CANCELLED
```

## 5. Event Catalog

All events conform to `DomainEvent` from `packages/shared/src/events/DomainEvent.ts`.

| Event Type | Required Payload Fields | causationId |
|---|---|---|
| `AvailabilityChecked` | `calendarId, startAt, endAt, available, conflictingSlots?` | workflow step |
| `ReservationCreated` | `reservation: Reservation` | workflow step or `AvailabilityChecked` |
| `ReservationCancelled` | `reservationId, reason?, previousStatus` | workflow step |
| `ReservationRescheduled` | `reservation: Reservation, previous: Reservation` | `ReservationCancelled` |
| `TimeSlotBlocked` | `timeSlot: TimeSlot, reason?` | workflow step |
| `TimeSlotReleased` | `timeSlotId, previousStatus` | workflow step |
| `ReminderCreated` | `reminder: Reminder` | `ReservationCreated` |
| `ReminderTriggered` | `reminderId, reservationId, triggeredAt` | reminder scheduler |
| `ReminderCancelled` | `reminderId, reservationId, reason` | `ReservationCancelled` or workflow |

## 6. Invariants (MUST NOT be violated)

### 6.1 Identity Invariants

- **I1:** `providerIds` MUST be a separate map from the canonical `id`
- **I2:** Canonical `id` MUST use the correct prefix per entity type (`cal_`, `tsl_`, `rsv_`, `rmd_`, `avw_`)
- **I3:** `providerIds` MUST NOT be used as the primary key in any engine operation

### 6.2 Temporal Invariants

- **I4:** `startAt` MUST be strictly before `endAt` on all temporal entities (TimeSlot, Reservation)
- **I5:** No two reservations on the same calendar may overlap in time (overlapping reservations prohibited)
- **I6:** Blocked time slots CANNOT be reserved (blocked slots unavailable)
- **I7:** A time slot CANNOT have more than one reservation simultaneously
- **I8:** Timezone on a Calendar MUST be a valid IANA timezone identifier

### 6.3 Reservation Lifecycle Invariants

- **I9:** Status `cancelled` is TERMINAL — no further mutations on cancelled reservations
- **I10:** Status `completed` is TERMINAL — no further mutations
- **I11:** Status `no_show` is TERMINAL — no further mutations
- **I12:** Rescheduling creates a NEW reservation; the old one MUST be set to `cancelled`
- **I13:** `calendarId` MUST reference an existing calendar
- **I14:** `contactId` MUST reference an existing contact (if provided)
- **I15:** Cancelling a reservation MUST release its associated time slot
- **I16:** Cancelling a reservation MUST cancel all its associated reminders

### 6.4 Reminder Invariants

- **I17:** A reminder MUST reference an existing reservation (reminder requires reservation)
- **I18:** `scheduledAt` for `upcoming` type MUST be before the reservation's `startAt`
- **I19:** `scheduledAt` for `follow_up` type MUST be after the reservation's `endAt`
- **I20:** `scheduledAt` MUST NOT be in the past at creation time

### 6.5 Availability Invariants

- **I21:** A time slot falls within an availability window for it to be reservable
- **I22:** Buffer windows (`bufferBeforeMs`, `bufferAfterMs`) extend the effective blocked time around reservations
- **I23:** `startTime` MUST be before `endTime` in every AvailabilityWindow

### 6.6 Ownership Invariants

- **I24:** `LOCKED` ownership MUST block ALL temporal write operations
- **I25:** Under `AI` ownership, `check_availability` and `create_reminder` are allowed; reservation mutations are blocked
- **I26:** Under `SHARED` ownership, reservation creation requires explicit human approval
- **I27:** `HUMAN` ownership has full temporal CRUD permissions

### 6.7 Event Invariants

- **I28:** EVERY temporal state mutation MUST emit a `DomainEvent`
- **I29:** Every event MUST carry `correlationId` when emitted within a workflow execution
- **I30:** Every event MUST carry `actorId` identifying who triggered the action

## 7. Temporal Conflict Detection

```
Conflict check (newStart, newEnd, calendarId):

1. Validate newStart < newEnd (I4)
2. For each reservation on calendarId WHERE status IN ('confirmed', 'pending'):
   a. Apply buffer windows: effectiveStart = rsv.startAt - bufferBeforeMs, effectiveEnd = rsv.endAt + bufferAfterMs
   b. IF newStart < effectiveEnd AND newEnd > effectiveStart → CONFLICT
3. For each timeSlot on calendarId WHERE status = 'blocked':
   a. IF newStart < blocked.endAt AND newEnd > blocked.startAt → CONFLICT
4. For each availabilityWindow on calendarId:
   a. Check newStart and newEnd fall within at least one window
   b. IF not → CONFLICT (outside availability)
5. IF no conflicts → return { available: true }
```

## 8. Reservation Lifecycle

```
Reservation created (status: "pending")
  │
  ├─ Confirmed (status: "confirmed")
  │   │
  │   ├─ Completed (status: "completed") [TERMINAL]
  │   │
  │   ├─ No-show (status: "no_show") [TERMINAL]
  │   │
  │   ├─ Cancelled (status: "cancelled") [TERMINAL]
  │   │   └─ Time slot released
  │   │   └─ All reminders cancelled
  │   │
  │   └─ Rescheduled:
  │       old.status = "cancelled" [TERMINAL]
  │       new.status = "confirmed"
  │       new.metadata.rescheduledFrom = old.id
  │
  └─ Cancelled directly from pending [TERMINAL]
```

**Terminal states:** `cancelled`, `completed`, `no_show`

## 9. TimeSlot Lifecycle

```
available ─────────────────────────────────────────→
  │
  ├─ block_time_slot() → blocked
  │   └─ release_time_slot() → available
  │
  └─ create_reservation() → reserved
      └─ cancel_reservation() → available (slot released)
```

**Terminal states:** None — all states can transition.

## 10. Reminder Lifecycle

```
Reminder created (status: "scheduled")
  │
  ├─ Triggered (status: "triggered") [TERMINAL]
  │
  ├─ Cancelled (status: "cancelled") [TERMINAL]
  │   └─ Trigger: parent reservation cancelled
  │
  └─ Failed (status: "failed") [TERMINAL]
      └─ Trigger: provider unavailable, retry exhausted
```

**Terminal states:** `triggered`, `cancelled`, `failed`

## 11. Ownership & Handoff Integration

calendar-engine reads ownership from the conversation context. It does NOT manage ownership — that is handoff-engine's responsibility.

```typescript
// Ownership gate in execute():
const owner = ownershipResolver(context.conversationId) ?? 'AI';

if (owner === 'LOCKED') {
  return { error: 'OWNERSHIP_LOCKED', message: 'Temporal writes blocked — ownership is LOCKED' };
}

const humanGatedActions = [
  'create_reservation', 'cancel_reservation', 'reschedule_reservation',
  'block_time_slot', 'release_time_slot',
];

if (humanGatedActions.includes(action) && owner === 'AI') {
  return { error: 'OWNERSHIP_INSUFFICIENT', message: 'Requires HUMAN or SHARED ownership' };
}

if (humanGatedActions.includes(action) && owner === 'SHARED' && !context.approvedBy) {
  return { error: 'APPROVAL_REQUIRED', message: 'Human approval required under SHARED ownership' };
}
```

**Permission Matrix:**

| Action | AI | HUMAN | SHARED | LOCKED |
|---|---|---|---|---|
| `check_availability` | ✓ | ✓ | ✓ | ✓ |
| `create_reservation` | ✗ | ✓ | ✗¹ | ✗ |
| `cancel_reservation` | ✗ | ✓ | ✗¹ | ✗ |
| `reschedule_reservation` | ✗ | ✓ | ✗¹ | ✗ |
| `block_time_slot` | ✗ | ✓ | ✗¹ | ✗ |
| `release_time_slot` | ✗ | ✓ | ✗¹ | ✗ |
| `create_reminder` | ✓ | ✓ | ✓ | ✗ |
| `cancel_reminder` | ✓ | ✓ | ✓ | ✗ |

¹ Allowed if `context.approvedBy` is present (human co-approval)

## 12. Workflow Orchestration Integration

calendar-engine is a standard engine. Any workflow step can call it:

```json
{
  "id": "check-calendar",
  "name": "Check Availability",
  "type": "action",
  "engine": "calendar-engine",
  "action": "check_availability",
  "input": {
    "calendarId": "{{state.calendarId}}",
    "startAt": "{{state.requestedStartAt}}",
    "endAt": "{{state.requestedEndAt}}"
  }
}
```

The workflow-orchestrator's `WorkflowExecutor` calls `engine.execute(action, context)` — the calendar-engine resolves the action, performs the temporal operation, emits an event, and returns the result to the workflow context.

## 13. CalendarProvider Interface

```typescript
interface CalendarProvider {
  readonly providerName: string;

  // Availability
  checkAvailability(calendarId: string, startAt: number, endAt: number): Promise<AvailabilityResult>;

  // Reservations
  createReservation(data: CreateReservationInput): Promise<Reservation>;
  cancelReservation(id: ReservationId, reason?: string): Promise<Reservation>;
  getReservation(id: ReservationId): Promise<Reservation | undefined>;
  findReservations(calendarId: string, startAt: number, endAt: number): Promise<Reservation[]>;

  // Time Slots
  blockTimeSlot(calendarId: string, startAt: number, endAt: number, reason?: string): Promise<TimeSlot>;
  releaseTimeSlot(id: TimeSlotId): Promise<TimeSlot>;
  getTimeSlot(id: TimeSlotId): Promise<TimeSlot | undefined>;

  // Reminders
  createReminder(data: CreateReminderInput): Promise<Reminder>;
  cancelReminder(id: ReminderId): Promise<Reminder>;
  getReminders(reservationId: ReservationId): Promise<Reminder[]>;

  // Calendar Management
  getCalendar(id: CalendarId): Promise<Calendar | undefined>;
  createCalendar(data: CreateCalendarInput): Promise<Calendar>;
}
```

**Phase 1 implementation:** `InMemoryCalendarProvider`
**Phase 2 implementation:** `GoogleCalendarAdapter implements CalendarProvider`
**Phase 4 implementation:** `PostgresCalendarProvider implements CalendarProvider`

## 14. Provider Abstraction Model

```
┌──────────────────────────────┐
│      CalendarEngine           │  ← Engine contract + ownership gates + events
│   (owns CalendarProvider ref) │
└──────────┬───────────────────┘
           │ depends on interface (not implementation)
           ▼
┌──────────────────────────────┐
│   CalendarProvider (interface)│  ← Defined in this engine
└──────────┬───────────────────┘
           │
     ┌─────┴─────┬──────────────┬──────────────┐
     ▼           ▼              ▼              ▼
InMemory      Google       Outlook        Postgres
Calendar      Calendar     Calendar       Calendar
Provider      Adapter      Adapter        Provider
(Phase 1)     (Phase 2)    (Phase 2)      (Phase 4)
```

The engine NEVER imports Google Calendar types directly. The Google adapter is injected at construction time:

```typescript
// Phase 1
const engine = new CalendarEngine({ provider: new InMemoryCalendarProvider() });

// Phase 2
const engine = new CalendarEngine({ provider: new GoogleCalendarAdapter({ apiKey, calendarId }) });
```

## 15. Error Model

All errors are **returned as structured results**, never thrown.

```typescript
// Success
{ reservation: Reservation }
{ available: true, conflictingSlots?: TimeSlot[] }

// Error
{ error: "TIME_SLOT_UNAVAILABLE", message: "Time slot overlaps with existing reservation rsv_xxx" }
{ error: "OWNERSHIP_LOCKED", message: "Temporal writes blocked — ownership is LOCKED" }
{ error: "RESERVATION_TERMINAL", message: "Reservation rsv_xxx has terminal status 'cancelled'" }
{ error: "INVALID_TIME_RANGE", message: "startAt must be before endAt" }
{ error: "INVALID_TIMEZONE", message: "Timezone 'Mars/Olympus' is not a valid IANA timezone" }
{ error: "CALENDAR_NOT_FOUND", message: "Calendar cal_xxx does not exist" }
{ error: "RESERVATION_NOT_FOUND", message: "Reservation rsv_xxx does not exist" }
{ error: "ALREADY_CANCELLED", message: "Reservation rsv_xxx is already cancelled" }
{ error: "OWNERSHIP_INSUFFICIENT", message: "Action 'create_reservation' requires HUMAN ownership" }
{ error: "APPROVAL_REQUIRED", message: "Human approval required under SHARED ownership" }
```

## 16. Future: Multitenancy

All entities carry `tenantId: "tnt_<ulid>"`. Future enforcement:
- Engine resolves `tenantId` from `context.tenantId` at execute time
- `CalendarProvider` implementations scope all queries by tenant
- Postgres RLS: `CREATE POLICY tenant_isolation ON reservations USING (tenant_id = current_setting('app.tenant_id'))`
- Workspace grouping: `workspaceId: "wsp_<ulid>"` for multi-clinic chains
- Vertical scope: `verticalId: "vrt_<ulid>"` for vertical-specific calendar policies

## 17. Future: Observability

- Every event carries `correlationId` linking it to a workflow execution
- Every event carries `causationId` linking it to its parent event
- `metadata` on every entity and event for provider-specific tracing
- Event stream consumable by external analytics (Kafka, Postgres WAL, Supabase Realtime)
- Temporal analytics: time-to-book, no-show rate, reschedule frequency, peak hours

## 18. What This Spec Does NOT Cover

- Google Calendar OAuth token lifecycle (Phase 2)
- Outlook Calendar Microsoft Graph integration (Phase 2)
- Actual reminder delivery (email/SMS/WhatsApp) (Phase 3)
- Database migrations (Phase 4)
- Recurring appointments (ICCAL RRULE) (Phase 6)
- Analytics dashboards (Phase 5)
- UI calendar components
- Real-time availability streaming
- AI autonomous scheduling decisions
