import { createDomainEvent } from '@curdeeclau/shared';
import type { DomainEvent } from '@curdeeclau/shared';
import type {
  BufferConfig,
  BufferMessage,
  BufferResult,
  ConversationState,
  FlushResult,
} from '../types';
import { DEFAULT_BUFFER_CONFIG } from '../types';
import { InMemoryBufferStore } from '../stores/InMemoryBufferStore';
import { MessageDeduplicator } from '../services/MessageDeduplicator';
import { DebounceService } from '../services/DebounceService';
import { MessageBatcher } from '../services/MessageBatcher';

export class MessageBufferEngine {
  private store: InMemoryBufferStore;
  private deduplicator: MessageDeduplicator;
  private debounce: DebounceService;
  private batcher: MessageBatcher;
  private config: BufferConfig;
  private emitFn?: (event: DomainEvent) => void;

  constructor(
    config: Partial<BufferConfig> & { emitFn?: (event: DomainEvent) => void } = {},
  ) {
    const { emitFn, ...bufferConfig } = config;
    this.config = { ...DEFAULT_BUFFER_CONFIG, ...bufferConfig };
    this.emitFn = emitFn;
    this.store = new InMemoryBufferStore();
    this.deduplicator = new MessageDeduplicator();
    this.batcher = new MessageBatcher();

    this.debounce = new DebounceService((conversationId) => {
      this.onDebounceExpired(conversationId);
    });
  }

  // ── Public API ──────────────────────────────────────────

  bufferMessage(message: BufferMessage): BufferResult {
    const now = Date.now();

    this.deduplicator.evictOlderThan(now, this.config.dedupWindowMs);

    if (this.deduplicator.isDuplicate(message)) {
      return {
        conversationId: message.conversationId,
        state: this.getConversationState(message.conversationId),
        duplicate: true,
        messageCount: this.store.getMessageCount(message.conversationId),
      };
    }

    this.deduplicator.markSeen(message);

    if (!this.store.hasConversation(message.conversationId)) {
      this.store.createBuffer(message.conversationId, now, this.config.expiryMs);
    }

    this.store.addMessage(message);

    const count = this.store.getMessageCount(message.conversationId);
    if (count >= this.config.maxMessages) {
      this.store.updateState(message.conversationId, 'READY_TO_FLUSH');
      this.debounce.cancel(message.conversationId);

      this.emit('MessageBuffered', {
        messageId: message.messageId,
        conversationId: message.conversationId,
        content: message.content.slice(0, 100),
        messageCount: count,
        state: 'READY_TO_FLUSH',
      });
      this.emit('ConversationReadyToFlush', {
        conversationId: message.conversationId,
        messageCount: count,
        trigger: 'maxMessages',
      });

      return {
        conversationId: message.conversationId,
        state: 'READY_TO_FLUSH',
        duplicate: false,
        messageCount: count,
      };
    }

    this.debounce.reset(message.conversationId, this.config.waitWindowMs);
    this.store.updateState(message.conversationId, 'BUFFERING');

    this.emit('MessageBuffered', {
      messageId: message.messageId,
      conversationId: message.conversationId,
      content: message.content.slice(0, 100),
      messageCount: count,
      state: 'BUFFERING',
    });

    return {
      conversationId: message.conversationId,
      state: 'BUFFERING',
      duplicate: false,
      messageCount: count,
    };
  }

  flushConversation(conversationId: string): FlushResult {
    const buffer = this.store.getBuffer(conversationId);
    if (!buffer) {
      return { batch: null, state: 'IDLE' };
    }

    this.debounce.cancel(conversationId);
    const messages = this.store.getMessages(conversationId);
    const now = Date.now();

    const batch = this.batcher.batch(
      conversationId,
      messages,
      buffer.startedAt,
      now,
    );

    this.store.updateState(conversationId, 'FLUSHED');

    this.emit('ConversationFlushed', {
      conversationId,
      messageCount: batch.messageCount,
      consolidatedContent: batch.consolidatedContent.slice(0, 200),
      flushedAt: now,
    });

    return { batch, state: 'FLUSHED' };
  }

  getConversationState(conversationId: string): ConversationState {
    const buffer = this.store.getBuffer(conversationId);
    return buffer?.state ?? 'IDLE';
  }

  clearConversation(conversationId: string): void {
    this.debounce.cancel(conversationId);
    this.store.clearBuffer(conversationId);

    this.emit('ConversationCleared', { conversationId });
  }

  dedupeMessage(message: BufferMessage): boolean {
    this.deduplicator.evictOlderThan(Date.now(), this.config.dedupWindowMs);
    return this.deduplicator.isDuplicate(message);
  }

  // ── Internal ────────────────────────────────────────────

  private onDebounceExpired(conversationId: string): void {
    const buffer = this.store.getBuffer(conversationId);
    if (!buffer) return;
    if (buffer.state === 'FLUSHED') return;
    this.store.updateState(conversationId, 'READY_TO_FLUSH');

    this.emit('ConversationReadyToFlush', {
      conversationId,
      messageCount: buffer.messages.length,
      trigger: 'debounce',
    });
  }

  private emit(type: string, payload: Record<string, unknown>): void {
    if (!this.emitFn) return;
    this.emitFn(createDomainEvent(type, { payload }));
  }

  // ── Lifecycle ───────────────────────────────────────────

  get activeConversations(): number {
    return this.store.getAllConversationIds().length;
  }

  get activeTimers(): number {
    return this.debounce.activeTimers;
  }

  get dedupeCacheSize(): number {
    return this.deduplicator.size;
  }

  getConfig(): BufferConfig {
    return { ...this.config };
  }

  destroy(): void {
    this.debounce.destroy();
    for (const id of this.store.getAllConversationIds()) {
      this.store.clearBuffer(id);
    }
    this.deduplicator.clear();
  }
}
