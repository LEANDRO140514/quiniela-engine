// ── Engine ──────────────────────────────────────────────
export { MessageBufferEngine } from './engine/MessageBufferEngine';

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
