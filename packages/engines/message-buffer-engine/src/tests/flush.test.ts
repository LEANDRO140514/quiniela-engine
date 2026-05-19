import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MessageBufferEngine } from '../engine/MessageBufferEngine';
import type { BufferMessage } from '../types';

function makeMsg(overrides: Partial<BufferMessage> = {}): BufferMessage {
  return {
    messageId: `msg-${Math.random().toString(36).slice(2, 8)}`,
    conversationId: 'conv-001',
    sourceId: `src-${Math.random().toString(36).slice(2, 8)}`,
    content: 'Hola',
    channel: 'whatsapp',
    senderType: 'contact',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('MessageBufferEngine — flush', () => {
  let engine: MessageBufferEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new MessageBufferEngine({ waitWindowMs: 10000 });
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it('flush manual debe devolver batch correcto', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1', content: 'uno', timestamp: 1000 }));
    engine.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2', content: 'dos', timestamp: 2000 }));

    const result = engine.flushConversation('conv-001');

    expect(result.state).toBe('FLUSHED');
    expect(result.batch).not.toBeNull();
    expect(result.batch!.conversationId).toBe('conv-001');
    expect(result.batch!.messageCount).toBe(2);
    expect(result.batch!.messages).toHaveLength(2);
    expect(result.batch!.consolidatedContent).toBe('uno\ndos');
    expect(result.batch!.flushedAt).toBeGreaterThan(0);
  });

  it('flush automático (por debounce) debe dejar estado READY_TO_FLUSH', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1' }));
    expect(engine.getConversationState('conv-001')).toBe('BUFFERING');

    vi.advanceTimersByTime(10001);
    expect(engine.getConversationState('conv-001')).toBe('READY_TO_FLUSH');

    const result = engine.flushConversation('conv-001');
    expect(result.state).toBe('FLUSHED');
    expect(result.batch).not.toBeNull();
    expect(result.batch!.messageCount).toBe(1);
  });

  it('flush por maxMessages debe ser funcional', () => {
    const small = new MessageBufferEngine({ maxMessages: 2, waitWindowMs: 60000 });

    const r1 = small.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1' }));
    expect(r1.state).toBe('BUFFERING');

    const r2 = small.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2' }));
    expect(r2.state).toBe('READY_TO_FLUSH');

    const result = small.flushConversation('conv-001');
    expect(result.batch!.messageCount).toBe(2);

    small.destroy();
  });

  it('clearConversation debe limpiar todo: mensajes, timers, estado', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1' }));
    engine.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2' }));
    expect(engine.activeConversations).toBe(1);

    engine.clearConversation('conv-001');

    expect(engine.getConversationState('conv-001')).toBe('IDLE');
    expect(engine.activeConversations).toBe(0);
    expect(engine.activeTimers).toBe(0);

    const result = engine.flushConversation('conv-001');
    expect(result.batch).toBeNull();
  });

  it('segundo bufferMessage después de flush debe crear nuevo buffer', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1' }));
    engine.flushConversation('conv-001');
    expect(engine.getConversationState('conv-001')).toBe('FLUSHED');

    engine.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2' }));
    expect(engine.getConversationState('conv-001')).toBe('BUFFERING');
    expect(engine.activeConversations).toBe(1);
  });

  it('debe consolidar contenido con saltos de línea entre mensajes', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1', content: 'Línea 1' }));
    engine.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2', content: 'Línea 2' }));
    engine.bufferMessage(makeMsg({ messageId: 'c', sourceId: 's3', content: 'Línea 3' }));

    const result = engine.flushConversation('conv-001');
    expect(result.batch!.consolidatedContent).toBe('Línea 1\nLínea 2\nLínea 3');
  });
});
