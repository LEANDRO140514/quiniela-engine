import type { BufferMessage, ConversationBuffer, ConversationState } from '../types';

export class InMemoryBufferStore {
  private buffers: Map<string, ConversationBuffer> = new Map();
  private messagesByConversation: Map<string, BufferMessage[]> = new Map();

  createBuffer(conversationId: string, now: number, expiryMs: number): ConversationBuffer {
    const buffer: ConversationBuffer = {
      conversationId,
      state: 'BUFFERING',
      messages: [],
      startedAt: now,
      lastMessageAt: now,
      expiresAt: now + expiryMs,
    };
    this.buffers.set(conversationId, buffer);
    this.messagesByConversation.set(conversationId, []);
    return buffer;
  }

  getBuffer(conversationId: string): ConversationBuffer | undefined {
    return this.buffers.get(conversationId);
  }

  addMessage(message: BufferMessage): void {
    const msgs = this.messagesByConversation.get(message.conversationId);
    if (msgs) {
      msgs.push(message);
    } else {
      this.messagesByConversation.set(message.conversationId, [message]);
    }

    const buffer = this.buffers.get(message.conversationId);
    if (buffer) {
      buffer.lastMessageAt = Math.max(buffer.lastMessageAt, message.timestamp);
      buffer.messages = this.messagesByConversation.get(message.conversationId) ?? [];
    }
  }

  getMessages(conversationId: string): BufferMessage[] {
    return this.messagesByConversation.get(conversationId) ?? [];
  }

  getMessageCount(conversationId: string): number {
    return this.messagesByConversation.get(conversationId)?.length ?? 0;
  }

  updateState(conversationId: string, state: ConversationState): void {
    const buffer = this.buffers.get(conversationId);
    if (buffer) {
      buffer.state = state;
    }
  }

  clearBuffer(conversationId: string): void {
    this.buffers.delete(conversationId);
    this.messagesByConversation.delete(conversationId);
  }

  hasConversation(conversationId: string): boolean {
    return this.buffers.has(conversationId);
  }

  getAllConversationIds(): string[] {
    return Array.from(this.buffers.keys());
  }

  getExpiredConversations(now: number): string[] {
    const expired: string[] = [];
    for (const [id, buf] of this.buffers) {
      if (buf.expiresAt <= now) {
        expired.push(id);
      }
    }
    return expired;
  }
}
