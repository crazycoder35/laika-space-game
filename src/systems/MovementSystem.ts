import { System, SystemType } from '../types/SystemTypes';
import { Entity } from '../core/Entity';
import { TransformComponent, Vector2D } from '../core/components/TransformComponent';
import { ComponentType } from '../core/Component';
import { EventBus } from '../core/EventBus';
import { MovementSystemConfig } from '../types/SystemInterfaces';

export interface MovementConstraints {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  maxSpeed: number;
  maxAcceleration: number;
}

export class MovementSystem implements System {
  public readonly priority = 2; // After physics
  public readonly dependencies = [SystemType.PHYSICS];
  
  private entities: Map<string, MovementConstraints> = new Map();
  private defaultConstraints: MovementConstraints;
  private readonly eventBus: EventBus;

  constructor(config: MovementSystemConfig) {
    this.eventBus = config.eventBus;
    this.defaultConstraints = {
      minX: config.minX,
      maxX: config.maxX,
      minY: config.minY,
      maxY: config.maxY,
      maxSpeed: config.maxSpeed,
      maxAcceleration: config.maxAcceleration
    };
  }

  public async initialize(): Promise<void> {
    // Initialization logic
  }

  public update(_deltaTime: number): void {
    // Movement updates are handled in moveEntity and teleport methods
  }

  public cleanup(): void {
    this.entities.clear();
  }

  private emitCollisionEvent(entity: Entity, boundary: string): void {
    this.eventBus.emit({
      type: 'BOUNDARY_COLLISION',
      payload: {
        entityId: entity.id,
        boundary
      }
    });
  }

  // Public methods for managing entities
  public addEntity(entity: Entity, constraints?: Partial<MovementConstraints>): void {
    this.entities.set(entity.id, {
      ...this.defaultConstraints,
      ...constraints
    });
  }

  public removeEntity(entity: Entity): void {
    this.entities.delete(entity.id);
  }

  public moveEntity(entity: Entity, delta: Vector2D): void {
    const transform = entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (transform) {
      const constraints = this.entities.get(entity.id) || this.defaultConstraints;
      const newPosition = {
        x: transform.position.x + delta.x,
        y: transform.position.y + delta.y
      };

      // Apply constraints and emit collision events
      if (newPosition.x < constraints.minX) {
        newPosition.x = constraints.minX;
        this.emitCollisionEvent(entity, 'left');
      } else if (newPosition.x > constraints.maxX) {
        newPosition.x = constraints.maxX;
        this.emitCollisionEvent(entity, 'right');
      }

      if (newPosition.y < constraints.minY) {
        newPosition.y = constraints.minY;
        this.emitCollisionEvent(entity, 'top');
      } else if (newPosition.y > constraints.maxY) {
        newPosition.y = constraints.maxY;
        this.emitCollisionEvent(entity, 'bottom');
      }

      transform.position = newPosition;
    }
  }

  public teleport(entity: Entity, position: Vector2D): void {
    const transform = entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (transform) {
      const constraints = this.entities.get(entity.id) || this.defaultConstraints;
      
      // Apply constraints to teleport position
      const constrainedPosition = {
        x: Math.max(constraints.minX, 
          Math.min(constraints.maxX, position.x)),
        y: Math.max(constraints.minY, 
          Math.min(constraints.maxY, position.y))
      };

      transform.position = constrainedPosition;
    }
  }

  public setVelocity(entity: Entity, velocity: Vector2D): void {
    const constraints = this.entities.get(entity.id) || this.defaultConstraints;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    if (speed > constraints.maxSpeed) {
      const scale = constraints.maxSpeed / speed;
      velocity.x *= scale;
      velocity.y *= scale;
    }
  }

  public updateConstraints(entity: Entity, constraints: Partial<MovementConstraints>): void {
    const current = this.entities.get(entity.id) || this.defaultConstraints;
    this.entities.set(entity.id, {
      ...current,
      ...constraints
    });
  }

  public getConstraints(entity: Entity): MovementConstraints {
    return this.entities.get(entity.id) || { ...this.defaultConstraints };
  }

  public getDefaultConstraints(): MovementConstraints {
    return { ...this.defaultConstraints };
  }
}
