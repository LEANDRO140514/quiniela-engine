import type { HandoffState, ConversationOwner, SuppressionMode } from '../types';
import type { OwnershipManager } from '../ownership/OwnershipManager';
import type { SuppressionManager } from '../suppression/SuppressionManager';

export interface RecoveryResult {
  success: boolean;
  previousState: HandoffState;
  newState: HandoffState;
  previousOwner: ConversationOwner;
  newOwner: ConversationOwner;
  suppressionMode: SuppressionMode;
  error?: string;
}

export class RecoveryManager {
  private ownershipManager: OwnershipManager;
  private suppressionManager: SuppressionManager;
  private recoveryTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(ownershipManager: OwnershipManager, suppressionManager: SuppressionManager) {
    this.ownershipManager = ownershipManager;
    this.suppressionManager = suppressionManager;
  }

  requestRecovery(conversationId: string): RecoveryResult {
    const state = this.ownershipManager.getOrCreate(conversationId);
    const previousState = state.handoffState;
    const previousOwner = state.owner;

    if (previousOwner === 'AI') {
      return {
        success: false,
        previousState,
        newState: previousState,
        previousOwner,
        newOwner: previousOwner,
        suppressionMode: state.suppressionMode,
        error: 'AI already owns this conversation',
      };
    }

    if (previousOwner === 'LOCKED') {
      return {
        success: false,
        previousState,
        newState: previousState,
        previousOwner,
        newOwner: previousOwner,
        suppressionMode: state.suppressionMode,
        error: 'Ownership is LOCKED — recovery not possible',
      };
    }

    state.handoffState = 'AI_RECOVERY_PENDING';
    return {
      success: true,
      previousState,
      newState: 'AI_RECOVERY_PENDING',
      previousOwner,
      newOwner: previousOwner,
      suppressionMode: state.suppressionMode,
    };
  }

  completeRecovery(conversationId: string): RecoveryResult {
    const state = this.ownershipManager.getOrCreate(conversationId);
    const previousState = state.handoffState;
    const previousOwner = state.owner;

    if (previousState !== 'AI_RECOVERY_PENDING') {
      return {
        success: false,
        previousState,
        newState: previousState,
        previousOwner,
        newOwner: previousOwner,
        suppressionMode: state.suppressionMode,
        error: `Expected AI_RECOVERY_PENDING, got ${previousState}`,
      };
    }

    const ownershipResult = this.ownershipManager.transferOwnership(conversationId, 'AI');
    if (!ownershipResult.success) {
      return {
        success: false,
        previousState,
        newState: previousState,
        previousOwner,
        newOwner: previousOwner,
        suppressionMode: state.suppressionMode,
        error: ownershipResult.error,
      };
    }

    this.suppressionManager.deactivate(conversationId);
    state.handoffState = 'AI_RESTORED';

    return {
      success: true,
      previousState,
      newState: 'AI_RESTORED',
      previousOwner: ownershipResult.previous,
      newOwner: 'AI',
      suppressionMode: 'NONE',
    };
  }

  cancelRecovery(conversationId: string): RecoveryResult {
    const state = this.ownershipManager.getOrCreate(conversationId);
    const previousState = state.handoffState;

    if (previousState !== 'AI_RECOVERY_PENDING') {
      return {
        success: false,
        previousState,
        newState: previousState,
        previousOwner: state.owner,
        newOwner: state.owner,
        suppressionMode: state.suppressionMode,
        error: `Expected AI_RECOVERY_PENDING, got ${previousState}`,
      };
    }

    state.handoffState = 'HUMAN_ACTIVE';
    return {
      success: true,
      previousState,
      newState: 'HUMAN_ACTIVE',
      previousOwner: state.owner,
      newOwner: state.owner,
      suppressionMode: state.suppressionMode,
    };
  }

  scheduleAutoRecovery(conversationId: string, delayMs: number, onRecover: (convId: string) => void): void {
    this.clearScheduledRecovery(conversationId);
    const timeout = setTimeout(() => {
      this.recoveryTimeouts.delete(conversationId);
      onRecover(conversationId);
    }, delayMs);
    this.recoveryTimeouts.set(conversationId, timeout);
  }

  clearScheduledRecovery(conversationId: string): void {
    const existing = this.recoveryTimeouts.get(conversationId);
    if (existing) {
      clearTimeout(existing);
      this.recoveryTimeouts.delete(conversationId);
    }
  }

  destroy(): void {
    this.recoveryTimeouts.forEach((t) => clearTimeout(t));
    this.recoveryTimeouts.clear();
  }
}
