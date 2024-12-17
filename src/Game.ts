import { SystemManager } from './core/SystemManager';
import { EventBus } from './core/EventBus';
import { DataStore, createInitialState } from './core/DataStore';
import { SystemType, System } from './types/SystemTypes';
import { GameLoop } from './core/GameLoop';
import { EntityManager } from './core/EntityManager';
import { ResourceManager } from './core/ResourceManager';
import { ComponentType } from './core/Component';
import { RenderComponent } from './core/components/RenderComponent';
import { Scene } from './core/Scene';
import { ShopSystem } from './systems/ShopSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { RenderSystem } from './systems/RenderSystem';
import { AudioSystem } from './systems/AudioSystem';
import { InputSystem } from './systems/InputSystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { MovementSystem } from './systems/MovementSystem';
import { SpriteSystem } from './systems/SpriteSystem';
import { HUDSystem } from './systems/HUDSystem';
import { MusicManager } from './systems/MusicManager';
import {
  PhysicsSystemConfig,
  RenderSystemConfig,
  AudioSystemConfig,
  InputSystemConfig,
  ParticleSystemConfig,
  CollisionSystemConfig,
  MovementSystemConfig,
  SpriteSystemConfig,
  HUDSystemConfig,
  MusicSystemConfig
} from './types/SystemInterfaces';

export class Game {
  private readonly systemManager: SystemManager;
  private readonly eventBus: EventBus;
  private readonly dataStore: DataStore;
  private readonly entityManager: EntityManager;
  private readonly resourceManager: ResourceManager;
  private readonly gameLoop: GameLoop;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private debug: boolean = true;
  private currentScene: Scene | null = null;

