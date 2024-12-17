import { Scene } from '../core/Scene';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../core/components/TransformComponent';
import { RenderComponent } from '../core/components/RenderComponent';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { Game } from '../Game';
import { SystemType } from '../types/SystemTypes';

export class PhysicsTestScene implements Scene {
  private physicsSystem: PhysicsSystem;
  private movementSystem: MovementSystem;
  private collisionSystem: CollisionSystem;
  private entities: Entity[] = [];

  constructor(private game: Game) {
    // Get systems from game
    this.physicsSystem = game.getSystem<PhysicsSystem>(SystemType.PHYSICS);
    this.movementSystem = game.getSystem<MovementSystem>(SystemType.MOVEMENT);
    this.collisionSystem = game.getSystem<CollisionSystem>(SystemType.COLLISION);

    // Listen for collision events
    game.getEventBus().on('COLLISION', (event) => {
      console.log('Collision detected:', event);
    });
  }

  public async initialize(): Promise<void> {
    // Create test entities
    this.createBall(200, 100, 'red');
    this.createBall(400, 100, 'blue');
    this.createBall(600, 100, 'green');
    this.createBox(300, 400, 'purple');
    this.createBox(500, 400, 'orange');

    // Set up gravity
    this.physicsSystem.setGravity({ x: 0, y: 200 }); // Downward gravity
  }

  private createBall(x: number, y: number, color: string): Entity {
    const entity = new Entity();

    // Add transform component
    const transform = new TransformComponent({ x, y });
    entity.addComponent(transform);

    // Add render component
    const render = new RenderComponent();
    entity.addComponent(render);

    // Create a circle sprite
    const radius = 20;
    const canvas = document.createElement('canvas');
    canvas.width = radius * 2;
    canvas.height = radius * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(radius, radius, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      const image = new Image();
      image.src = canvas.toDataURL();
      render.setSprite({
        image,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: radius * 2,
        sourceHeight: radius * 2
      });
    }

    // Add physics body
    this.physicsSystem.addBody(entity, {
      mass: 1,
      restitution: 0.8,
      friction: 0.1,
      velocity: { x: Math.random() * 200 - 100, y: 0 },
      angularVelocity: 0,
      force: { x: 0, y: 0 },
      torque: 0
    });

    // Add movement constraints
    this.movementSystem.addEntity(entity);

    // Add collision shape
    this.collisionSystem.addCollider(entity, {
      shape: { type: 'circle', radius },
      isTrigger: false,
      layer: 1,
      mask: 1
    });

    // Add to entity manager
    this.game.getEntityManager().addEntity(entity);
    this.entities.push(entity);
    return entity;
  }

  private createBox(x: number, y: number, color: string): Entity {
    const entity = new Entity();

    // Add transform component
    const transform = new TransformComponent({ x, y });
    entity.addComponent(transform);

    // Add render component
    const render = new RenderComponent();
    entity.addComponent(render);

    // Create a box sprite
    const size = 40;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
      const image = new Image();
      image.src = canvas.toDataURL();
      render.setSprite({
        image,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: size,
        sourceHeight: size
      });
    }

    // Add physics body
    this.physicsSystem.addBody(entity, {
      mass: 2,
      restitution: 0.5,
      friction: 0.2,
      velocity: { x: 0, y: 0 },
      angularVelocity: Math.PI / 2, // Rotation
      force: { x: 0, y: 0 },
      torque: 0
    });

    // Add movement constraints
    this.movementSystem.addEntity(entity);

    // Add collision shape
    this.collisionSystem.addCollider(entity, {
      shape: { type: 'rectangle', width: size, height: size },
      isTrigger: false,
      layer: 1,
      mask: 1
    });

    // Add to entity manager
    this.game.getEntityManager().addEntity(entity);
    this.entities.push(entity);
    return entity;
  }

  public update(_deltaTime: number): void {
    // Update is handled by game systems
  }

  public cleanup(): void {
    // Remove entities
    this.entities.forEach(entity => {
      this.game.getEntityManager().removeEntity(entity.id);
      entity.cleanup();
    });
    this.entities = [];
  }
}
