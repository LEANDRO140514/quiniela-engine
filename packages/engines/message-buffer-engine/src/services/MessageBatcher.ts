import type { BufferMessage, BatchedConversation } from '../types';

export class MessageBatcher {
  batch(
    conversationId: string,
    messages: BufferMessage[],
    startedAt: number,
    flushedAt: number,
  ): BatchedConversation {
    const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    const consolidatedContent = sorted
      .map((m) => m.content)
      .join('\n');

    return {
      conversationId,
      messages: sorted,
      consolidatedContent,
      messageCount: sorted.length,
      startedAt,
      flushedAt,
    };
  }
}
