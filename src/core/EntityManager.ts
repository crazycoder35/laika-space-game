import { Entity } from './Entity';
import { ComponentType } from './Component';

export type EntityGroup = Set<Entity>;
export type EntityQuery = (entity: Entity) => boolean;

export class EntityManager {
  private entities: Map<string, Entity>;
  private entityGroups: Map<ComponentType, EntityGroup>;

  constructor() {
    this.entities = new Map();
    this.entityGroups = new Map();
    
    // Initialize groups for each component type
    Object.values(ComponentType).forEach(type => {
      this.entityGroups.set(type, new Set());
    });
  }

  public createEntity(): Entity {
    const entity = new Entity();
    this.addEntity(entity);
    return entity;
  }

  public addEntity(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      throw new Error(`Entity with id ${entity.id} already exists`);
    }
    
    this.entities.set(entity.id, entity);
    entity.setManager(this);
  }

  public removeEntity(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      // Remove from all component groups first
      for (const type of Object.values(ComponentType)) {
        if (entity.hasComponent(type)) {
          this.onComponentRemoved(entity, type);
        }
      }
      
      entity.cleanup();
      this.entities.delete(id);
    }
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  public getEntitiesByComponent(type: ComponentType): EntityGroup {
    let group = this.entityGroups.get(type);
    if (!group) {
      group = new Set();
      this.entityGroups.set(type, group);
    }
    return group;
  }

  public queryEntities(query: EntityQuery): Entity[] {
    return Array.from(this.entities.values()).filter(query);
  }

  public update(deltaTime: number): void {
    for (const entity of this.entities.values()) {
      if (entity.isActive()) {
        entity.update(deltaTime);
      }
    }
  }

  public cleanup(): void {
    // Remove all entities from component groups first
    for (const entity of this.entities.values()) {
      for (const type of Object.values(ComponentType)) {
        if (entity.hasComponent(type)) {
          this.onComponentRemoved(entity, type);
        }
      }
      entity.cleanup();
    }
    
    this.entities.clear();
    this.entityGroups.clear();
    
    // Reinitialize empty groups
    Object.values(ComponentType).forEach(type => {
      this.entityGroups.set(type, new Set());
    });
  }

  // Component event handlers
  public onComponentAdded(entity: Entity, type: ComponentType): void {
    // Only add to group if the entity is managed by this manager
    if (!this.entities.has(entity.id)) return;

    const group = this.getEntitiesByComponent(type);
    if (!group.has(entity) && entity.hasComponent(type)) {
      group.add(entity);
    }
  }

  public onComponentRemoved(entity: Entity, type: ComponentType): void {
    const group = this.getEntitiesByComponent(type);
    if (group.has(entity)) {
      group.delete(entity);
    }
  }
}
