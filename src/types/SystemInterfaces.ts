import { EventBus } from '../core/EventBus';
import { ResourceManager } from '../core/ResourceManager';
import { DataStore } from '../core/DataStore';
import { AudioSystem } from '../systems/AudioSystem';

export interface InputSystemConfig {
  eventBus: EventBus;
}

export interface PhysicsSystemConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MovementSystemConfig {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  maxSpeed: number;
  maxAcceleration: number;
  eventBus: EventBus;
}

export interface CollisionSystemConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  eventBus: EventBus;
}

export interface AudioSystemConfig {
  resourceManager: ResourceManager;
  eventBus: EventBus;
}

export interface RenderSystemConfig {
  canvas: HTMLCanvasElement;
  eventBus: EventBus;
}

export interface SpriteSystemConfig {
  resourceManager: ResourceManager;
}

export interface ParticleSystemConfig {
  canvas: HTMLCanvasElement;
}

export interface HUDSystemConfig {
  canvas: HTMLCanvasElement;
  eventBus: EventBus;
}

export interface MusicSystemConfig {
  audioSystem: AudioSystem;
  eventBus: EventBus;
}

export interface SaveSystemConfig {
  dataStore: DataStore;
  eventBus: EventBus;
}
