import { Entity } from './Entity';

export enum ComponentType {
  TRANSFORM = 'TRANSFORM',
  RENDER = 'RENDER',
  PHYSICS = 'PHYSICS',
  COLLISION = 'COLLISION',
  INPUT = 'INPUT',
  AUDIO = 'AUDIO',
  PARTICLE = 'PARTICLE',
  AI = 'AI',
  WEAPON = 'WEAPON',
  HEALTH = 'HEALTH',
  POWERUP = 'POWERUP',
  METEOR = 'METEOR'
}

export abstract class Component {
  private _entity: Entity | null = null;
  
  constructor(public readonly type: ComponentType) {}
  
  public get entity(): Entity {
    if (!this._entity) {
      throw new Error('Component not attached to an entity');
    }
    return this._entity;
  }
  
  public set entity(value: Entity) {
    if (this._entity && this._entity !== value) {
      throw new Error('Component already attached to a different entity');
    }
    this._entity = value;
  }

  // Lifecycle methods that can be overridden by specific components
  public initialize(): void {}
  
  public update(_deltaTime: number): void {}
  
  public cleanup(): void {
    this._entity = null;
  }
}
