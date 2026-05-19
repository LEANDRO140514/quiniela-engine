import { describe, it, expect, beforeEach } from 'vitest';
import { StateResolver } from '../runtime/StateResolver';
import type { StateMachine } from '../types';

const dentalStateMachine: StateMachine = {
  id: 'sarah-dental-state-machine',
  verticalId: 'dental',
  version: '0.1.0',
  initial: 'idle',
  states: [
    {
      name: 'idle',
      transitions: [
        { event: 'ConversationReadyToFlush', target: 'classifying' },
      ],
    },
    {
      name: 'classifying',
      transitions: [
        { event: 'WorkflowStepExecuted', target: 'routing' },
        { event: 'WorkflowStepFailed', target: 'idle' },
      ],
    },
    {
      name: 'routing',
      transitions: [
        { event: 'WorkflowStepExecuted', target: 'treatment_inquiry' },
      ],
    },
    {
      name: 'treatment_inquiry',
      transitions: [
        { event: 'WorkflowStepExecuted', target: 'responding' },
        { event: 'WorkflowStepFailed', target: 'idle' },
      ],
    },
    {
      name: 'responding',
      transitions: [
        { event: 'WorkflowCompleted', target: 'idle' },
      ],
    },
  ],
};

describe('StateResolver', () => {
  let resolver: StateResolver;

  beforeEach(() => {
    resolver = new StateResolver();
  });

  it('debe rechazar transición sin state machine cargada', () => {
    const result = resolver.validateTransition('idle', 'ConversationReadyToFlush');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No state machine loaded');
  });

  it('debe validar transición correcta', () => {
    resolver.loadStateMachine(dentalStateMachine);
    const result = resolver.validateTransition('idle', 'ConversationReadyToFlush');
    expect(result.valid).toBe(true);
    expect(result.target).toBe('classifying');
  });

  it('debe rechazar transición inválida', () => {
    resolver.loadStateMachine(dentalStateMachine);
    const result = resolver.validateTransition('idle', 'WorkflowCompleted');
    expect(result.valid).toBe(false);
  });

  it('debe rechazar estado desconocido', () => {
    resolver.loadStateMachine(dentalStateMachine);
    const result = resolver.validateTransition('nonexistent', 'ConversationReadyToFlush');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('resolveNextState debe devolver target en transición válida', () => {
    resolver.loadStateMachine(dentalStateMachine);
    expect(resolver.resolveNextState('idle', 'ConversationReadyToFlush')).toBe('classifying');
  });

  it('resolveNextState debe mantenerse en mismo estado si inválido', () => {
    resolver.loadStateMachine(dentalStateMachine);
    expect(resolver.resolveNextState('idle', 'InvalidEvent')).toBe('idle');
  });

  it('getInitialState debe devolver initial del machine', () => {
    resolver.loadStateMachine(dentalStateMachine);
    expect(resolver.getInitialState()).toBe('idle');
  });

  it('getInitialState sin machine debe devolver idle', () => {
    expect(resolver.getInitialState()).toBe('idle');
  });

  it('debe seguir cadena completa de transiciones', () => {
    resolver.loadStateMachine(dentalStateMachine);

    let state = resolver.resolveNextState('idle', 'ConversationReadyToFlush');
    expect(state).toBe('classifying');

    state = resolver.resolveNextState(state, 'WorkflowStepExecuted');
    expect(state).toBe('routing');

    state = resolver.resolveNextState(state, 'WorkflowStepExecuted');
    expect(state).toBe('treatment_inquiry');

    state = resolver.resolveNextState(state, 'WorkflowStepExecuted');
    expect(state).toBe('responding');

    state = resolver.resolveNextState(state, 'WorkflowCompleted');
    expect(state).toBe('idle');
  });
});
