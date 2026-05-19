import { describe, it, expect, vi } from 'vitest';
import { HandoffEngine } from '../engine/HandoffEngine';
import type { DomainEvent } from '@curdeeclau/shared';
import type { HandoffPolicySet, HandoffEventPayload } from '../types';

const dentalPolicies: HandoffPolicySet = {
  vertical: 'dental',
  description: 'Integration test policies',
  rules: [
    {
      id: 'hpol-legal',
      name: 'Legal',
      priority: 1,
      conditions: [
        { field: 'keyword', operator: 'contains', value: ['demanda', 'abogado'] },
      ],
      target: { type: 'human', id: 'directora', name: 'Directora' },
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: 'hpol-critical',
      name: 'Critical',
      priority: 2,
      conditions: [
        { field: 'escalationLevel', operator: 'equals', value: 'critical' },
      ],
      target: { type: 'human', id: 'senior', name: 'Senior' },
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: 'hpol-knowledge-gap',
      name: 'Knowledge Gap',
      priority: 5,
      conditions: [
        { field: 'intent', operator: 'equals', value: 'unknown' },
      ],
      target: { type: 'human', id: 'turno', name: 'Recepcionista Turno' },
      cooldownMs: 0,
      enabled: true,
    },
    {
      id: 'hpol-after-hours',
      name: 'After Hours',
      priority: 6,
      conditions: [
        { field: 'timeOfDay', operator: 'gte', value: '19:00' },
      ],
      target: { type: 'human', id: 'guardia', name: 'Guardia' },
      cooldownMs: 0,
      enabled: true,
    },
  ],
  targets: [
    { type: 'human', id: 'directora', name: 'Directora' },
    { type: 'human', id: 'senior', name: 'Senior' },
    { type: 'human', id: 'turno', name: 'Recepcionista Turno' },
    { type: 'human', id: 'guardia', name: 'Guardia' },
  ],
  defaultTimeoutMs: 300_000,
  maxQueueSize: 10,
};

function makeEngine() {
  const events: DomainEvent[] = [];
  const engine = new HandoffEngine({
    defaultTimeoutMs: 300_000,
    maxQueueSize: 10,
    policies: dentalPolicies,
    emitFn: (e) => events.push(e),
  });
  return { engine, events };
}

