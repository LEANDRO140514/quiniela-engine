import { describe, it, expect } from 'vitest';
import { createDomainEvent, isDomainEvent } from '../events/DomainEvent';
import type { DomainEvent } from '../events/DomainEvent';

describe('DomainEvent — canonical', () => {
  it('debe crear evento con campos mínimos', () => {
    const event = createDomainEvent('WorkflowStarted');

    expect(event.id).toMatch(/^evt_/);
    expect(event.type).toBe('WorkflowStarted');
    expect(typeof event.timestamp).toBe('number');
    expect(event.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('cada evento debe tener ID único', () => {
    const e1 = createDomainEvent('TestEvent');
    const e2 = createDomainEvent('TestEvent');
    const e3 = createDomainEvent('TestEvent');

    const ids = new Set([e1.id, e2.id, e3.id]);
    expect(ids.size).toBe(3);
  });

  it('debe aceptar overrides', () => {
    const overrides: Partial<DomainEvent> = {
      id: 'evt_custom_001',
      tenantId: 'tnt_tenant1',
      workspaceId: 'ws_ws1',
      conversationId: 'conv_c1',
      workflowId: 'wf_w1',
      correlationId: 'corr-123',
      causationId: 'evt_cause_parent',
      actorId: 'usr_admin',
      verticalId: 'dental',
      payload: { key: 'value' },
      metadata: { trace: 'abc' },
    };

    const event = createDomainEvent('CustomEvent', overrides);

    expect(event.id).toBe('evt_custom_001');
    expect(event.tenantId).toBe('tnt_tenant1');
    expect(event.workspaceId).toBe('ws_ws1');
    expect(event.conversationId).toBe('conv_c1');
    expect(event.workflowId).toBe('wf_w1');
    expect(event.correlationId).toBe('corr-123');
    expect(event.causationId).toBe('evt_cause_parent');
    expect(event.actorId).toBe('usr_admin');
    expect(event.verticalId).toBe('dental');
    expect(event.payload).toEqual({ key: 'value' });
    expect(event.metadata).toEqual({ trace: 'abc' });
  });

  it('isDomainEvent debe validar correctamente', () => {
    const valid = createDomainEvent('Test');
    expect(isDomainEvent(valid)).toBe(true);

    expect(isDomainEvent(null)).toBe(false);
    expect(isDomainEvent(undefined)).toBe(false);
    expect(isDomainEvent({})).toBe(false);
    expect(isDomainEvent({ id: 123, type: 'T', timestamp: 0 })).toBe(false);
    expect(isDomainEvent({ id: 'x', type: 'T' })).toBe(false);
  });

  it('timestamp debe ser sobrescribible', () => {
    const past = new Date('2025-01-01').getTime();
    const event = createDomainEvent('HistoricalEvent', { timestamp: past });
    expect(event.timestamp).toBe(past);
  });

  it('metadata debe aceptar tipos variados', () => {
    const event = createDomainEvent('MetaTest', {
      metadata: {
        string: 'hello',
        number: 42,
        boolean: true,
        nested: { key: 'val' },
        array: [1, 2, 3],
      },
    });
    expect(event.metadata?.string).toBe('hello');
    expect(event.metadata?.number).toBe(42);
    expect(event.metadata?.nested).toEqual({ key: 'val' });
  });

  it('payload debe aceptar undefined', () => {
    const event = createDomainEvent('NoPayload');
    expect(event.payload).toBeUndefined();
  });
});
