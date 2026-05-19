import { describe, it, expect, beforeEach } from 'vitest';
import { OwnershipManager } from '../ownership/OwnershipManager';
import { SuppressionManager } from '../suppression/SuppressionManager';
import type { SuppressionMode } from '../types';

describe('SuppressionManager', () => {
  let ownershipManager: OwnershipManager;
  let suppressionManager: SuppressionManager;

  beforeEach(() => {
    ownershipManager = new OwnershipManager();
    suppressionManager = new SuppressionManager(ownershipManager);
  });

  it('modo inicial debe ser NONE', () => {
    ownershipManager.getOrCreate('conv-1');
    expect(suppressionManager.getMode('conv-1')).toBe('NONE');
  });

  it('debe activar FULL_SUPPRESSION', () => {
    ownershipManager.getOrCreate('conv-1');
    const result = suppressionManager.activate('conv-1', 'FULL_SUPPRESSION');

    expect(result.success).toBe(true);
    expect(result.previous).toBe('NONE');
    expect(result.permissions.canRespond).toBe(false);
    expect(result.permissions.canSuggest).toBe(false);
    expect(result.permissions.canObserve).toBe(false);
    expect(result.permissions.canAct).toBe(false);
    expect(suppressionManager.getMode('conv-1')).toBe('FULL_SUPPRESSION');
  });

  it('debe activar SILENT_OBSERVER', () => {
    ownershipManager.getOrCreate('conv-1');
    const result = suppressionManager.activate('conv-1', 'SILENT_OBSERVER');

    expect(result.success).toBe(true);
    expect(result.permissions.canRespond).toBe(false);
    expect(result.permissions.canSuggest).toBe(false);
    expect(result.permissions.canObserve).toBe(true);
    expect(result.permissions.canAct).toBe(false);
  });

  it('debe activar ASSIST_MODE', () => {
    ownershipManager.getOrCreate('conv-1');
    const result = suppressionManager.activate('conv-1', 'ASSIST_MODE');

    expect(result.success).toBe(true);
    expect(result.permissions.canRespond).toBe(false);
    expect(result.permissions.canSuggest).toBe(true);
    expect(result.permissions.canObserve).toBe(true);
    expect(result.permissions.canAct).toBe(false);
  });

  it('debe desactivar suppression a NONE', () => {
    ownershipManager.getOrCreate('conv-1');
    suppressionManager.activate('conv-1', 'FULL_SUPPRESSION');

    const result = suppressionManager.deactivate('conv-1');

    expect(result.success).toBe(true);
    expect(result.previous).toBe('FULL_SUPPRESSION');
    expect(suppressionManager.getMode('conv-1')).toBe('NONE');
    expect(result.permissions.canRespond).toBe(true);
  });

  it('debe fallar si ya está en el mismo modo', () => {
    ownershipManager.getOrCreate('conv-1');
    suppressionManager.activate('conv-1', 'FULL_SUPPRESSION');

    const result = suppressionManager.activate('conv-1', 'FULL_SUPPRESSION');

    expect(result.success).toBe(false);
  });

  it('canRespond y canSuggest deben funcionar', () => {
    ownershipManager.getOrCreate('conv-1');

    expect(suppressionManager.canRespond('conv-1')).toBe(true);
    expect(suppressionManager.canSuggest('conv-1')).toBe(true);

    suppressionManager.activate('conv-1', 'FULL_SUPPRESSION');

    expect(suppressionManager.canRespond('conv-1')).toBe(false);
    expect(suppressionManager.canSuggest('conv-1')).toBe(false);
  });

  it('getPermissionsFor debe retornar permisos estáticos', () => {
    const full = SuppressionManager.getPermissionsFor('FULL_SUPPRESSION');
    expect(full.canRespond).toBe(false);
    expect(full.canAct).toBe(false);

    const none = SuppressionManager.getPermissionsFor('NONE');
    expect(none.canRespond).toBe(true);
    expect(none.canAct).toBe(true);

    const assist = SuppressionManager.getPermissionsFor('ASSIST_MODE');
    expect(assist.canSuggest).toBe(true);
    expect(assist.canRespond).toBe(false);

    const observer = SuppressionManager.getPermissionsFor('SILENT_OBSERVER');
    expect(observer.canObserve).toBe(true);
    expect(observer.canRespond).toBe(false);
  });

  it('conversación sin estado retorna NONE', () => {
    expect(suppressionManager.getMode('no-existe')).toBe('NONE');
    expect(suppressionManager.canRespond('no-existe')).toBe(true);
  });
});
