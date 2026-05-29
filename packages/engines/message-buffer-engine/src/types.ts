// ── Conversational Buffer Types ──────────────────────────
// Phase 3: Real engine types for conversation-oriented buffering.
// The older delivery-oriented types (Message, DeliveryReceipt, etc.)
// remain available below for future phases.

export type BufferChannel = 'whatsapp' | 'web' | 'sms' | 'email';

export type SenderType = 'contact' | 'agent' | 'system';

export type ConversationState = 'IDLE' | 'BUFFERING' | 'READY_TO_FLUSH' | 'FLUSHED';

export interface BufferMessage {
  messageId: string;
  conversationId: string;
  sourceId: string;
  content: string;
  channel: BufferChannel;
  senderType: SenderType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationBuffer {
  conversationId: string;
  state: ConversationState;
  messages: BufferMessage[];
  startedAt: number;
  lastMessageAt: number;
  expiresAt: number;
}

export interface BufferConfig {
  waitWindowMs: number;
  maxMessages: number;
  dedupWindowMs: number;
  expiryMs: number;
}

export const DEFAULT_BUFFER_CONFIG: BufferConfig = {
  waitWindowMs: 10_000,
  maxMessages: 50,
  dedupWindowMs: 300_000,
  expiryMs: 600_000,
};

export interface BatchedConversation {
  conversationId: string;
  messages: BufferMessage[];
  consolidatedContent: string;
  messageCount: number;
  startedAt: number;
  flushedAt: number;
}

export interface BufferResult {
  conversationId: string;
  state: ConversationState;
  duplicate: boolean;
  messageCount: number;
}

export interface FlushResult {
  batch: BatchedConversation | null;
  state: ConversationState;
}

// ── Future delivery types (Phase 4+) ─────────────────────
//
// @transitional — Scheduled for extraction to a dedicated delivery
// package (Phase 4+). Current import path from
// @curdeeclau/message-buffer-engine is stable and supported.
// Consumers should pin their version. A migration path will be
// provided when the delivery package is activated.

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export type MessageChannel = 'whatsapp' | 'sms' | 'email' | 'web';

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export type MessageStatus =
  | 'queued'
  | 'sending'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'expired'
  | 'cancelled';

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export interface Message {
  id: string;
  channel: MessageChannel;
  to: string;
  body: string;
  idempotencyKey: string;
  priority: MessagePriority;
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export interface MessageEnvelope {
  message: Message;
  status: MessageStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  lastError?: string;
  createdAt: string;
}

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export interface DeliveryReceipt {
  messageId: string;
  channel: MessageChannel;
  status: MessageStatus;
  deliveredAt?: string;
  readAt?: string;
  error?: string;
  channelReceiptId?: string;
}

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export interface MessageBufferConfig {
  maxRetries: number;
  baseRetryDelayMs: number;
  maxRetryDelayMs: number;
  defaultExpiryMs: number;
  dedupWindowMs: number;
}

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export interface MessageSender {
  readonly channel: MessageChannel;
  send(message: Message): Promise<DeliveryReceipt>;
}

/** @transitional — Planned extraction to delivery package (Phase 4+). */
export interface MessageBuffer {
  enqueue(message: Message): Promise<MessageEnvelope>;
  get(messageId: string): Promise<MessageEnvelope | null>;
  cancel(messageId: string): Promise<void>;
  flush(channel?: MessageChannel): Promise<DeliveryReceipt[]>;
}
