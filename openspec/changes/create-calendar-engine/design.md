# Design: calendar-engine

## 1. Architecture Overview

```
┌─────────────────────────────────────────────┐
│          workflow-orchestrator               │
│  execute('check_availability', ctx)         │
│  execute('create_reservation', ctx)         │
│  execute('cancel_reservation', ctx)         │
└──────────────────┬──────────────────────────┘
                   │ Engine Contract
                   ▼
┌─────────────────────────────────────────────┐
│            calendar-engine                   │
│  ┌───────────────────────────────────────┐  │
│  │    CalendarProvider (interface)        │  │
│  │  checkAvailability / createReservation│  │
│  │  cancelReservation / reschedule       │  │
│  │  blockTimeSlot / releaseTimeSlot      │  │
│  │  createReminder / cancelReminder      │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │  InMemoryCalendarProvider (Phase 1)    │  │
│  │  GoogleCalendarAdapter  (Phase 2)      │  │
│  │  PostgresProvider       (Phase 4)      │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │         EventEmitter                   │  │
│  │  AvailabilityChecked / ReservationCreated│
│  │  ReservationCancelled / ReminderTriggered│
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │       ConflictDetector                 │  │
│  │  overlap detection / buffer windows   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 2. Canonical Temporal Entities

All entities defined in `packages/shared/src/calendar/`. The engine **does not redefine** them.

| Entity | Canonical ID Prefix | Description |
|---|---|---|
| `Calendar` | `cal_` | A named calendar with availability rules and timezone |
| `AvailabilityWindow` | `avw_` | A recurring or one-time window when bookings are allowed |
| `TimeSlot` | `tsl_` | A specific block of time on a calendar (available, blocked, reserved) |
| `Reservation` | `rsv_` | A confirmed booking linking a contact to a time slot |
| `Reminder` | `rmd_` | A scheduled notification tied to a reservation lifecycle |

**Provider ID separation (mandatory):**
```typescript
{
  id: "rsv_01JX2K5N8P3Q",          // canonical — never changes
  providerIds: {
    google: "google_event_abc123",  // provider-specific — can change
    outlook: "outlook_event_xyz"
  }
}
```

## 3. Calendar

```typescript
interface Calendar {
  id: CalendarId;                    // "cal_<ulid>"
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  name: string;                      // "Clínica Dental — Dr. Ramírez"
  timezone: string;                  // IANA timezone (e.g. "America/Mexico_City")
  availabilityWindows: AvailabilityWindow[];
  active: boolean;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

interface AvailabilityWindow {
  id: string;                        // "avw_<ulid>"
  calendarId: CalendarId;
  daysOfWeek: number[];              // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string;                 // "09:00" (HH:mm in calendar timezone)
  endTime: string;                   // "18:00"
  bufferBeforeMs?: number;           // buffer before appointment (default 0)
  bufferAfterMs?: number;            // buffer after appointment (default 0)
  slotDurationMs: number;            // default appointment duration (e.g. 1800000 = 30min)
  validFrom?: number;                // Unix ms — window becomes active
  validUntil?: number;               // Unix ms — window expires
  metadata?: Record<string, unknown>;
}
```

**Invariants:**
- Calendar must have timezone (cannot be undefined)
- Timezone must be a valid IANA timezone identifier
- `startTime` must be before `endTime` within the same day
- Availability windows cannot overlap for the same calendar

## 4. TimeSlot

```typescript
interface TimeSlot {
  id: TimeSlotId;                    // "tsl_<ulid>"
  calendarId: CalendarId;
  startAt: number;                   // Unix ms
  endAt: number;                     // Unix ms
  status: 'available' | 'blocked' | 'reserved';
  reservationId?: ReservationId;     // set when status = 'reserved'
  metadata?: Record<string, unknown>;
}
```

**TimeSlot Lifecycle:**
```
available ─────────────────────────────────────────→
  │
  ├─ blockTimeSlot() → blocked
  │   └─ releaseTimeSlot() → available
  │
  └─ createReservation() → reserved
      └─ cancelReservation() → available
```

**Invariants:**
- `startAt` MUST be before `endAt`
- Only one reservation per time slot
- Blocked slots cannot be reserved
- Released blocked slots return to available (not reserved)

## 5. Reservation

```typescript
interface Reservation {
  id: ReservationId;                 // "rsv_<ulid>"
  tenantId?: TenantId;
  providerIds: Record<string, string>;
  calendarId: CalendarId;
  timeSlotId: TimeSlotId;
  contactId?: ContactId;             // from CRM — who this is for
  title: string;                     // "Cita Dental — María García"
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

**Reservation Lifecycle:**
```
Reservation created (status: "pending")
  │
  ├─ Confirmed (status: "confirmed")
  │   │
  │   ├─ Completed (status: "completed")
  │   │
  │   ├─ No-show (status: "no_show")
  │   │
  │   ├─ Cancelled (status: "cancelled")
  │   │   └─ [TERMINAL — no further transitions]
  │   │
  │   └─ Rescheduled:
  │       oldReservation.status = "cancelled"
  │       newReservation.status = "confirmed"
  │       newReservation.metadata.rescheduledFrom = oldReservation.id
  │
  └─ Cancelled directly from pending

Reschedule = cancel(old) + create(new) in single atomic operation.
```

**Invariants:**
- `startAt` MUST be before `endAt`
- `calendarId` MUST reference an existing calendar
- `contactId` MUST reference an existing contact (if provided)
- Status `cancelled` is TERMINAL — no further transitions
- Status `completed` and `no_show` are TERMINAL
- Rescheduling creates a NEW reservation; old one becomes cancelled

## 6. Reminder

```typescript
interface Reminder {
  id: ReminderId;                    // "rmd_<ulid>"
  reservationId: ReservationId;
  type: 'confirmation_request' | 'upcoming' | 'follow_up' | 'custom';
  channel: 'whatsapp' | 'email' | 'sms' | 'push';
  scheduledAt: number;               // Unix ms — when to trigger
  triggeredAt?: number;              // Unix ms — when actually triggered
  status: 'scheduled' | 'triggered' | 'cancelled' | 'failed';
  message?: string;                  // Template or literal message
  createdAt: number;
  metadata: Record<string, unknown>;
}
```

**Reminder Lifecycle:**
```
Reminder created (status: "scheduled")
  │
  ├─ Triggered (status: "triggered")
  │   └─ Delivery delegated to notification engine (future)
  │
  ├─ Cancelled (status: "cancelled")
  │   └─ Parent reservation cancelled → all reminders cancelled
  │
  └─ Failed (status: "failed")
      └─ Provider unavailable, retry exhausted
```

**Invariants:**
- Reminder MUST reference an existing reservation
- Cancelling a reservation MUST cancel all its reminders
- `scheduledAt` MUST be after reservation `startAt` for follow_up type
- `scheduledAt` MUST be before reservation `startAt` for upcoming type

## 7. Engine Capabilities

The engine implements the standard Algorithmus `Engine` contract:

```typescript
interface Engine {
  readonly engineName: string;  // "calendar-engine"
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

**Supported actions:**

| Action | Input | Output | Side Effects |
|---|---|---|---|
| `check_availability` | `{ calendarId, startAt, endAt }` | `{ available: boolean, slots?: TimeSlot[] }` | emits `AvailabilityChecked` |
| `create_reservation` | `{ calendarId, startAt, endAt, title, contactId? }` | `{ reservation: Reservation }` | emits `ReservationCreated` |
| `cancel_reservation` | `{ reservationId, reason? }` | `{ reservation: Reservation }` | emits `ReservationCancelled`, cancels reminders |
| `reschedule_reservation` | `{ reservationId, newStartAt, newEndAt }` | `{ reservation: Reservation, previous: Reservation }` | emits `ReservationRescheduled` |
| `block_time_slot` | `{ calendarId, startAt, endAt, reason? }` | `{ timeSlot: TimeSlot }` | emits `TimeSlotBlocked` |
| `release_time_slot` | `{ timeSlotId }` | `{ timeSlot: TimeSlot }` | emits `TimeSlotReleased` |
| `create_reminder` | `{ reservationId, type, channel, scheduledAt, message? }` | `{ reminder: Reminder }` | emits `ReminderCreated` |
| `cancel_reminder` | `{ reminderId }` | `{ reminder: Reminder }` | emits `ReminderCancelled` |

## 8. Conflict Detection Model

Conflicts are detected **deterministically**, not by AI.

```
Overlap check (newStart, newEnd, calendarId):
  FOR each existing reservation in calendar:
    IF existing.status IN ('confirmed', 'pending'):
      IF newStart < existing.endAt AND newEnd > existing.startAt:
        → CONFLICT: overlapping reservation
  FOR each blocked timeSlot in calendar:
    IF newStart < blocked.endAt AND newEnd > blocked.startAt:
      → CONFLICT: blocked slot
  RETURN no conflict
```

**Buffer window enforcement:**
```
Effective slot start = slot.startAt - availabilityWindow.bufferBeforeMs
Effective slot end   = slot.endAt   + availabilityWindow.bufferAfterMs
```

**Conflict resolution priority (future):**
1. LOCKED calendar → no modifications
2. HUMAN-initiated reservations override AI-suggested ones
3. Emergency overrides (requires explicit escalation)
4. First-come-first-served for same priority

## 9. Rescheduling Semantics

Rescheduling is **atomic cancel + create**:

```
rescheduleReservation(reservationId, newStartAt, newEndAt):
  1. Load existing reservation (MUST be 'confirmed' or 'pending')
  2. Check availability for new time slot
  3. IF conflict → return { error: 'TIME_SLOT_UNAVAILABLE' }
  4. Cancel existing reservation (status → 'cancelled')
  5. Create new reservation (status → 'confirmed')
  6. Link: newReservation.metadata.rescheduledFrom = oldReservation.id
  7. Copy reminders to new reservation (updated scheduledAt)
  8. Emit ReservationRescheduled event
  9. Return { reservation: newReservation, previous: oldReservation }
```

## 10. Cancellation Semantics

```
cancelReservation(reservationId, reason?):
  1. Load reservation
  2. IF status is 'cancelled' → return { error: 'ALREADY_CANCELLED' }
  3. IF status is 'completed' or 'no_show' → return { error: 'RESERVATION_TERMINAL' }
  4. Set status = 'cancelled', cancelledAt = now, cancellationReason = reason
  5. Release time slot (status → 'available')
  6. Cancel all associated reminders
  7. Emit ReservationCancelled event
  8. Return { reservation }
```

## 11. Event Catalog

All events conform to `DomainEvent` from `packages/shared/src/events/DomainEvent.ts`.

| Event Type | Required Payload Fields | causationId |
|---|---|---|
| `AvailabilityChecked` | `calendarId, startAt, endAt, available, conflictingSlots?` | workflow step |
| `ReservationCreated` | `reservation: Reservation` | workflow step |
| `ReservationCancelled` | `reservationId, reason?, previousStatus` | workflow step |
| `ReservationRescheduled` | `reservation: Reservation, previous: Reservation` | `ReservationCancelled` or workflow step |
| `TimeSlotBlocked` | `timeSlot: TimeSlot, reason?` | workflow step |
| `TimeSlotReleased` | `timeSlotId, previousStatus` | workflow step |
| `ReminderCreated` | `reminder: Reminder` | `ReservationCreated` or workflow step |
| `ReminderTriggered` | `reminderId, reservationId, triggeredAt` | reminder scheduler |
| `ReminderCancelled` | `reminderId, reservationId, reason` | `ReservationCancelled` |

## 12. Ownership Integration

calendar-engine reads ownership state from `packages/shared/src/runtime/Ownership.ts`.

| Ownership | Temporal Write Permissions |
|---|---|
| `AI` | Can check availability, suggest time slots; CANNOT create/confirm reservations |
| `HUMAN` | Full temporal CRUD — create, cancel, reschedule, block slots |
| `SHARED` | AI suggests + human approves; reservation creation requires `approvedBy` |
| `LOCKED` | **All temporal writes blocked** — legal hold, clinic closure, audit freeze |

**Ownership gating in execute():**
```typescript
execute(action, context) {
  const owner = ownershipResolver(context.conversationId) ?? 'AI';

  if (owner === 'LOCKED') {
    return { error: 'OWNERSHIP_LOCKED', message: 'Temporal writes blocked — ownership is LOCKED' };
  }

  const humanGatedActions = [
    'create_reservation', 'cancel_reservation',
    'reschedule_reservation', 'block_time_slot', 'release_time_slot',
  ];
  if (humanGatedActions.includes(action) && owner === 'AI') {
    return { error: 'OWNERSHIP_INSUFFICIENT', message: 'Requires HUMAN or SHARED ownership' };
  }

  if (humanGatedActions.includes(action) && owner === 'SHARED' && !context.approvedBy) {
    return { error: 'APPROVAL_REQUIRED', message: 'Human approval required under SHARED ownership' };
  }

  // proceed
}
```

## 13. Workflow Orchestration Integration

```
workflow-orchestrator
  │
  ├─ Step: "check_calendar"
  │   └─ engine: "calendar-engine"
  │       action: "check_availability"
  │       → AvailabilityChecked event
  │
  ├─ Step: "book_appointment"
  │   └─ engine: "calendar-engine"
  │       action: "create_reservation"
  │       → ReservationCreated event
  │
  ├─ Step: "schedule_reminder"
  │   └─ engine: "calendar-engine"
  │       action: "create_reminder"
  │       → ReminderCreated event
  │
  └─ Step: "handle_reschedule"
      └─ engine: "calendar-engine"
          action: "reschedule_reservation"
          → ReservationRescheduled event
```

**Example: wf-dental-appointment workflow integration:**
```json
{
  "steps": [
    { "id": "s1", "engine": "message-buffer", "action": "process_buffer" },
    { "id": "s2", "engine": "crm-engine", "action": "create_contact" },
    { "id": "s3", "engine": "calendar-engine", "action": "check_availability" },
    { "id": "s4", "engine": "calendar-engine", "action": "create_reservation" },
    { "id": "s5", "engine": "calendar-engine", "action": "create_reminder" },
    { "id": "s6", "engine": "handoff-engine", "action": "evaluate" }
  ]
}
```

## 14. CalendarProvider Interface (Provider Abstraction)

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

  // Reminders
  createReminder(data: CreateReminderInput): Promise<Reminder>;
  cancelReminder(id: ReminderId): Promise<Reminder>;
  getReminders(reservationId: ReservationId): Promise<Reminder[]>;

  // Calendar Management
  getCalendar(id: CalendarId): Promise<Calendar | undefined>;
  createCalendar(data: CreateCalendarInput): Promise<Calendar>;
}
```

**Implementations:**
- `InMemoryCalendarProvider` — Phase 1 (this implementation)
- `GoogleCalendarAdapter` — Phase 2 (wraps Google Calendar API)
- `OutlookCalendarAdapter` — Phase 2 (wraps Microsoft Graph API)
- `PostgresCalendarProvider` — Phase 4 (direct Supabase/Postgres)

## 15. Future Persistence Strategy

**Phase 1 (now):** InMemoryCalendarProvider — Maps, no persistence
**Phase 4 (future):** PostgresCalendarProvider — Supabase Postgres with:
- `calendars` table → rows match `Calendar` fields
- `time_slots` table → rows match `TimeSlot` fields with temporal indexes
- `reservations` table → rows match `Reservation` fields with status index
- `reminders` table → rows match `Reminder` fields with scheduledAt index
- `availability_windows` → JSONB column on calendars
- `provider_ids` JSONB column for `providerIds`
- `metadata` JSONB column for extensibility
- Temporal range indexes: `GIST (tstzrange(start_at, end_at))` for efficient overlap queries

## 16. Future Multitenancy Strategy

All entities carry `tenantId`. Future implementation:
- Row-Level Security (RLS) on `tenant_id` column in Postgres
- `workspaceId` for sub-tenant grouping (multi-clinic chains, multi-campus schools)
- `verticalId` for vertical-specific calendar policies
- Engine resolves tenant from `context.tenantId` at execute time
- Per-tenant calendar provider configuration (tenant A uses Google, tenant B uses Outlook)

## 17. Failure Modes

| Failure | Behavior |
|---|---|
| Overlapping reservation | `execute()` returns `{ error: "TIME_SLOT_UNAVAILABLE" }` |
| Invalid timezone | `execute()` returns `{ error: "INVALID_TIMEZONE" }` |
| Calendar not found | `execute()` returns `{ error: "CALENDAR_NOT_FOUND" }` |
| Reservation not found | `execute()` returns `{ error: "RESERVATION_NOT_FOUND" }` |
| Reservation already cancelled | `execute()` returns `{ error: "ALREADY_CANCELLED" }` |
| Reservation terminal | `execute()` returns `{ error: "RESERVATION_TERMINAL" }` |
| Invalid time range (start ≥ end) | `execute()` returns `{ error: "INVALID_TIME_RANGE" }` |
| LOCKED ownership | `execute()` returns `{ error: "OWNERSHIP_LOCKED" }` |
| AI insufficient permissions | `execute()` returns `{ error: "OWNERSHIP_INSUFFICIENT" }` |
| Reminder without reservation | `execute()` returns `{ error: "RESERVATION_NOT_FOUND" }` |
| Duplicate booking | `execute()` returns `{ error: "TIME_SLOT_UNAVAILABLE" }` |
| Provider unavailable | Adapter returns `{ error: "PROVIDER_UNAVAILABLE" }` (Phase 2+) |

All errors are returned as structured results — **never thrown**.

## 18. Observability

Every temporal mutation emits:
- `correlationId` — ties events to a single workflow execution
- `causationId` — points to the event that triggered this mutation
- `actorId` — identifies the user, engine, or system
- `metadata` — extensible bag for provider-specific tracing data
- `verticalId` — vertical domain for filtering and analytics
- Temporal metadata: `startAt`, `endAt`, `timezone` on relevant events
