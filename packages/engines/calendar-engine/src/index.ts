// ── Calendar Engine — Barrel Exports ─────────────────────
// Provider-agnostic Temporal Runtime Coordination Engine

// Engine
export { CalendarEngine } from './CalendarEngine';

// Providers
export { InMemoryCalendarProvider } from './providers/InMemoryCalendarProvider';
export { GoogleCalendarProvider } from './providers/GoogleCalendarProvider';

// Types
export type {
  CalendarEngineConfig,
  CalendarEngineContext,
  CalendarProvider,
  CalendarError,
  CalendarErrorCode,
  CalendarEventType,
  AvailabilityResult,
  CreateCalendarInput,
  CheckAvailabilityInput,
  CreateReservationInput,
  CancelReservationInput,
  RescheduleReservationInput,
  BlockTimeSlotInput,
  ReleaseTimeSlotInput,
  CreateReminderInput,
  CancelReminderInput,
} from './types';
export { isValidTimezone, isCalendarError } from './types';

// Runtime (expose for testing and advanced usage)
export { TemporalValidator } from './runtime/TemporalValidator';
export { ConflictDetector } from './runtime/ConflictDetector';
export { OwnershipGuard } from './runtime/OwnershipGuard';
export { ReservationLifecycle } from './runtime/ReservationLifecycle';
export { ReminderScheduler } from './runtime/ReminderScheduler';
export { CalendarEventEmitter } from './runtime/CalendarEventEmitter';
export type { CalendarEventHandler } from './runtime/CalendarEventEmitter';
export type { ConflictContext } from './runtime/ConflictDetector';

// Event factories
export {
  availabilityChecked,
  reservationCreated,
  reservationCancelled,
  reservationRescheduled,
  timeSlotBlocked,
  timeSlotReleased,
  reminderCreated,
  reminderTriggered,
  reminderCancelled,
} from './events/CalendarEvents';

// Re-export shared calendar types for consumer convenience
export type {
  Calendar,
  AvailabilityWindow,
  TimeSlot,
  TimeSlotStatus,
  Reservation,
  ReservationStatus,
  Reminder,
  ReminderType,
  ReminderChannel,
  ReminderStatus,
  DomainEvent,
  ConversationOwner,
  CalendarId,
  TimeSlotId,
  ReservationId,
  ReminderId,
} from '@curdeeclau/shared';
