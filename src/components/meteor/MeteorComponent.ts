import { Component, ComponentType } from '../../core/Component';
import { TransformComponent, Vector2D } from '../../core/components/TransformComponent';
import { EventBus } from '../../core/EventBus';

export interface MeteorConfig {
  size: 'large' | 'medium' | 'small';
  velocity: Vector2D;
  rotationSpeed: number;
  health: number;
  damage: number;
  scoreValue: number;
}

export const METEOR_CONFIGS = {
  large: {
    size: 'large',
    velocity: { x: 50, y: 50 },
    rotationSpeed: Math.PI / 4,
    health: 100,
    damage: 50,
    scoreValue: 100
  },
  medium: {
    size: 'medium',
    velocity: { x: 75, y: 75 },
    rotationSpeed: Math.PI / 3,
    health: 50,
    damage: 30,
    scoreValue: 50
  },
  small: {
    size: 'small',
    velocity: { x: 100, y: 100 },
    rotationSpeed: Math.PI / 2,
    health: 25,
    damage: 20,
    scoreValue: 25
  }
} as const;

export class MeteorComponent extends Component {
  private config: MeteorConfig;
  private currentHealth: number;
  private destroyed: boolean = false;

  constructor(config: MeteorConfig, private eventBus: EventBus) {
    super(ComponentType.METEOR);
    this.config = config;
    this.currentHealth = config.health;
  }

  public override update(deltaTime: number): void {
    if (this.destroyed) return;

    // Update position based on velocity
    const transform = this.entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (transform) {
      transform.translate({
        x: this.config.velocity.x * deltaTime,
        y: this.config.velocity.y * deltaTime
      });
      transform.rotate(this.config.rotationSpeed * deltaTime);
      this.wrapAroundScreen(transform);
    }
  }

  private wrapAroundScreen(transform: TransformComponent): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const { width, height } = canvas;
    const margin = 50; // Allow slight overflow before wrapping

    if (transform.position.x < -margin) {
      transform.position.x = width + margin;
    } else if (transform.position.x > width + margin) {
      transform.position.x = -margin;
    }

    if (transform.position.y < -margin) {
      transform.position.y = height + margin;
    } else if (transform.position.y > height + margin) {
      transform.position.y = -margin;
    }
  }

  public takeDamage(amount: number): void {
    if (this.destroyed) return;

    this.currentHealth -= amount;
    
    this.eventBus.emit({
      type: 'METEOR_DAMAGED',
      payload: {
        entityId: this.entity.id,
        damage: amount,
        currentHealth: this.currentHealth,
        size: this.config.size
      }
    });

    if (this.currentHealth <= 0) {
      this.destroy();
    }
  }

  private destroy(): void {
    this.destroyed = true;
    
    const transform = this.entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    
    this.eventBus.emit({
      type: 'METEOR_DESTROYED',
      payload: {
        entityId: this.entity.id,
        size: this.config.size,
        position: transform?.position,
        scoreValue: this.config.scoreValue
      }
    });

    // If not small, spawn smaller meteors
    if (this.config.size !== 'small') {
      this.spawnSmallerMeteors();
    }

    // Schedule entity removal
    setTimeout(() => {
      this.entity.cleanup();
    }, 0);
  }

  private spawnSmallerMeteors(): void {
    const transform = this.entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (!transform) return;

    const nextSize = this.config.size === 'large' ? 'medium' : 'small';
    const spawnCount = 2;

    this.eventBus.emit({
      type: 'SPAWN_METEORS',
      payload: {
        position: transform.position,
        size: nextSize,
        count: spawnCount
      }
    });
  }

  public getDamage(): number {
    return this.config.damage;
  }

  public getSize(): string {
    return this.config.size;
  }

  public getHealth(): number {
    return this.currentHealth;
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }
}
