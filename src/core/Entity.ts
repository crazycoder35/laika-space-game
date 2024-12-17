import { v4 as uuidv4 } from 'uuid';
import { Component, ComponentType } from './Component';
import { EntityManager } from './EntityManager';

export class Entity {
  public readonly id: string;
  private readonly components: Map<ComponentType, Component>;
  private active: boolean;
  private manager: EntityManager | null = null;
  private isBeingDestroyed: boolean = false;

  constructor() {
    this.id = uuidv4();
    this.components = new Map();
    this.active = true;
  }

  public setManager(manager: EntityManager | null): void {
    if (this.manager === manager) return;
    if (this.isBeingDestroyed) return;
    
    const oldManager = this.manager;
    this.manager = manager;

    // If we had a previous manager, remove all components from it
    if (oldManager) {
      for (const [type] of this.components) {
        oldManager.onComponentRemoved(this, type);
      }
    }

    // Add all existing components to the new manager
    if (manager) {
      for (const [type] of this.components) {
        manager.onComponentAdded(this, type);
      }
    }
  }

  public addComponent(component: Component): void {
    if (this.isBeingDestroyed) return;
    if (this.components.has(component.type)) {
      throw new Error(`Component of type ${component.type} already exists on entity ${this.id}`);
    }
    
    this.components.set(component.type, component);
    component.entity = this;
    component.initialize();

    // Only notify manager if we have one
    if (this.manager) {
      this.manager.onComponentAdded(this, component.type);
    }
  }

  public removeComponent(type: ComponentType): void {
    if (this.isBeingDestroyed) return;
    const component = this.components.get(type);
    if (component) {
      // Notify manager before removing the component
      if (this.manager) {
        this.manager.onComponentRemoved(this, type);
      }

      component.cleanup();
      this.components.delete(type);
    }
  }

  public getComponent<T extends Component>(type: ComponentType): T | undefined {
    return this.components.get(type) as T;
  }

  public hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  public getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  public update(deltaTime: number): void {
    if (!this.active || this.isBeingDestroyed) return;
    
    for (const component of this.components.values()) {
      component.update(deltaTime);
    }
  }

  public cleanup(): void {
    if (this.isBeingDestroyed) return;
    this.isBeingDestroyed = true;

    // Remove all components
    for (const [type, component] of this.components.entries()) {
      if (this.manager) {
        this.manager.onComponentRemoved(this, type);
      }
      component.cleanup();
    }
    this.components.clear();
    this.manager = null;
    this.isBeingDestroyed = false;
  }

  public isActive(): boolean {
    return this.active && !this.isBeingDestroyed;
  }

  public setActive(active: boolean): void {
    if (this.isBeingDestroyed) return;
    this.active = active;
  }
}
