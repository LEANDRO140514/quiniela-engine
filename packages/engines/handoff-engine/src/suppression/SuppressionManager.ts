import type { SuppressionMode, ConversationHandoffState } from '../types';
import type { OwnershipManager } from '../ownership/OwnershipManager';

const SUPPRESSION_PERMISSIONS: Record<
  SuppressionMode,
  { canRespond: boolean; canSuggest: boolean; canObserve: boolean; canAct: boolean }
> = {
  FULL_SUPPRESSION: {
    canRespond: false,
    canSuggest: false,
    canObserve: false,
    canAct: false,
  },
  SILENT_OBSERVER: {
    canRespond: false,
    canSuggest: false,
    canObserve: true,
    canAct: false,
  },
  ASSIST_MODE: {
    canRespond: false,
    canSuggest: true,
    canObserve: true,
    canAct: false,
  },
  NONE: {
    canRespond: true,
    canSuggest: true,
    canObserve: true,
    canAct: true,
  },
};

export class SuppressionManager {
  private ownershipManager: OwnershipManager;

  constructor(ownershipManager: OwnershipManager) {
    this.ownershipManager = ownershipManager;
  }

  activate(
    conversationId: string,
    mode: SuppressionMode,
  ): { success: boolean; previous: SuppressionMode; permissions: SuppressionPermissions } {
    const state = this.ownershipManager.getOrCreate(conversationId);
    const previous = state.suppressionMode;

    if (previous === mode) {
      return {
        success: false,
        previous,
        permissions: SUPPRESSION_PERMISSIONS[mode],
      };
    }

    state.suppressionMode = mode;
    return {
      success: true,
      previous,
      permissions: SUPPRESSION_PERMISSIONS[mode],
    };
  }

  deactivate(conversationId: string): {
    success: boolean;
    previous: SuppressionMode;
    permissions: SuppressionPermissions;
  } {
    return this.activate(conversationId, 'NONE');
  }

  getMode(conversationId: string): SuppressionMode {
    const state = this.ownershipManager.getState(conversationId);
    return state?.suppressionMode ?? 'NONE';
  }

  getPermissions(conversationId: string): SuppressionPermissions {
    return SUPPRESSION_PERMISSIONS[this.getMode(conversationId)];
  }

  canRespond(conversationId: string): boolean {
    return this.getPermissions(conversationId).canRespond;
  }

  canSuggest(conversationId: string): boolean {
    return this.getPermissions(conversationId).canSuggest;
  }

  static getPermissionsFor(mode: SuppressionMode): SuppressionPermissions {
    return SUPPRESSION_PERMISSIONS[mode];
  }
}

export interface SuppressionPermissions {
  canRespond: boolean;
  canSuggest: boolean;
  canObserve: boolean;
  canAct: boolean;
}