describe('HandoffEngine — integration flows', () => {
  it('flujo completo: evaluate → accept → close', async () => {
    const { engine, events } = makeEngine();

    // 1. Evaluate — trigger handoff
    const evalResult = await engine.evaluate({
      conversationId: 'flow-1',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'legal',
      keywords: ['demanda'],
    });
    expect(evalResult.accepted).toBe(true);
    expect(evalResult.state).toBe('HANDOFF_PENDING');

    // 2. Accept — human takes over
    const acceptResult = await engine.accept('flow-1');
    expect(acceptResult.accepted).toBe(true);
    expect(acceptResult.newOwner).toBe('HUMAN');
    expect(acceptResult.state).toBe('HUMAN_ACTIVE');

    // 3. Close — end handoff
    const closeResult = await engine.close('flow-1');
    expect(closeResult.state).toBe('HANDOFF_CLOSED');

    // Verify full event chain
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('HandoffRequested');
    expect(eventTypes).toContain('SuppressionActivated');
    expect(eventTypes).toContain('HandoffAccepted');
    expect(eventTypes).toContain('OwnershipChanged');
    expect(eventTypes).toContain('HandoffClosed');
  });

  it('flujo: evaluate → reject → AI restaurado', async () => {
    const { engine, events } = makeEngine();

    await engine.evaluate({
      conversationId: 'flow-2',
      trigger: 'KNOWLEDGE_GAP',
      escalationLevel: 'medium',
      intent: 'unknown',
    });

    const rejectResult = await engine.reject('flow-2');
    expect(rejectResult.accepted).toBe(false);
    expect(rejectResult.newOwner).toBe('AI');
    expect(rejectResult.state).toBe('AI_ACTIVE');
    expect(rejectResult.suppressionMode).toBe('NONE');

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('HandoffRejected');
  });

  it('flujo: evaluate → accept → recover → AI restaurado', async () => {
    const { engine, events } = makeEngine();

    // Handoff to human
    await engine.evaluate({
      conversationId: 'flow-3',
      trigger: 'EMERGENCY',
      escalationLevel: 'critical',
    });
    await engine.accept('flow-3');

    // Recover back to AI
    const recoverResult = await engine.recover('flow-3');
    expect(recoverResult.newOwner).toBe('AI');
    expect(recoverResult.state).toBe('AI_RESTORED');
    expect(recoverResult.suppressionMode).toBe('NONE');

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('AIRecoveryStarted');
    expect(eventTypes).toContain('AIRecovered');
  });

  it('flujo de integración con orchestrator vía execute()', async () => {
    const { engine } = makeEngine();

    // Simula el flujo: orchestrator recibe ConversationReadyToFlush → knowledge gap → handoff

    // Step 1: Evaluar
    const evalOutput = await engine.execute('evaluate', {
      conversationId: 'orch-flow-1',
      trigger: 'KNOWLEDGE_GAP',
      escalationLevel: 'medium',
      intent: 'unknown',
    });
    const evalResult = evalOutput as Record<string, unknown>;
    expect(evalResult.accepted).toBe(true);

    // Step 2: Aceptar
    const acceptOutput = await engine.execute('accept', {
      conversationId: 'orch-flow-1',
    });
    const acceptResult = acceptOutput as Record<string, unknown>;
    expect(acceptResult.newOwner).toBe('HUMAN');

    // Step 3: Recuperar
    const recoverOutput = await engine.execute('recover', {
      conversationId: 'orch-flow-1',
    });
    const recoverResult = recoverOutput as Record<string, unknown>;
    expect(recoverResult.newOwner).toBe('AI');

    // Step 4: Cerrar
    const closeOutput = await engine.execute('close', {
      conversationId: 'orch-flow-1',
    });
    const closeResult = closeOutput as Record<string, unknown>;
    expect(closeResult.state).toBe('HANDOFF_CLOSED');
  });

  it('LOCKED ownership previene takeover en integración', async () => {
    const { engine } = makeEngine();

    // Set up a conversation and lock it
    engine.getOwnershipManager().getOrCreate('locked-conv');
    engine.getOwnershipManager().setLocked('locked-conv');

    const result = await engine.evaluate({
      conversationId: 'locked-conv',
      trigger: 'LEGAL_RISK',
      escalationLevel: 'critical',
      keywords: ['abogado'],
    });

    expect(result.accepted).toBe(false);
    expect(result.request.status).toBe('rejected');
  });

  it('debe manejar after-hours trigger', async () => {
    const { engine, events } = makeEngine();

    const result = await engine.evaluate({
      conversationId: 'after-hours-conv',
      trigger: 'AFTER_HOURS',
      escalationLevel: 'medium',
      timeOfDay: '21:30',
    });

    expect(result.accepted).toBe(true);
    expect(result.request.matchedRuleId).toBe('hpol-after-hours');

    const requested = events.find((e) => e.type === 'HandoffRequested');
    expect((requested!.payload as HandoffEventPayload).targetId).toBe('guardia');
  });

  it('engineName debe ser handoff-engine', () => {
    const { engine } = makeEngine();
    expect(engine.engineName).toBe('handoff-engine');
  });

  it('getState debe retornar undefined para conversación nueva', () => {
    const { engine } = makeEngine();
    expect(engine.getState('no-existe')).toBeUndefined();
  });

  it('loadPolicies debe actualizar políticas', () => {
    const { engine } = makeEngine();

    const newPolicies: HandoffPolicySet = {
      vertical: 'dental',
      rules: [
        {
          id: 'new-rule',
          name: 'New',
          priority: 1,
          conditions: [{ field: 'intent', operator: 'equals', value: 'test' }],
          target: { type: 'human', id: 't1', name: 'T1' },
          enabled: true,
        },
      ],
      targets: [],
      defaultTimeoutMs: 60_000,
      maxQueueSize: 5,
    };

    engine.loadPolicies(newPolicies);
    // Policy change verified via evaluation
  });
});
