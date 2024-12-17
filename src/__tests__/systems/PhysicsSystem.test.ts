import { PhysicsSystem } from '../../systems/PhysicsSystem';
import { Entity } from '../../core/Entity';
import { TransformComponent } from '../../core/components/TransformComponent';
import { ComponentType } from '../../core/Component';
import { Vector2D, PhysicsBody, PhysicsConfig } from '../../types';

describe('PhysicsSystem', () => {
  let physicsSystem: PhysicsSystem;
  let testEntity: Entity;
  let entityMap: Map<string, Entity>;

  beforeEach(() => {
    const config: PhysicsConfig = {
      x: 0,
      y: 0,
      width: 800,
      height: 600
    };
    physicsSystem = new PhysicsSystem(config);
    testEntity = new Entity();
    entityMap = new Map();
    
    // Add transform component
    const transform = new TransformComponent();
    transform.setPosition(0, 0);
    transform.rotation = 0;
    transform.setScale({ x: 1, y: 1 });
    testEntity.addComponent(transform);

    // Mock the getEntity method
    (physicsSystem as any).getEntity = (entityId: string) => entityMap.get(entityId);
  });

  it('should apply force correctly', async () => {
    const force: Vector2D = { x: 10, y: 5 };
    const physicsBody: PhysicsBody = {
      mass: 1,
      restitution: 0.8,
      friction: 0.1,
      velocity: { x: 0, y: 0 },
      angularVelocity: 0,
      force: { x: 0, y: 0 },
      torque: 0
    };

    entityMap.set(testEntity.id, testEntity);
    physicsSystem.addBody(testEntity, physicsBody);
    physicsSystem.applyForce(testEntity, force);
    physicsSystem.update(1/60); // one frame

    const body = physicsSystem.getBody(testEntity);
    if (!body) {
      fail('Physics body should exist');
    }
    expect(body.velocity.x).toBeCloseTo(10 * (1/60));
    expect(body.velocity.y).toBeCloseTo(5 * (1/60));
  });

  it('should handle collisions', async () => {
    const entity1 = new Entity();
    const entity2 = new Entity();

    // Set up transforms
    const transform1 = new TransformComponent();
    transform1.setPosition(0, 0);
    entity1.addComponent(transform1);

    const transform2 = new TransformComponent();
    transform2.setPosition(1, 0);
    entity2.addComponent(transform2);

    // Add entities to map
    entityMap.set(entity1.id, entity1);
    entityMap.set(entity2.id, entity2);

    // Add physics bodies
    const physicsBody1: PhysicsBody = {
      mass: 1,
      restitution: 1,
      friction: 0,
      velocity: { x: 1, y: 0 },
      angularVelocity: 0,
      force: { x: 0, y: 0 },
      torque: 0
    };

    const physicsBody2: PhysicsBody = {
      mass: 1,
      restitution: 1,
      friction: 0,
      velocity: { x: -1, y: 0 },
      angularVelocity: 0,
      force: { x: 0, y: 0 },
      torque: 0
    };

    physicsSystem.addBody(entity1, physicsBody1);
    physicsSystem.addBody(entity2, physicsBody2);

    // Update physics
    physicsSystem.update(1/60);

    // Check velocities are reversed
    const body1 = physicsSystem.getBody(entity1);
    const body2 = physicsSystem.getBody(entity2);

    if (!body1 || !body2) {
      fail('Physics bodies should exist');
    }

    expect(body1.velocity.x).toBeCloseTo(-1);
    expect(body2.velocity.x).toBeCloseTo(1);
  });

  it('should apply gravity', async () => {
    physicsSystem.setGravity({ x: 0, y: 9.81 });
    
    const physicsBody: PhysicsBody = {
      mass: 1,
      restitution: 0.8,
      friction: 0.1,
      velocity: { x: 0, y: 0 },
      angularVelocity: 0,
      force: { x: 0, y: 0 },
      torque: 0
    };

    entityMap.set(testEntity.id, testEntity);
    physicsSystem.addBody(testEntity, physicsBody);
    physicsSystem.update(1);
    
    const body = physicsSystem.getBody(testEntity);
    if (!body) {
      fail('Physics body should exist');
    }
    expect(body.velocity.y).toBeCloseTo(9.81);
  });

  it('should handle angular velocity', async () => {
    const physicsBody: PhysicsBody = {
      mass: 1,
      restitution: 0.8,
      friction: 0.1,
      velocity: { x: 0, y: 0 },
      angularVelocity: Math.PI,
      force: { x: 0, y: 0 },
      torque: 0
    };

    entityMap.set(testEntity.id, testEntity);
    physicsSystem.addBody(testEntity, physicsBody);

    const transform = testEntity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (!transform) {
      fail('Transform component should exist');
    }

    const initialRotation = transform.rotation;
    physicsSystem.update(0.5); // Half second
    const finalRotation = transform.rotation;

    expect(finalRotation - initialRotation).toBeCloseTo(Math.PI / 2); // Quarter turn
  });

  it('should remove bodies correctly', async () => {
    const physicsBody: PhysicsBody = {
      mass: 1,
      restitution: 0.8,
      friction: 0.1,
      velocity: { x: 0, y: 0 },
      angularVelocity: 0,
      force: { x: 0, y: 0 },
      torque: 0
    };

    entityMap.set(testEntity.id, testEntity);
    physicsSystem.addBody(testEntity, physicsBody);
    expect(physicsSystem.hasBody(testEntity)).toBe(true);
    
    physicsSystem.removeBody(testEntity);
    expect(physicsSystem.hasBody(testEntity)).toBe(false);
  });
}); 