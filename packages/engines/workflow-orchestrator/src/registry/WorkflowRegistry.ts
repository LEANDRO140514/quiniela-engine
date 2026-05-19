import type { WorkflowDefinition, WorkflowRegistry as WorkflowRegistryInterface } from '../types';

export class InMemoryWorkflowRegistry implements WorkflowRegistryInterface {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  register(definition: WorkflowDefinition): void {
    if (this.workflows.has(definition.id)) {
      throw new Error(`Workflow "${definition.id}" already registered`);
    }
    this.workflows.set(definition.id, definition);
  }

  get(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  has(id: string): boolean {
    return this.workflows.has(id);
  }

  list(): string[] {
    return Array.from(this.workflows.keys());
  }

  findByVertical(verticalId: string): WorkflowDefinition[] {
    const result: WorkflowDefinition[] = [];
    for (const wf of this.workflows.values()) {
      if (wf.verticalId === verticalId) {
        result.push(wf);
      }
    }
    return result;
  }
}
