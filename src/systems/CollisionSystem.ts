import { System, SystemType } from '../types/SystemTypes';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../core/components/TransformComponent';
import { ComponentType } from '../core/Component';
import { EventBus } from '../core/EventBus';
import { CollisionSystemConfig } from '../types/SystemInterfaces';

export interface CollisionShape {
  type: 'circle' | 'rectangle';
  radius?: number;
  width?: number;
  height?: number;
}

export interface CollisionData {
  shape: CollisionShape;
  isTrigger: boolean;
  layer: number;
  mask: number;
}

export class CollisionSystem implements System {
  public readonly priority = 3; // After movement
  public readonly dependencies = [SystemType.PHYSICS, SystemType.MOVEMENT];
  
  private colliders: Map<string, CollisionData> = new Map();
  private quadtree: QuadTree;
  private readonly eventBus: EventBus;
  private readonly bounds: Rect;

  constructor(config: CollisionSystemConfig) {
    this.eventBus = config.eventBus;
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

  public update(_deltaTime: number): void {
    this.updateQuadtree();
    this.checkCollisions();
  }

  public cleanup(): void {
    this.colliders.clear();
    this.quadtree.clear();
  }

  private updateQuadtree(): void {
    this.quadtree.clear();
    
    this.colliders.forEach((data, entityId) => {
      const entity = this.getEntity(entityId);
      if (entity) {
        const transform = entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
        if (transform) {
          const bounds = this.getColliderBounds(transform, data.shape);
          this.quadtree.insert({ entity, bounds });
        }
      }
    });
  }

  private checkCollisions(): void {
    const checkedPairs = new Set<string>();

    this.colliders.forEach((dataA, entityIdA) => {
      const entityA = this.getEntity(entityIdA);
      if (!entityA) return;

      const transformA = entityA.getComponent<TransformComponent>(ComponentType.TRANSFORM);
      if (!transformA) return;

      const boundsA = this.getColliderBounds(transformA, dataA.shape);
      const nearby = this.quadtree.retrieve({ entity: entityA, bounds: boundsA });

      nearby.forEach(({ entity: entityB }) => {
        const dataB = this.colliders.get(entityB.id);
        if (!dataB) return;

        // Skip if already checked or layers don't match
        const pairId = this.getCollisionPairId(entityA, entityB);
        if (checkedPairs.has(pairId)) return;
        if (!this.shouldCollide(dataA, dataB)) return;

        checkedPairs.add(pairId);

        const transformB = entityB.getComponent<TransformComponent>(ComponentType.TRANSFORM);
        if (!transformB) return;

        if (this.testCollision(transformA, dataA.shape, transformB, dataB.shape)) {
          this.handleCollision(entityA, dataA, entityB, dataB);
        }
      });
    });
  }

  private shouldCollide(dataA: CollisionData, dataB: CollisionData): boolean {
    return (dataA.layer & dataB.mask) !== 0 && (dataB.layer & dataA.mask) !== 0;
  }

  private testCollision(
    transformA: TransformComponent,
    shapeA: CollisionShape,
    transformB: TransformComponent,
    shapeB: CollisionShape
  ): boolean {
    if (shapeA.type === 'circle' && shapeB.type === 'circle') {
      return this.testCircleCollision(
        transformA.position,
        shapeA.radius!,
        transformB.position,
        shapeB.radius!
      );
    }
    
    if (shapeA.type === 'rectangle' && shapeB.type === 'rectangle') {
      return this.testRectangleCollision(
        transformA,
        shapeA,
        transformB,
        shapeB
      );
    }

    // Circle-Rectangle collision
    if (shapeA.type === 'circle' && shapeB.type === 'rectangle') {
      return this.testCircleRectangleCollision(
        transformA.position,
        shapeA.radius!,
        transformB,
        shapeB
      );
    }

    if (shapeA.type === 'rectangle' && shapeB.type === 'circle') {
      return this.testCircleRectangleCollision(
        transformB.position,
        shapeB.radius!,
        transformA,
        shapeA
      );
    }

    return false;
  }

  private testCircleCollision(
    posA: { x: number; y: number },
    radiusA: number,
    posB: { x: number; y: number },
    radiusB: number
  ): boolean {
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radiusA + radiusB;
  }

  private testRectangleCollision(
    transformA: TransformComponent,
    shapeA: CollisionShape,
    transformB: TransformComponent,
    shapeB: CollisionShape
  ): boolean {
    // Simple AABB collision test - can be improved with rotation
    const halfWidthA = shapeA.width! / 2;
    const halfHeightA = shapeA.height! / 2;
    const halfWidthB = shapeB.width! / 2;
    const halfHeightB = shapeB.height! / 2;

    return Math.abs(transformA.position.x - transformB.position.x) < halfWidthA + halfWidthB &&
           Math.abs(transformA.position.y - transformB.position.y) < halfHeightA + halfHeightB;
  }

  private testCircleRectangleCollision(
    circlePos: { x: number; y: number },
    radius: number,
    rectTransform: TransformComponent,
    rectShape: CollisionShape
  ): boolean {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(
      rectTransform.position.x - rectShape.width! / 2,
      Math.min(circlePos.x, rectTransform.position.x + rectShape.width! / 2)
    );
    const closestY = Math.max(
      rectTransform.position.y - rectShape.height! / 2,
      Math.min(circlePos.y, rectTransform.position.y + rectShape.height! / 2)
    );

    // Calculate the distance between the circle's center and the closest point
    const dx = closestX - circlePos.x;
    const dy = closestY - circlePos.y;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared < radius * radius;
  }

  private handleCollision(
    entityA: Entity,
    dataA: CollisionData,
    entityB: Entity,
    dataB: CollisionData
  ): void {
    // Emit collision event
    this.eventBus.emit({
      type: 'COLLISION',
      payload: {
        entityA: entityA.id,
        entityB: entityB.id,
        isTriggerA: dataA.isTrigger,
        isTriggerB: dataB.isTrigger
      }
    });

    // Handle trigger collisions differently from physical collisions
    if (dataA.isTrigger || dataB.isTrigger) {
      this.handleTriggerCollision(entityA, entityB);
    } else {
      this.handlePhysicalCollision(entityA, entityB);
    }
  }

  private handleTriggerCollision(entityA: Entity, entityB: Entity): void {
    // Trigger collisions don't affect physics, just emit events
    this.eventBus.emit({
      type: 'TRIGGER_ENTER',
      payload: {
        entityA: entityA.id,
        entityB: entityB.id
      }
    });
  }

  private handlePhysicalCollision(entityA: Entity, entityB: Entity): void {
    // Physical collisions should be handled by the physics system
    this.eventBus.emit({
      type: 'PHYSICAL_COLLISION',
      payload: {
        entityA: entityA.id,
        entityB: entityB.id
      }
    });
  }

  // Public methods for managing colliders
  public addCollider(
    entity: Entity,
    data: CollisionData
  ): void {
    this.colliders.set(entity.id, data);
  }

  public removeCollider(entity: Entity): void {
    this.colliders.delete(entity.id);
  }

  public updateCollider(
    entity: Entity,
    data: Partial<CollisionData>
  ): void {
    const current = this.colliders.get(entity.id);
    if (current) {
      this.colliders.set(entity.id, { ...current, ...data });
    }
  }

  private getColliderBounds(
    transform: TransformComponent,
    shape: CollisionShape
  ): Rect {
    if (shape.type === 'circle') {
      return {
        x: transform.position.x - shape.radius!,
        y: transform.position.y - shape.radius!,
        width: shape.radius! * 2,
        height: shape.radius! * 2
      };
    } else {
      return {
        x: transform.position.x - shape.width! / 2,
        y: transform.position.y - shape.height! / 2,
        width: shape.width!,
        height: shape.height!
      };
    }
  }

  private getCollisionPairId(entityA: Entity, entityB: Entity): string {
    return [entityA.id, entityB.id].sort().join(':');
  }

  private getEntity(entityId: string): Entity | undefined {
    // In a real implementation, this would get the entity from EntityManager
    console.log(`Getting entity with ID: ${entityId}`);
    return undefined;
  }
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

class QuadTree {
  private objects: Array<{ entity: Entity; bounds: Rect }> = [];
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

  public insert(item: { entity: Entity; bounds: Rect }): void {
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

  public retrieve(item: { entity: Entity; bounds: Rect }): Array<{ entity: Entity; bounds: Rect }> {
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
