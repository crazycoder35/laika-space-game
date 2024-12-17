import { Component } from '../core/Component';
import { Entity } from '../core/Entity';
import { Vector2D } from '../types/CommonTypes';
import { TransformComponent } from './TransformComponent';

export interface WeaponConfig {
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  projectileSprite: string;
}

export class WeaponComponent implements Component {
  public readonly type = 'WEAPON';
  private lastFireTime: number = 0;
  private readonly damage: number;
  private readonly fireRate: number;
  private readonly projectileSpeed: number;
  private readonly projectileSprite: string;

  constructor(config: WeaponConfig) {
    this.damage = config.damage;
    this.fireRate = config.fireRate;
    this.projectileSpeed = config.projectileSpeed;
    this.projectileSprite = config.projectileSprite;
  }

  public fire(entity: Entity): void {
    const now = Date.now();
    if (now - this.lastFireTime < this.fireRate) return;

    const transform = entity.getComponent('TRANSFORM') as TransformComponent;
    if (!transform) return;

    // Calculate projectile spawn position and velocity
    const angle = transform.rotation;
    const spawnOffset = 30; // Distance from center of ship to spawn projectile
    const position: Vector2D = {
      x: transform.position.x + Math.cos(angle) * spawnOffset,
      y: transform.position.y + Math.sin(angle) * spawnOffset
    };

    const velocity: Vector2D = {
      x: Math.cos(angle) * this.projectileSpeed,
      y: Math.sin(angle) * this.projectileSpeed
    };

    // Create projectile entity
    const projectile = entity.entityManager.createEntity();
    projectile.type = 'PROJECTILE';

    // Add components
    projectile.addComponent(new TransformComponent({
      position,
      rotation: angle,
      scale: { x: 1, y: 1 }
    }));

    projectile.addComponent(new RenderComponent({
      sprite: {
        textureId: this.projectileSprite,
        width: 16,
        height: 16
      },
      layer: 1
    }));

    projectile.addComponent(new PhysicsComponent({
      velocity,
      mass: 0.1,
      friction: 0
    }));

    // Add damage property
    (projectile as any).damage = this.damage;

    // Set lifetime
    setTimeout(() => {
      if (projectile.isActive) {
        entity.entityManager.removeEntity(projectile.id);
      }
    }, 2000);

    this.lastFireTime = now;
  }

  public getDamage(): number {
    return this.damage;
  }

  public getFireRate(): number {
    return this.fireRate;
  }
} 