import { describe, it, expect } from 'vitest';
import { createConversationContext } from '../runtime/ConversationContext';
import { createExecutionContext } from '../runtime/ExecutionContext';
import {
  createOwnershipRecord,
  isTransferAllowed,
} from '../runtime/Ownership';
import type { ConversationOwner } from '../runtime/Ownership';
import {
  SUPPRESSION_MATRIX,
  createSuppressionRecord,
  getPermissions,
} from '../runtime/Suppression';
import type { SuppressionMode } from '../runtime/Suppression';

describe('ConversationContext', () => {
  it('debe crear contexto con defaults', () => {
    const ctx = createConversationContext({ conversationId: 'conv_test1' as never });
    expect(ctx.conversationId).toBe('conv_test1');
    expect(ctx.owner).toBe('AI');
    expect(ctx.suppressionMode).toBe('NONE');
    expect(ctx.state).toEqual({});
    expect(ctx.metadata).toEqual({});
    expect(ctx.startedAt).toBeLessThanOrEqual(Date.now());
  });

  it('debe aceptar overrides completos', () => {
    const ctx = createConversationContext({
      conversationId: 'conv_c1' as never,
      executionId: 'exec_e1' as never,
      tenantId: 'tnt_t1' as never,
      verticalId: 'dental',
      owner: 'HUMAN',
      suppressionMode: 'FULL_SUPPRESSION',
      state: { lastIntent: 'emergency' },
      metadata: { priority: 'critical' },
    });

    expect(ctx.owner).toBe('HUMAN');
    expect(ctx.suppressionMode).toBe('FULL_SUPPRESSION');
    expect(ctx.state.lastIntent).toBe('emergency');
    expect(ctx.metadata.priority).toBe('critical');
    expect(ctx.executionId).toBe('exec_e1');
    expect(ctx.verticalId).toBe('dental');
  });
});

describe('ExecutionContext', () => {
  it('debe crear contexto con defaults', () => {
    const ctx = createExecutionContext({
      workflowId: 'wf_test' as never,
      executionId: 'exec_test' as never,
    });

    expect(ctx.workflowId).toBe('wf_test');
    expect(ctx.executionId).toBe('exec_test');
    expect(ctx.currentState).toBe('idle');
    expect(ctx.input).toEqual({});
    expect(ctx.state).toEqual({});
  });

  it('debe aceptar conversationId y tenantId', () => {
    const ctx = createExecutionContext({
      workflowId: 'wf_w1' as never,
      executionId: 'exec_e1' as never,
      conversationId: 'conv_c1' as never,
      tenantId: 'tnt_t1' as never,
      currentState: 'processing',
      previousState: 'buffering',
      state: { buffer: 'ready' },
    });

    expect(ctx.conversationId).toBe('conv_c1');
    expect(ctx.tenantId).toBe('tnt_t1');
    expect(ctx.currentState).toBe('processing');
    expect(ctx.previousState).toBe('buffering');
    expect(ctx.state.buffer).toBe('ready');
  });
});

describe('Ownership', () => {
  it('debe crear ownership record', () => {
    const record = createOwnershipRecord('conv_1', 'AI');
    expect(record.conversationId).toBe('conv_1');
    expect(record.owner).toBe('AI');
    expect(record.changedAt).toBeLessThanOrEqual(Date.now());
  });

  it('debe registrar cambio con reason', () => {
    const record = createOwnershipRecord('conv_1', 'HUMAN', {
      previousOwner: 'AI',
      reason: 'handoff por emergencia',
      changedBy: 'usr_admin',
    });

    expect(record.owner).toBe('HUMAN');
    expect(record.previousOwner).toBe('AI');
    expect(record.reason).toBe('handoff por emergencia');
    expect(record.changedBy).toBe('usr_admin');
  });

  it('isTransferAllowed debe validar transiciones', () => {
    // Allowed
    expect(isTransferAllowed('AI', 'HUMAN')).toBe(true);
    expect(isTransferAllowed('AI', 'SHARED')).toBe(true);
    expect(isTransferAllowed('HUMAN', 'AI')).toBe(true);
    expect(isTransferAllowed('SHARED', 'AI')).toBe(true);
    expect(isTransferAllowed('HUMAN', 'SHARED')).toBe(true);

    // Not allowed
    expect(isTransferAllowed('LOCKED', 'AI')).toBe(false);
    expect(isTransferAllowed('LOCKED', 'HUMAN')).toBe(false);
    expect(isTransferAllowed('AI', 'LOCKED')).toBe(false);
    expect(isTransferAllowed('HUMAN', 'LOCKED')).toBe(false);

    // Same owner
    expect(isTransferAllowed('AI', 'AI')).toBe(false);
    expect(isTransferAllowed('HUMAN', 'HUMAN')).toBe(false);
    expect(isTransferAllowed('LOCKED', 'LOCKED')).toBe(false);
  });

  it('todos los owners deben ser strings válidos', () => {
    const owners: ConversationOwner[] = ['AI', 'HUMAN', 'SHARED', 'LOCKED'];
    owners.forEach((o) => {
      expect(typeof o).toBe('string');
      expect(o.length).toBeGreaterThan(0);
    });
  });
});

describe('Suppression', () => {
  it('debe crear suppression record', () => {
    const record = createSuppressionRecord('conv_1', 'FULL_SUPPRESSION');
    expect(record.conversationId).toBe('conv_1');
    expect(record.mode).toBe('FULL_SUPPRESSION');
    expect(record.activatedAt).toBeLessThanOrEqual(Date.now());
  });

  it('debe registrar cambio con reason', () => {
    const record = createSuppressionRecord('conv_1', 'ASSIST_MODE', {
      previousMode: 'NONE',
      reason: 'legal trigger',
      activatedBy: 'handoff-engine',
    });

    expect(record.mode).toBe('ASSIST_MODE');
    expect(record.previousMode).toBe('NONE');
    expect(record.reason).toBe('legal trigger');
    expect(record.activatedBy).toBe('handoff-engine');
  });

  it('SUPPRESSION_MATRIX debe cubrir todos los modos', () => {
    const modes: SuppressionMode[] = [
      'NONE',
      'SILENT_OBSERVER',
      'ASSIST_MODE',
      'FULL_SUPPRESSION',
    ];
    modes.forEach((m) => {
      expect(SUPPRESSION_MATRIX[m]).toBeDefined();
    });
  });

  it('FULL_SUPPRESSION debe negar todos los permisos', () => {
    const p = getPermissions('FULL_SUPPRESSION');
    expect(p.canRespond).toBe(false);
    expect(p.canSuggest).toBe(false);
    expect(p.canObserve).toBe(false);
    expect(p.canAct).toBe(false);
  });

  it('NONE debe conceder todos los permisos', () => {
    const p = getPermissions('NONE');
    expect(p.canRespond).toBe(true);
    expect(p.canSuggest).toBe(true);
    expect(p.canObserve).toBe(true);
    expect(p.canAct).toBe(true);
  });

  it('ASSIST_MODE permite sugerir pero no responder', () => {
    const p = getPermissions('ASSIST_MODE');
    expect(p.canSuggest).toBe(true);
    expect(p.canRespond).toBe(false);
    expect(p.canAct).toBe(false);
  });

  it('SILENT_OBSERVER permite observar solo', () => {
    const p = getPermissions('SILENT_OBSERVER');
    expect(p.canObserve).toBe(true);
    expect(p.canRespond).toBe(false);
    expect(p.canSuggest).toBe(false);
    expect(p.canAct).toBe(false);
  });
});
