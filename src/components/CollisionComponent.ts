import { Component } from '../core/Component';
import { Entity } from '../core/Entity';
import { Vector2D } from '../types/CommonTypes';
import { TransformComponent } from './TransformComponent';

export interface CollisionConfig {
  radius: number;
  damage?: number;
  scoreValue?: number;
  onCollision?: (other: Entity) => void;
}

export class CollisionComponent implements Component {
  public readonly type = 'COLLISION';
  private readonly radius: number;
  private readonly damage: number;
  private readonly scoreValue: number;
  private readonly onCollision?: (other: Entity) => void;

  constructor(config: CollisionConfig) {
    this.radius = config.radius;
    this.damage = config.damage || 0;
    this.scoreValue = config.scoreValue || 0;
    this.onCollision = config.onCollision;
  }

  public checkCollision(entity: Entity, other: Entity): boolean {
    const transform = entity.getComponent('TRANSFORM') as TransformComponent;
    const otherTransform = other.getComponent('TRANSFORM') as TransformComponent;
    const otherCollision = other.getComponent('COLLISION') as CollisionComponent;

    if (!transform || !otherTransform || !otherCollision) return false;

    const distance = this.getDistance(transform.position, otherTransform.position);
    const minDistance = this.radius + otherCollision.radius;

    return distance < minDistance;
  }

  private getDistance(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public handleCollision(entity: Entity, other: Entity): void {
    // Call custom collision handler if provided
    if (this.onCollision) {
      this.onCollision(other);
    }

    // Apply damage if any
    if (this.damage > 0) {
      const otherHealth = other.getComponent('HEALTH');
      if (otherHealth) {
        otherHealth.takeDamage(this.damage);
      }
    }

    // Emit collision event
    if (entity.eventBus) {
      entity.eventBus.emit({
        type: 'COLLISION',
        payload: {
          entityA: entity,
          entityB: other,
          damage: this.damage,
          scoreValue: this.scoreValue
        }
      });
    }
  }

  public getRadius(): number {
    return this.radius;
  }

  public getDamage(): number {
    return this.damage;
  }

  public getScoreValue(): number {
    return this.scoreValue;
  }
} 