  constructor() {
    // Initialize core systems
    this.eventBus = new EventBus();
    this.dataStore = new DataStore(createInitialState(), this.eventBus);
    this.systemManager = new SystemManager();
    this.entityManager = new EntityManager();
    this.resourceManager = new ResourceManager();
    
    // Initialize canvas
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Initialize game loop with update and render functions
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this)
    );

    // Subscribe to state changes
    this.dataStore.subscribe(this.onStateChange.bind(this));
  }

  private onStateChange(): void {
    const state = this.dataStore.getState();
    // Handle state changes
    if (state.level.status === 'paused') {
      this.gameLoop.stop();
    } else if (state.level.status === 'playing') {
      this.gameLoop.start();
    }
  }

  private registerSystems(): void {
    try {
      // Register systems that need EventBus and DataStore
      this.systemManager.registerSystem(
        SystemType.SHOP, 
        new ShopSystem(this.eventBus, this.dataStore)
      );

      type SystemConfig = 
        | PhysicsSystemConfig 
        | RenderSystemConfig 
        | AudioSystemConfig 
        | InputSystemConfig 
        | ParticleSystemConfig 
        | CollisionSystemConfig 
        | MovementSystemConfig 
        | SpriteSystemConfig 
        | HUDSystemConfig;

      // Define system configurations
      const systemConfigs = new Map<SystemType, SystemConfig>([
        [SystemType.INPUT, {
          eventBus: this.eventBus
        } as InputSystemConfig],
        [SystemType.PHYSICS, {
          x: 0,
          y: 0,
          width: this.canvas.width,
          height: this.canvas.height
        } as PhysicsSystemConfig],
        [SystemType.COLLISION, {
          x: 0,
          y: 0,
          width: this.canvas.width,
          height: this.canvas.height,
          eventBus: this.eventBus
        } as CollisionSystemConfig],
        [SystemType.AUDIO, {
          resourceManager: this.resourceManager,
          eventBus: this.eventBus
        } as AudioSystemConfig],
        [SystemType.MOVEMENT, {
          minX: 0,
          maxX: this.canvas.width,
          minY: 0,
          maxY: this.canvas.height,
          maxSpeed: 300,
          maxAcceleration: 500,
          eventBus: this.eventBus
        } as MovementSystemConfig],
        [SystemType.RENDER, {
          canvas: this.canvas,
          eventBus: this.eventBus
        } as RenderSystemConfig],
        [SystemType.SPRITE, {
          resourceManager: this.resourceManager
        } as SpriteSystemConfig],
        [SystemType.PARTICLE, {
          canvas: this.canvas
        } as ParticleSystemConfig],
        [SystemType.HUD, {
          canvas: this.canvas,
          eventBus: this.eventBus
        } as HUDSystemConfig]
      ]);

      // Register systems in dependency order
      const registerOrder = [
        SystemType.INPUT,    // No dependencies
        SystemType.PHYSICS,  // No dependencies
        SystemType.MOVEMENT, // Depends on physics
        SystemType.COLLISION,// Depends on physics and movement
        SystemType.AUDIO,    // No dependencies
        SystemType.RENDER,   // Depends on physics, collision
        SystemType.SPRITE,   // No dependencies
        SystemType.PARTICLE, // No dependencies
        SystemType.HUD      // No dependencies
      ];

      // Register each system in order
      for (const type of registerOrder) {
        const config = systemConfigs.get(type);
        if (!config) {
          throw new Error(`Missing configuration for system: ${type}`);
        }

        let system: System;
        switch (type) {
          case SystemType.PHYSICS:
            system = new PhysicsSystem(config as PhysicsSystemConfig);
            break;
          case SystemType.RENDER:
            system = new RenderSystem(config as RenderSystemConfig);
            break;
          case SystemType.AUDIO:
            system = new AudioSystem(config as AudioSystemConfig);
            break;
          case SystemType.INPUT:
            system = new InputSystem(config as InputSystemConfig);
            break;
          case SystemType.PARTICLE:
            system = new ParticleSystem(config as ParticleSystemConfig);
            break;
          case SystemType.COLLISION:
            system = new CollisionSystem(config as CollisionSystemConfig);
            break;
          case SystemType.MOVEMENT:
            system = new MovementSystem(config as MovementSystemConfig);
            break;
          case SystemType.SPRITE:
            system = new SpriteSystem(config as SpriteSystemConfig);
            break;
          case SystemType.HUD:
            system = new HUDSystem(config as HUDSystemConfig);
            break;
          default:
            throw new Error(`Unknown system type: ${type}`);
        }
        this.systemManager.registerSystem(type, system);
      }

      // Register music system last since it depends on audio system
      const audioSystem = this.systemManager.getSystem<AudioSystem>(SystemType.AUDIO);
      const musicConfig: MusicSystemConfig = {
        audioSystem,
        eventBus: this.eventBus
      };
      this.systemManager.registerSystem(SystemType.MUSIC, new MusicManager(musicConfig));

    } catch (error) {
      console.error('Failed to register systems:', error);
      throw error;
    }
  }

  public async initialize(): Promise<void> {
    try {
      // Register all systems
      this.registerSystems();
      
      // Initialize core systems
      await this.systemManager.initialize();
      
      // Mark game as initialized in state
      this.dataStore.dispatch({
        type: 'INITIALIZE'
      });

      console.log('Game initialized successfully');
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }

  public start(): void {
    this.gameLoop.start();
  }

  public stop(): void {
    this.gameLoop.stop();
  }

  public cleanup(): void {
    this.stop();
    this.systemManager.cleanup();
    this.eventBus.clear();
    this.entityManager.cleanup();
    this.resourceManager.clear();
  }

  private updateCallbacks: ((deltaTime: number) => void)[] = [];

  private update(deltaTime: number): void {
    try {
      // Update entities
      this.entityManager.update(deltaTime);
      
      // Update systems
      this.systemManager.update(deltaTime);

      // Call update callbacks
      for (const callback of this.updateCallbacks) {
        callback(deltaTime);
      }
    } catch (error) {
      console.error('Error in update loop:', error);
      this.stop();
    }
  }

  public onUpdate(callback: (deltaTime: number) => void): void {
    this.updateCallbacks.push(callback);
  }

  private render(): void {
    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Get all entities with render components
      const renderables = this.entityManager
        .getEntitiesByComponent(ComponentType.RENDER);

      if (this.debug) {
        console.log('Rendering entities:', renderables.size);
      }

      // Sort by layer
      const sortedRenderables = Array.from(renderables).sort((a, b) => {
        const renderA = a.getComponent<RenderComponent>(ComponentType.RENDER);
        const renderB = b.getComponent<RenderComponent>(ComponentType.RENDER);
        return (renderA?.getLayer() || 0) - (renderB?.getLayer() || 0);
      });

      // Render each entity
      for (const entity of sortedRenderables) {
        const renderComponent = entity.getComponent<RenderComponent>(ComponentType.RENDER);
        if (renderComponent) {
          if (this.debug) {
            console.log('Rendering entity:', entity.id);
          }
          renderComponent.render(this.ctx);
        }
      }

      // Draw debug info
      if (this.debug) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`Entities: ${this.entityManager.getEntitiesByComponent(ComponentType.RENDER).size}`, 10, 20);
        this.ctx.fillText(`FPS: ${Math.round(1000 / this.gameLoop.getFrameTime())}`, 10, 40);
      }
    } catch (error) {
      console.error('Error in render loop:', error);
      this.stop();
    }
  }

  // Helper methods for systems access
  public getSystemManager(): SystemManager {
    return this.systemManager;
  }

  public getSystem<T extends System>(type: SystemType): T {
    return this.systemManager.getSystem<T>(type);
  }

  public async loadScene(scene: Scene): Promise<void> {
    // Cleanup current scene if exists
    if (this.currentScene) {
      this.currentScene.cleanup();
    }

    // Initialize new scene
    this.currentScene = scene;
    await this.currentScene.initialize();

    // Add scene's update to game loop
    this.updateCallbacks = []; // Clear existing callbacks
    this.onUpdate((deltaTime) => {
      if (this.currentScene) {
        this.currentScene.update(deltaTime);
      }
    });
  }

  public getEventBus(): EventBus {
    return this.eventBus;
  }

  public getDataStore(): DataStore {
    return this.dataStore;
  }

  public getEntityManager(): EntityManager {
    return this.entityManager;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  public getFPS(): number {
    return Math.round(1000 / this.gameLoop.getFrameTime());
  }
}
