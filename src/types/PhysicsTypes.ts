import { Vector2D, Rect } from './CommonTypes';
import { Entity } from '../core/Entity';

export interface PhysicsConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhysicsBody {
  mass: number;
  restitution: number;
  friction: number;
  velocity: Vector2D;
  angularVelocity: number;
  force: Vector2D;
  torque: number;
}

export interface CollisionResult {
  entityA: Entity;
  entityB: Entity;
  point: Vector2D;
  normal: Vector2D;
  depth: number;
}

export interface QuadTreeItem {
  entity: Entity;
  bounds: Rect;
} 