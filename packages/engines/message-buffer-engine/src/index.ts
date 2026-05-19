// ── Canonical Contracts ─────────────────────────────────
export type { DomainEvent } from '@curdeeclau/shared';

// ── Engine ──────────────────────────────────────────────
export { MessageBufferEngine } from './engine/MessageBufferEngine';

// ── Stores ──────────────────────────────────────────────
export { InMemoryBufferStore } from './stores/InMemoryBufferStore';

// ── Services ────────────────────────────────────────────
export { MessageBatcher } from './services/MessageBatcher';
export { MessageDeduplicator } from './services/MessageDeduplicator';
export { DebounceService } from './services/DebounceService';

// ── Types ───────────────────────────────────────────────
export {
  type BufferMessage,
  type BufferChannel,
  type SenderType,
  type ConversationState,
  type ConversationBuffer,
  type BufferConfig,
  type BatchedConversation,
  type BufferResult,
  type FlushResult,
  DEFAULT_BUFFER_CONFIG,
  // Future delivery types
  type Message,
  type MessageEnvelope,
  type DeliveryReceipt,
  type MessageBufferConfig,
  type MessageSender,
  type MessageBuffer,
  type MessageChannel,
  type MessageStatus,
  type MessagePriority,
} from './types';
