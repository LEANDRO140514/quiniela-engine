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

describe('MessageBufferEngine — dedupe', () => {
  let engine: MessageBufferEngine;

  beforeEach(() => {
    engine = new MessageBufferEngine({ dedupWindowMs: 60000 });
  });

  it('debe detectar duplicado por messageId + sourceId', () => {
    const msg = makeMsg({ messageId: 'dup-id', sourceId: 'dup-src' });
    const first = engine.bufferMessage(msg);
    expect(first.duplicate).toBe(false);

    const second = engine.bufferMessage(msg);
    expect(second.duplicate).toBe(true);
    expect(second.messageCount).toBe(1);
  });

  it('debe aceptar mismo messageId con distinto sourceId', () => {
    const a = makeMsg({ messageId: 'same-msg', sourceId: 'src-A' });
    const b = makeMsg({ messageId: 'same-msg', sourceId: 'src-B' });

    expect(engine.bufferMessage(a).duplicate).toBe(false);
    expect(engine.bufferMessage(b).duplicate).toBe(false);
  });

  it('debe aceptar mismo sourceId con distinto messageId', () => {
    const a = makeMsg({ messageId: 'msg-A', sourceId: 'same-src' });
    const b = makeMsg({ messageId: 'msg-B', sourceId: 'same-src' });

    expect(engine.bufferMessage(a).duplicate).toBe(false);
    expect(engine.bufferMessage(b).duplicate).toBe(false);
  });

  it('dedupeMessage público debe funcionar igual que el interno', () => {
    const msg = makeMsg({ messageId: 'pub-test', sourceId: 'pub-src' });
    engine.bufferMessage(msg);

    expect(engine.dedupeMessage(msg)).toBe(true);
    expect(engine.dedupeMessage(makeMsg({ messageId: 'new-one', sourceId: 'new-src' }))).toBe(false);
  });

  it('debe evictar entradas viejas del cache de dedupe', async () => {
    const shortDedup = new MessageBufferEngine({ dedupWindowMs: 10, waitWindowMs: 5000 });
    const msg = makeMsg({ messageId: 'evict-test', sourceId: 'evict-src' });
    shortDedup.bufferMessage(msg);

    expect(shortDedup.dedupeMessage(msg)).toBe(true);

    await new Promise((r) => setTimeout(r, 20));

    expect(shortDedup.dedupeMessage(msg)).toBe(false);
  });
});
