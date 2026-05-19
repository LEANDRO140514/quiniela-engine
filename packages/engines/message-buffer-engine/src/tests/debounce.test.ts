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

describe('MessageBufferEngine — debounce', () => {
  let engine: MessageBufferEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new MessageBufferEngine({ waitWindowMs: 10000 });
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it('debe iniciar timer al recibir primer mensaje', () => {
    engine.bufferMessage(makeMsg());
    expect(engine.getConversationState('conv-001')).toBe('BUFFERING');
    expect(engine.activeTimers).toBe(1);
  });

  it('debe reiniciar timer al recibir nuevo mensaje en misma conversación', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1' }));

    vi.advanceTimersByTime(8000);
    engine.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2' }));

    vi.advanceTimersByTime(8000);
    expect(engine.getConversationState('conv-001')).toBe('BUFFERING');

    vi.advanceTimersByTime(3000);
    expect(engine.getConversationState('conv-001')).toBe('READY_TO_FLUSH');
  });

  it('debe transicionar a READY_TO_FLUSH al expirar waitWindowMs', () => {
    engine.bufferMessage(makeMsg());
    expect(engine.getConversationState('conv-001')).toBe('BUFFERING');

    vi.advanceTimersByTime(10001);
    expect(engine.getConversationState('conv-001')).toBe('READY_TO_FLUSH');
  });

  it('debe cancelar timer al hacer flush manual', () => {
    engine.bufferMessage(makeMsg());
    expect(engine.activeTimers).toBe(1);

    engine.flushConversation('conv-001');
    expect(engine.activeTimers).toBe(0);
  });

  it('debe cancelar timer al limpiar conversación', () => {
    engine.bufferMessage(makeMsg());
    expect(engine.activeTimers).toBe(1);

    engine.clearConversation('conv-001');
    expect(engine.activeTimers).toBe(0);
    expect(engine.getConversationState('conv-001')).toBe('IDLE');
  });

  it('no debe transicionar FLUSHED por debounce después de flush manual', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1' }));
    engine.flushConversation('conv-001');
    expect(engine.getConversationState('conv-001')).toBe('FLUSHED');

    vi.advanceTimersByTime(20000);
    expect(engine.getConversationState('conv-001')).toBe('FLUSHED');
  });
});
