import { System, SystemType } from '../types/SystemTypes';
import { Entity } from '../core/Entity';
import { TransformComponent, Vector2D } from '../core/components/TransformComponent';
import { ComponentType } from '../core/Component';
import { PhysicsSystemConfig } from '../types/SystemInterfaces';
import { PhysicsBody, CollisionResult, QuadTreeItem } from '../types/PhysicsTypes';
import { Rect } from '../types/CommonTypes';

export class PhysicsSystem implements System {
  public readonly priority = 1;
  public readonly dependencies: SystemType[] = [];
  
  private bodies: Map<string, PhysicsBody> = new Map();
  private gravity: Vector2D = { x: 0, y: 0 };
  private quadtree: QuadTree;
  private bounds: Rect;
  
  constructor(config: PhysicsSystemConfig) {
    this.bounds = {
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height
    };
    this.quadtree = new QuadTree(this.bounds, 4, 5); // max objects: 4, max levels: 5
  }

  public async initialize(): Promise<void> {
    // Initialization logic
  }

  public update(deltaTime: number): void {
    this.updatePhysics(deltaTime);
    this.detectCollisions();
  }

  public cleanup(): void {
    this.bodies.clear();
    this.quadtree.clear();
  }

  private updatePhysics(deltaTime: number): void {
    // Update physics for each body
    this.bodies.forEach((body, entityId) => {
      // Apply forces
      body.velocity.x += (body.force.x / body.mass + this.gravity.x) * deltaTime;
      body.velocity.y += (body.force.y / body.mass + this.gravity.y) * deltaTime;
      
      // Apply angular velocity
      body.angularVelocity += (body.torque / body.mass) * deltaTime;
      
      // Reset forces for next frame
      body.force = { x: 0, y: 0 };
      body.torque = 0;
      
      // Update position and rotation
      const entity = this.getEntity(entityId);
      if (entity) {
        const transform = entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
        if (transform) {
          transform.translate({
            x: body.velocity.x * deltaTime,
            y: body.velocity.y * deltaTime
          });
          transform.rotate(body.angularVelocity * deltaTime);
        }
      }
    });
  }

  private detectCollisions(): void {
    // Clear and rebuild quadtree
    this.quadtree.clear();
    this.bodies.forEach((_, entityId) => {
      const entity = this.getEntity(entityId);
      if (entity) {
        const transform = entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
        if (transform) {
          this.quadtree.insert({
            entity,
            bounds: this.getBoundingBox(transform)
          });
        }
      }
    });

    // Check for collisions
    const checked = new Set<string>();
    this.bodies.forEach((_, entityId) => {
      const entity = this.getEntity(entityId);
      if (entity) {
        const transform = entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
        if (transform) {
          const nearby = this.quadtree.retrieve({
            entity,
            bounds: this.getBoundingBox(transform)
          });

          nearby.forEach(other => {
            const pairId = this.getCollisionPairId(entity, other.entity);
            if (!checked.has(pairId)) {
              checked.add(pairId);
              const result = this.checkCollision(entity, other.entity);
              if (result) {
                this.resolveCollision(result);
              }
            }
          });
        }
      }
    });
  }

  private getCollisionPairId(entityA: Entity, entityB: Entity): string {
    return [entityA.id, entityB.id].sort().join(':');
  }

  private getBoundingBox(transform: TransformComponent): Rect {
    // Simple AABB implementation - can be improved for different shapes
    const size = 50; // Default size, should be based on entity type
    return {
      x: transform.position.x - size/2,
      y: transform.position.y - size/2,
      width: size,
      height: size
    };
  }

  private checkCollision(entityA: Entity, entityB: Entity): CollisionResult | null {
    // Simple circle collision detection - can be improved for different shapes
    const transformA = entityA.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    const transformB = entityB.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    
    if (!transformA || !transformB) return null;

    const dx = transformB.position.x - transformA.position.x;
    const dy = transformB.position.y - transformA.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = 50; // Should be based on entity sizes

    if (distance < minDistance) {
      const normal = {
        x: dx / distance,
        y: dy / distance
      };
      return {
        entityA,
        entityB,
        point: {
          x: transformA.position.x + normal.x * minDistance / 2,
          y: transformA.position.y + normal.y * minDistance / 2
        },
        normal,
        depth: minDistance - distance
      };
    }

    return null;
  }

