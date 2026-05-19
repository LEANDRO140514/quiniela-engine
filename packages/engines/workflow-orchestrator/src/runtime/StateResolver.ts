import type { StateMachine, StateDefinition } from '../types';

export class StateResolver {
  private machine: StateMachine | null = null;

  loadStateMachine(machine: StateMachine): void {
    this.machine = machine;
  }

  getMachine(): StateMachine | null {
    return this.machine;
  }

  getCurrentState(stateName: string): StateDefinition | undefined {
    if (!this.machine) return undefined;
    return this.machine.states.find((s) => s.name === stateName);
  }

  validateTransition(fromState: string, event: string): { valid: boolean; target: string; reason?: string } {
    if (!this.machine) {
      return { valid: false, target: fromState, reason: 'No state machine loaded' };
    }

    const state = this.getCurrentState(fromState);
    if (!state) {
      return { valid: false, target: fromState, reason: `State "${fromState}" not found in machine` };
    }

    const transition = state.transitions.find((t) => t.event === event);
    if (!transition) {
      return {
        valid: false,
        target: fromState,
        reason: `No transition for event "${event}" from state "${fromState}"`,
      };
    }

    return { valid: true, target: transition.target };
  }

  resolveNextState(fromState: string, event: string): string {
    const result = this.validateTransition(fromState, event);
    return result.valid ? result.target : fromState;
  }

  getInitialState(): string {
    return this.machine?.initial ?? 'idle';
  }
}
