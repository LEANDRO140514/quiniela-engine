import type { ConversationOwner, ConversationHandoffState } from '../types';

export class OwnershipManager {
  private states = new Map<string, ConversationHandoffState>();

  initialize(conversationId: string): ConversationHandoffState {
    const state: ConversationHandoffState = {
      conversationId,
      owner: 'AI',
      suppressionMode: 'NONE',
      handoffState: 'AI_ACTIVE',
      lastOwnershipChange: Date.now(),
      cooldowns: new Map(),
    };
    this.states.set(conversationId, state);
    return state;
  }

  getState(conversationId: string): ConversationHandoffState | undefined {
    return this.states.get(conversationId);
  }

  getOrCreate(conversationId: string): ConversationHandoffState {
    return this.states.get(conversationId) ?? this.initialize(conversationId);
  }

  transferOwnership(
    conversationId: string,
    newOwner: ConversationOwner,
  ): { success: boolean; previous: ConversationOwner; error?: string } {
    const state = this.getOrCreate(conversationId);
    const previous = state.owner;

    if (previous === 'LOCKED') {
      return { success: false, previous, error: 'Ownership is LOCKED — no takeover allowed' };
    }

    if (previous === newOwner) {
      return { success: false, previous, error: `Ownership already set to ${newOwner}` };
    }

    state.owner = newOwner;
    state.lastOwnershipChange = Date.now();
    return { success: true, previous };
  }

  setLocked(conversationId: string): { success: boolean; previous: ConversationOwner } {
    const state = this.getOrCreate(conversationId);
    const previous = state.owner;
    state.owner = 'LOCKED';
    state.lastOwnershipChange = Date.now();
    return { success: true, previous };
  }

  isOwnedBy(conversationId: string, owner: ConversationOwner): boolean {
    const state = this.states.get(conversationId);
    if (!state) return false;
    return state.owner === owner;
  }

  listByOwner(owner: ConversationOwner): string[] {
    const result: string[] = [];
    this.states.forEach((state, convId) => {
      if (state.owner === owner) result.push(convId);
    });
    return result;
  }

  clear(conversationId: string): void {
    this.states.delete(conversationId);
  }
}
