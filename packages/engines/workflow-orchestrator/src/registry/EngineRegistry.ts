import type { Engine, EngineRegistry as EngineRegistryInterface } from '../types';

export class InMemoryEngineRegistry implements EngineRegistryInterface {
  private engines: Map<string, Engine> = new Map();

  register(engine: Engine): void {
    if (this.engines.has(engine.engineName)) {
      throw new Error(`Engine "${engine.engineName}" already registered`);
    }
    this.engines.set(engine.engineName, engine);
  }

  get(name: string): Engine | undefined {
    return this.engines.get(name);
  }

  has(name: string): boolean {
    return this.engines.has(name);
  }

  list(): string[] {
    return Array.from(this.engines.keys());
  }
}
