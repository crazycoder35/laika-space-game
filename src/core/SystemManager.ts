import { System, SystemType } from '../types/SystemTypes';

export class SystemManager {
  private readonly systems: Map<SystemType, System>;

  constructor() {
    this.systems = new Map();
  }

  public async initialize(): Promise<void> {
    // Initialize systems in dependency order
    const sortedSystems = this.getTopologicallySortedSystems();
    for (const system of sortedSystems) {
      await system.initialize();
    }
  }

  public update(deltaTime: number): void {
    // Update systems in priority order
    const sortedSystems = this.getPrioritySortedSystems();
    for (const system of sortedSystems) {
      system.update(deltaTime);
    }
  }

  public render(): void {
    // Call render on systems that implement it
    const renderSystem = this.systems.get(SystemType.RENDER);
    if (renderSystem && 'render' in renderSystem) {
      (renderSystem as any).render();
    }

    // Call render on HUD system after main render
    const hudSystem = this.systems.get(SystemType.HUD);
    if (hudSystem && 'render' in hudSystem) {
      (hudSystem as any).render();
    }
  }

  public cleanup(): void {
    // Cleanup systems in reverse dependency order
    const sortedSystems = this.getTopologicallySortedSystems().reverse();
    for (const system of sortedSystems) {
      system.cleanup();
    }
  }

  // Alias for addSystem to maintain backward compatibility
  public registerSystem(type: SystemType, system: System): void {
    this.addSystem(type, system);
  }

  public addSystem(type: SystemType, system: System): void {
    if (this.systems.has(type)) {
      throw new Error(`System of type ${type} already exists`);
    }

    // Verify dependencies
    for (const dependency of system.dependencies) {
      if (!this.systems.has(dependency)) {
        throw new Error(`System ${type} depends on ${dependency} which is not registered`);
      }
    }

    this.systems.set(type, system);
  }

  public getSystem<T extends System>(type: SystemType): T {
    const system = this.systems.get(type) as T;
    if (!system) {
      throw new Error(`System of type ${type} not found`);
    }
    return system;
  }

  private getPrioritySortedSystems(): System[] {
    const systems = Array.from(this.systems.values());
    return systems.sort((a, b) => a.priority - b.priority);
  }

  private getTopologicallySortedSystems(): System[] {
    const visited = new Set<SystemType>();
    const visiting = new Set<SystemType>();
    const sorted: System[] = [];

    const visit = (type: SystemType) => {
      if (visited.has(type)) return;
      if (visiting.has(type)) {
        throw new Error('Circular dependency detected in systems');
      }

      visiting.add(type);

      const system = this.systems.get(type);
      if (system) {
        for (const dependency of system.dependencies) {
          visit(dependency);
        }
        sorted.push(system);
      }

      visiting.delete(type);
      visited.add(type);
    };

    // Visit all systems
    for (const [type] of this.systems) {
      try {
        visit(type);
      } catch (err) {
        const error = err as Error;
        throw new Error(`Failed to sort system dependencies: ${error.message}`);
      }
    }

    return sorted;
  }

  public validateDependencies(): void {
    // Check for missing dependencies
    this.systems.forEach((system, type) => {
      for (const dependency of system.dependencies) {
        if (!this.systems.has(dependency)) {
          throw new Error(`System ${type} depends on ${dependency} which is not registered`);
        }
      }
    });

    // Check for circular dependencies
    try {
      this.getTopologicallySortedSystems();
    } catch (err) {
      const error = err as Error;
      throw new Error(`Invalid system dependencies: ${error.message}`);
    }
  }

  public getSystemTypes(): SystemType[] {
    return Array.from(this.systems.keys());
  }

  public hasSystem(type: SystemType): boolean {
    return this.systems.has(type);
  }

  public clear(): void {
    this.systems.clear();
  }
}
