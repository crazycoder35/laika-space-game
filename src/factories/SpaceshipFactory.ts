import { EntityManager } from '../core/EntityManager';
import { EventBus } from '../core/EventBus';
import { Entity } from '../core/Entity';
import { Vector2D } from '../types/CommonTypes';
import { TransformComponent } from '../components/TransformComponent';
import { RenderComponent } from '../components/RenderComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { HealthComponent } from '../components/HealthComponent';
import { InputComponent } from '../components/InputComponent';

export interface SpaceshipConfig {
  position: Vector2D;
  velocity?: Vector2D;
  health?: number;
  damage?: number;
  fireRate?: number;
  speed?: number;
}

export class SpaceshipFactory {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly eventBus: EventBus
  ) {}

  public async createPlayerShip(config: SpaceshipConfig): Promise<Entity> {
    const ship = this.entityManager.createEntity();
    ship.type = 'PLAYER';

    // Add transform component
    ship.addComponent(new TransformComponent({
      position: config.position,
      rotation: 0,
      scale: { x: 1, y: 1 }
    }));

    // Add render component
    ship.addComponent(new RenderComponent({
      sprite: {
        textureId: 'player_ship',
        width: 64,
        height: 64
      },
      layer: 1
    }));

    // Add physics component
    ship.addComponent(new PhysicsComponent({
      velocity: config.velocity || { x: 0, y: 0 },
      maxSpeed: config.speed || 300,
      mass: 1,
      friction: 0.1
    }));

    // Add weapon component
    ship.addComponent(new WeaponComponent({
      damage: config.damage || 10,
      fireRate: config.fireRate || 250,
      projectileSpeed: 500,
      projectileSprite: 'laser_blue'
    }));

    // Add health component
    ship.addComponent(new HealthComponent({
      maxHealth: config.health || 100,
      currentHealth: config.health || 100
    }));

    // Add input component for player control
    ship.addComponent(new InputComponent({
      bindings: {
        'ArrowLeft': 'MOVE_LEFT',
        'ArrowRight': 'MOVE_RIGHT',
        'Space': 'FIRE'
      }
    }));

    return ship;
  }

  public async createEnemyShip(config: SpaceshipConfig): Promise<Entity> {
    const ship = this.entityManager.createEntity();
    ship.type = 'ENEMY';

    // Add transform component
    ship.addComponent(new TransformComponent({
      position: config.position,
      rotation: Math.PI,
      scale: { x: 1, y: 1 }
    }));

    // Add render component
    ship.addComponent(new RenderComponent({
      sprite: {
        textureId: 'enemy_ship',
        width: 48,
        height: 48
      },
      layer: 1
    }));

    // Add physics component
    ship.addComponent(new PhysicsComponent({
      velocity: config.velocity || { x: 0, y: 0 },
      maxSpeed: config.speed || 150,
      mass: 1,
      friction: 0.1
    }));

    // Add weapon component
    ship.addComponent(new WeaponComponent({
      damage: config.damage || 5,
      fireRate: config.fireRate || 1000,
      projectileSpeed: 300,
      projectileSprite: 'laser_red'
    }));

    // Add health component
    ship.addComponent(new HealthComponent({
      maxHealth: config.health || 50,
      currentHealth: config.health || 50
    }));

    return ship;
  }
}