  private resolveCollision(result: CollisionResult): void {
    const bodyA = this.bodies.get(result.entityA.id);
    const bodyB = this.bodies.get(result.entityB.id);
    
    if (!bodyA || !bodyB) return;

    // Calculate relative velocity
    const rv = {
      x: bodyB.velocity.x - bodyA.velocity.x,
      y: bodyB.velocity.y - bodyA.velocity.y
    };

    // Calculate relative velocity in terms of the normal direction
    const velAlongNormal = rv.x * result.normal.x + rv.y * result.normal.y;

    // Do not resolve if objects are separating
    if (velAlongNormal > 0) return;

    // Calculate restitution (bounce)
    const e = Math.min(bodyA.restitution, bodyB.restitution);

    // Calculate impulse scalar
    let j = -(1 + e) * velAlongNormal;
    j /= 1/bodyA.mass + 1/bodyB.mass;

    // Apply impulse
    const impulse = {
      x: j * result.normal.x,
      y: j * result.normal.y
    };

    bodyA.velocity.x -= impulse.x / bodyA.mass;
    bodyA.velocity.y -= impulse.y / bodyA.mass;
    bodyB.velocity.x += impulse.x / bodyB.mass;
    bodyB.velocity.y += impulse.y / bodyB.mass;

    // Positional correction to prevent sinking
    const percent = 0.2; // penetration percentage to correct
    const slop = 0.01; // penetration allowance
    const correction = Math.max(result.depth - slop, 0) / (1/bodyA.mass + 1/bodyB.mass) * percent;
    
    const correctionVector = {
      x: result.normal.x * correction,
      y: result.normal.y * correction
    };

    const transformA = result.entityA.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    const transformB = result.entityB.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    
    if (transformA && transformB) {
      transformA.translate({
        x: -correctionVector.x / bodyA.mass,
        y: -correctionVector.y / bodyA.mass
      });
      transformB.translate({
        x: correctionVector.x / bodyB.mass,
        y: correctionVector.y / bodyB.mass
      });
    }
  }

  // Public methods for managing physics bodies
  public addBody(entity: Entity, body: PhysicsBody): void {
    this.bodies.set(entity.id, body);
  }

  public removeBody(entity: Entity): void {
    this.bodies.delete(entity.id);
  }

  public getBody(entity: Entity): PhysicsBody | undefined {
    return this.bodies.get(entity.id);
  }

  public setGravity(gravity: Vector2D): void {
    this.gravity = gravity;
  }

  public applyForce(entity: Entity, force: Vector2D): void {
    const body = this.bodies.get(entity.id);
    if (body) {
      body.force.x += force.x;
      body.force.y += force.y;
    }
  }

  public hasBody(entity: Entity): boolean {
    return this.bodies.has(entity.id);
  }

  private getEntity(entityId: string): Entity | undefined {
    // In a real implementation, this would get the entity from EntityManager
    console.log(`Getting entity with ID: ${entityId}`);
    return undefined;
  }
}

class QuadTree {
  private objects: QuadTreeItem[] = [];
  private nodes: QuadTree[] = [];
  private level: number = 0;
  private maxObjects: number;
  private maxLevels: number;
  private bounds: Rect;

  constructor(bounds: Rect, maxObjects: number, maxLevels: number) {
    this.bounds = bounds;
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
  }

  public clear(): void {
    this.objects = [];
    this.nodes.forEach(node => node.clear());
    this.nodes = [];
  }

  public insert(item: QuadTreeItem): void {
    if (this.nodes.length > 0) {
      const index = this.getIndex(item.bounds);
      if (index !== -1) {
        this.nodes[index].insert(item);
        return;
      }
    }

    this.objects.push(item);

    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }

      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i].bounds);
        if (index !== -1) {
          const removed = this.objects.splice(i, 1)[0];
          this.nodes[index].insert(removed);
        } else {
          i++;
        }
      }
    }
  }

  public retrieve(item: QuadTreeItem): QuadTreeItem[] {
    const index = this.getIndex(item.bounds);
    let returnObjects = this.objects;

    if (this.nodes.length > 0) {
      if (index !== -1) {
        returnObjects = returnObjects.concat(this.nodes[index].retrieve(item));
      } else {
        // Item overlaps multiple quadrants
        for (const node of this.nodes) {
          returnObjects = returnObjects.concat(node.retrieve(item));
        }
      }
    }

    return returnObjects.filter(obj => obj.entity.id !== item.entity.id);
  }

  private split(): void {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.nodes = [
      new QuadTree(
        { x: x + subWidth, y: y, width: subWidth, height: subHeight },
        this.maxObjects,
        this.maxLevels
      ),
      new QuadTree(
        { x: x, y: y, width: subWidth, height: subHeight },
        this.maxObjects,
        this.maxLevels
      ),
      new QuadTree(
        { x: x, y: y + subHeight, width: subWidth, height: subHeight },
        this.maxObjects,
        this.maxLevels
      ),
      new QuadTree(
        { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight },
        this.maxObjects,
        this.maxLevels
      )
    ];
  }

  private getIndex(bounds: Rect): number {
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

    const topQuadrant = bounds.y < horizontalMidpoint && 
                       bounds.y + bounds.height < horizontalMidpoint;
    const bottomQuadrant = bounds.y > horizontalMidpoint;

    if (bounds.x < verticalMidpoint && bounds.x + bounds.width < verticalMidpoint) {
      if (topQuadrant) return 1;
      if (bottomQuadrant) return 2;
    } else if (bounds.x > verticalMidpoint) {
      if (topQuadrant) return 0;
      if (bottomQuadrant) return 3;
    }

    return -1;
  }
}
