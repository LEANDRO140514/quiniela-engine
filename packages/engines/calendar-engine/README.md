# @curdeeclau/calendar-engine

Provider-agnostic calendar abstraction for appointment scheduling.

## Scope
- Slot availability queries (by date, doctor, procedure type)
- Appointment CRUD with double-booking prevention
- Business hours and slot duration configuration
- Abstract `CalendarProvider` — swap Google Calendar, Outlook, custom DB
- Cancellation policy enforcement

## Status
Phase 2B — interfaces and types only. No real provider implementations yet.

## Usage (future)
```ts
import { CalendarEngine } from '@curdeeclau/calendar-engine';
const engine = new CalendarEngine(config);
engine.setProvider(new GoogleCalendarProvider());
const slots = await engine.getAvailability({ startDate, endDate, doctorId });
```
