import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OwnershipManager } from '../ownership/OwnershipManager';
import { SuppressionManager } from '../suppression/SuppressionManager';
import { RecoveryManager } from '../recovery/RecoveryManager';

describe('RecoveryManager', () => {
  let ownershipManager: OwnershipManager;
  let suppressionManager: SuppressionManager;
  let recoveryManager: RecoveryManager;

  beforeEach(() => {
    ownershipManager = new OwnershipManager();
    suppressionManager = new SuppressionManager(ownershipManager);
    recoveryManager = new RecoveryManager(ownershipManager, suppressionManager);
  });

  afterEach(() => {
    recoveryManager.destroy();
  });

  it('debe iniciar recovery de HUMAN → AI', () => {
    ownershipManager.getOrCreate('conv-1');
    ownershipManager.transferOwnership('conv-1', 'HUMAN');

    const result = recoveryManager.requestRecovery('conv-1');

    expect(result.success).toBe(true);
    expect(result.previousOwner).toBe('HUMAN');
    expect(result.newState).toBe('AI_RECOVERY_PENDING');

    const state = ownershipManager.getState('conv-1');
    expect(state!.handoffState).toBe('AI_RECOVERY_PENDING');
  });

  it('debe completar recovery y restaurar AI', () => {
    ownershipManager.getOrCreate('conv-1');
    ownershipManager.transferOwnership('conv-1', 'HUMAN');
    suppressionManager.activate('conv-1', 'FULL_SUPPRESSION');

    recoveryManager.requestRecovery('conv-1');
    const result = recoveryManager.completeRecovery('conv-1');

    expect(result.success).toBe(true);
    expect(result.newOwner).toBe('AI');
    expect(result.newState).toBe('AI_RESTORED');
    expect(result.suppressionMode).toBe('NONE');

    const state = ownershipManager.getState('conv-1');
    expect(state!.owner).toBe('AI');
    expect(state!.suppressionMode).toBe('NONE');
  });

  it('debe fallar recovery si AI ya es owner', () => {
    ownershipManager.getOrCreate('conv-1');

    const result = recoveryManager.requestRecovery('conv-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('AI already owns');
  });

  it('debe fallar recovery si ownership es LOCKED', () => {
    ownershipManager.getOrCreate('conv-1');
    ownershipManager.setLocked('conv-1');

    const result = recoveryManager.requestRecovery('conv-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('LOCKED');
  });

  it('debe fallar completeRecovery si no está en AI_RECOVERY_PENDING', () => {
    ownershipManager.getOrCreate('conv-1');

    const result = recoveryManager.completeRecovery('conv-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Expected AI_RECOVERY_PENDING');
  });

  it('debe cancelar recovery y volver a HUMAN_ACTIVE', () => {
    ownershipManager.getOrCreate('conv-1');
    ownershipManager.transferOwnership('conv-1', 'HUMAN');
    recoveryManager.requestRecovery('conv-1');

    const result = recoveryManager.cancelRecovery('conv-1');

    expect(result.success).toBe(true);
    expect(result.newState).toBe('HUMAN_ACTIVE');

    const state = ownershipManager.getState('conv-1');
    expect(state!.handoffState).toBe('HUMAN_ACTIVE');
  });

  it('debe programar auto-recovery y ejecutarlo', () => {
    vi.useFakeTimers();

    ownershipManager.getOrCreate('conv-1');
    ownershipManager.transferOwnership('conv-1', 'HUMAN');
    recoveryManager.requestRecovery('conv-1');

    let recoveredId: string | null = null;
    recoveryManager.scheduleAutoRecovery('conv-1', 10_000, (convId) => {
      recoveredId = convId;
      recoveryManager.completeRecovery(convId);
    });

    vi.advanceTimersByTime(10_000);

    expect(recoveredId).toBe('conv-1');
    const state = ownershipManager.getState('conv-1');
    expect(state!.owner).toBe('AI');
    expect(state!.handoffState).toBe('AI_RESTORED');

    vi.useRealTimers();
  });

  it('debe limpiar recovery programado al llamar clearScheduledRecovery', () => {
    vi.useFakeTimers();

    ownershipManager.getOrCreate('conv-1');
    ownershipManager.transferOwnership('conv-1', 'HUMAN');
    recoveryManager.requestRecovery('conv-1');

    const onRecover = vi.fn();
    recoveryManager.scheduleAutoRecovery('conv-1', 10_000, onRecover);
    recoveryManager.clearScheduledRecovery('conv-1');

    vi.advanceTimersByTime(15_000);
    expect(onRecover).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
