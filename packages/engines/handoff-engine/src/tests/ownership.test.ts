import { describe, it, expect, beforeEach } from 'vitest';
import { OwnershipManager } from '../ownership/OwnershipManager';
import type { ConversationOwner } from '../types';

describe('OwnershipManager', () => {
  let manager: OwnershipManager;

  beforeEach(() => {
    manager = new OwnershipManager();
  });

  it('debe inicializar conversación con AI ownership', () => {
    const state = manager.getOrCreate('conv-1');
    expect(state.owner).toBe('AI');
    expect(state.handoffState).toBe('AI_ACTIVE');
    expect(state.suppressionMode).toBe('NONE');
  });

  it('debe transferir ownership de AI a HUMAN', () => {
    manager.getOrCreate('conv-1');
    const result = manager.transferOwnership('conv-1', 'HUMAN');

    expect(result.success).toBe(true);
    expect(result.previous).toBe('AI');

    const state = manager.getState('conv-1');
    expect(state!.owner).toBe('HUMAN');
  });

  it('debe transferir ownership de HUMAN a AI', () => {
    manager.getOrCreate('conv-1');
    manager.transferOwnership('conv-1', 'HUMAN');

    const result = manager.transferOwnership('conv-1', 'AI');

    expect(result.success).toBe(true);
    expect(result.previous).toBe('HUMAN');
    expect(manager.getState('conv-1')!.owner).toBe('AI');
  });

  it('debe fallar al transferir al mismo owner', () => {
    manager.getOrCreate('conv-1');

    const result = manager.transferOwnership('conv-1', 'AI');

    expect(result.success).toBe(false);
    expect(result.error).toContain('already set to AI');
  });

  it('LOCKED debe prevenir cualquier transferencia', () => {
    manager.getOrCreate('conv-1');
    manager.setLocked('conv-1');

    const result = manager.transferOwnership('conv-1', 'HUMAN');

    expect(result.success).toBe(false);
    expect(result.error).toContain('LOCKED');
    expect(manager.getState('conv-1')!.owner).toBe('LOCKED');
  });

  it('debe listar conversaciones por owner', () => {
    manager.getOrCreate('conv-ai-1');
    manager.getOrCreate('conv-ai-2');
    manager.getOrCreate('conv-human');
    manager.transferOwnership('conv-human', 'HUMAN');
    manager.getOrCreate('conv-locked');
    manager.setLocked('conv-locked');

    expect(manager.listByOwner('AI')).toEqual(['conv-ai-1', 'conv-ai-2']);
    expect(manager.listByOwner('HUMAN')).toEqual(['conv-human']);
    expect(manager.listByOwner('LOCKED')).toEqual(['conv-locked']);
  });

  it('isOwnedBy debe verificar ownership correctamente', () => {
    manager.getOrCreate('conv-1');
    expect(manager.isOwnedBy('conv-1', 'AI')).toBe(true);
    expect(manager.isOwnedBy('conv-1', 'HUMAN')).toBe(false);

    manager.transferOwnership('conv-1', 'HUMAN');
    expect(manager.isOwnedBy('conv-1', 'AI')).toBe(false);
    expect(manager.isOwnedBy('conv-1', 'HUMAN')).toBe(true);
  });

  it('debe retornar undefined para conversación desconocida', () => {
    expect(manager.getState('no-existe')).toBeUndefined();
  });

  it('clear debe eliminar estado', () => {
    manager.getOrCreate('conv-1');
    manager.clear('conv-1');
    expect(manager.getState('conv-1')).toBeUndefined();
  });

  it('setLocked debe retornar previous owner', () => {
    manager.getOrCreate('conv-1');
    manager.transferOwnership('conv-1', 'HUMAN');

    const result = manager.setLocked('conv-1');

    expect(result.success).toBe(true);
    expect(result.previous).toBe('HUMAN');
  });
});
