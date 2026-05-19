import { describe, it, expect, beforeEach } from 'vitest';
import { MessageBufferEngine } from '../engine/MessageBufferEngine';
import type { BufferMessage } from '../types';

function makeMsg(overrides: Partial<BufferMessage> = {}): BufferMessage {
  return {
    messageId: 'msg-001',
    conversationId: 'conv-001',
    sourceId: 'src-001',
    content: 'Hola',
    channel: 'whatsapp',
    senderType: 'contact',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('MessageBufferEngine — buffering & batching', () => {
  let engine: MessageBufferEngine;

  beforeEach(() => {
    engine = new MessageBufferEngine({ waitWindowMs: 100, dedupWindowMs: 5000, expiryMs: 60000, maxMessages: 50 });
  });

  it('debe agrupar mensajes con mismo conversationId', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1', content: 'Hola' }));
    engine.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2', content: 'quiero' }));
    engine.bufferMessage(makeMsg({ messageId: 'c', sourceId: 's3', content: 'agendar' }));

    const state = engine.getConversationState('conv-001');
    expect(state).toBe('BUFFERING');
    expect(engine.activeConversations).toBe(1);
  });

  it('debe separar mensajes de conversaciones diferentes', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a1', conversationId: 'conv-A', sourceId: 's1' }));
    engine.bufferMessage(makeMsg({ messageId: 'b1', conversationId: 'conv-B', sourceId: 's2' }));

    expect(engine.activeConversations).toBe(2);
    expect(engine.getConversationState('conv-A')).toBe('BUFFERING');
    expect(engine.getConversationState('conv-B')).toBe('BUFFERING');
  });

  it('debe forzar READY_TO_FLUSH al alcanzar maxMessages', () => {
    const engineSmall = new MessageBufferEngine({ maxMessages: 3, waitWindowMs: 10000 });
    engineSmall.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1' }));
    engineSmall.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2' }));
    const result = engineSmall.bufferMessage(makeMsg({ messageId: 'c', sourceId: 's3' }));

    expect(result.state).toBe('READY_TO_FLUSH');
    expect(result.messageCount).toBe(3);
    expect(result.duplicate).toBe(false);
  });

  it('debe mantener orden de inserción en el batch', () => {
    engine.bufferMessage(makeMsg({ messageId: 'a', sourceId: 's1', content: 'primero', timestamp: 1000 }));
    engine.bufferMessage(makeMsg({ messageId: 'b', sourceId: 's2', content: 'segundo', timestamp: 2000 }));
    engine.bufferMessage(makeMsg({ messageId: 'c', sourceId: 's3', content: 'tercero', timestamp: 3000 }));

    const result = engine.flushConversation('conv-001');
    expect(result.batch).not.toBeNull();
    expect(result.batch!.messages.map((m) => m.content)).toEqual(['primero', 'segundo', 'tercero']);
    expect(result.batch!.consolidatedContent).toBe('primero\nsegundo\ntercero');
    expect(result.batch!.messageCount).toBe(3);
  });

  it('debe devolver IDLE para conversación inexistente', () => {
    expect(engine.getConversationState('no-existe')).toBe('IDLE');
  });

  it('flushConversation sobre conversación inexistente devuelve null', () => {
    const result = engine.flushConversation('no-existe');
    expect(result.batch).toBeNull();
    expect(result.state).toBe('IDLE');
  });
});
