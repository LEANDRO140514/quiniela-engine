import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventDispatcher } from '../runtime/EventDispatcher';
import { createEvent, isEventType } from '../events/DomainEvent';

describe('DomainEvent factory', () => {
  it('debe crear evento con id único', () => {
    const a = createEvent('MessageBuffered');
    const b = createEvent('MessageBuffered');
    expect(a.id).not.toBe(b.id);
  });

  it('debe incluir timestamp', () => {
    const evt = createEvent('WorkflowStarted');
    expect(evt.timestamp).toBeGreaterThan(0);
    expect(evt.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('debe aceptar overrides', () => {
    const evt = createEvent('ConversationReadyToFlush', {
      conversationId: 'conv-123',
      correlationId: 'corr-456',
      payload: { batchSize: 3 },
    });
    expect(evt.conversationId).toBe('conv-123');
    expect(evt.correlationId).toBe('corr-456');
    expect(evt.payload).toEqual({ batchSize: 3 });
  });

  it('isEventType debe validar correctamente', () => {
    const evt = createEvent('WorkflowCompleted');
    expect(isEventType(evt, 'WorkflowCompleted')).toBe(true);
    expect(isEventType(evt, 'WorkflowStarted')).toBe(false);
  });
});

describe('InMemoryEventDispatcher', () => {
  let dispatcher: InMemoryEventDispatcher;

  beforeEach(() => {
    dispatcher = new InMemoryEventDispatcher();
  });

  it('debe despachar evento a handler registrado', async () => {
    const handler = vi.fn();
    dispatcher.on('MessageBuffered', handler);

    const evt = createEvent('MessageBuffered', { conversationId: 'c1' });
    await dispatcher.dispatch(evt);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(evt);
  });

  it('debe despachar a wildcard handlers', async () => {
    const specific = vi.fn();
    const wild = vi.fn();

    dispatcher.on('WorkflowStarted', specific);
    dispatcher.on('*', wild);

    const evt = createEvent('WorkflowStarted');
    await dispatcher.dispatch(evt);

    expect(specific).toHaveBeenCalledTimes(1);
    expect(wild).toHaveBeenCalledTimes(1);
  });

  it('no debe llamar handlers de otro tipo', async () => {
    const handler = vi.fn();
    dispatcher.on('WorkflowCompleted', handler);

    await dispatcher.dispatch(createEvent('MessageBuffered'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('off debe remover handler', async () => {
    const handler = vi.fn();
    dispatcher.on('MessageBuffered', handler);
    dispatcher.off('MessageBuffered', handler);

    await dispatcher.dispatch(createEvent('MessageBuffered'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('listenerCount debe reportar correctamente', () => {
    dispatcher.on('MessageBuffered', vi.fn());
    dispatcher.on('MessageBuffered', vi.fn());
    dispatcher.on('WorkflowStarted', vi.fn());

    expect(dispatcher.listenerCount('MessageBuffered')).toBe(2);
    expect(dispatcher.listenerCount('WorkflowStarted')).toBe(1);
    expect(dispatcher.listenerCount('ConversationReadyToFlush')).toBe(0);
  });
});
