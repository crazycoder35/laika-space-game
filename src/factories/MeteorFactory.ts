import { EntityManager } from '../core/EntityManager';
import { EventBus } from '../core/EventBus';
import { Entity } from '../core/Entity';
import { Vector2D } from '../types/CommonTypes';
import { TransformComponent } from '../components/TransformComponent';
import { RenderComponent } from '../components/RenderComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { HealthComponent } from '../components/HealthComponent';
import { CollisionComponent } from '../components/CollisionComponent';

export interface MeteorConfig {
  position: Vector2D;
  velocity?: Vector2D;
  size?: 'small' | 'medium' | 'large';
  rotation?: number;
  rotationSpeed?: number;
}

const METEOR_SIZES = {
  small: {
    width: 32,
    height: 32,
    health: 20,
    mass: 1,
    damage: 10,
    score: 50
  },
  medium: {
    width: 64,
    height: 64,
    health: 40,
    mass: 2,
    damage: 20,
    score: 100
  },
  large: {
    width: 96,
    height: 96,
    health: 80,
    mass: 4,
    damage: 40,
    score: 200
  }
};

export class MeteorFactory {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly eventBus: EventBus
  ) {}

  public createMeteor(config: MeteorConfig): Entity {
    const size = config.size || this.getRandomSize();
    const sizeConfig = METEOR_SIZES[size];
    const meteor = this.entityManager.createEntity();
    meteor.type = 'METEOR';

    // Add transform component
    meteor.addComponent(new TransformComponent({
      position: config.position,
      rotation: config.rotation || Math.random() * Math.PI * 2,
      scale: { x: 1, y: 1 }
    }));

    // Add render component
    meteor.addComponent(new RenderComponent({
      sprite: {
        textureId: `meteor_${size}_${Math.floor(Math.random() * 4)}`,
        width: sizeConfig.width,
        height: sizeConfig.height
      },
      layer: 1
    }));

    // Add physics component
    meteor.addComponent(new PhysicsComponent({
      velocity: config.velocity || { x: 0, y: 0 },
      angularVelocity: config.rotationSpeed || (Math.random() - 0.5) * 2,
      mass: sizeConfig.mass,
      friction: 0
    }));

    // Add health component
    meteor.addComponent(new HealthComponent({
      maxHealth: sizeConfig.health,
      currentHealth: sizeConfig.health
    }));

    // Add collision component
    meteor.addComponent(new CollisionComponent({
      radius: sizeConfig.width / 2,
      damage: sizeConfig.damage,
      scoreValue: sizeConfig.score,
      onCollision: (other: Entity) => {
        if (other.type === 'PROJECTILE') {
          const damage = other.getComponent('WEAPON')?.damage || 0;
          meteor.getComponent('HEALTH')?.takeDamage(damage);
        }
      }
    }));

    return meteor;
  }

  private getRandomSize(): 'small' | 'medium' | 'large' {
    const rand = Math.random();
    if (rand < 0.5) return 'small';
    if (rand < 0.8) return 'medium';
    return 'large';
  }

  public createMeteorField(count: number, bounds: { width: number, height: number }): Entity[] {
    const meteors: Entity[] = [];
    for (let i = 0; i < count; i++) {
      const meteor = this.createMeteor({
        position: {
          x: Math.random() * bounds.width,
          y: -Math.random() * bounds.height * 0.5
        },
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: 1 + Math.random() * 2
        }
      });
      meteors.push(meteor);
    }
    return meteors;
  }
}
