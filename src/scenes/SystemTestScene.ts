import { BaseScene } from '../core/BaseScene';
import { Game } from '../Game';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../core/components/TransformComponent';
import { RenderComponent, Sprite } from '../core/components/RenderComponent';
import { ComponentType } from '../core/Component';
import { SystemType } from '../types/SystemTypes';
import { GameEvent } from '../types/SystemTypes';
import { InputActionStartEvent, InputEvent } from '../types/InputEvents';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { HUDSystem } from '../systems/HUDSystem';
import { GameAction } from '../systems/InputSystem';

export class SystemTestScene extends BaseScene {
  private testEntity?: Entity;
  private spriteLoaded: boolean = false;

  constructor(game: Game) {
    super(game);
  }

  public async initialize(): Promise<void> {
    try {
      // Test Entity Component System
      this.testEntity = new Entity();
      const transform = new TransformComponent();
      transform.setPosition(400, 300);
      transform.rotation = 0;
      transform.setScale({ x: 1, y: 1 });
      this.testEntity.addComponent(transform);

      // Test Rendering System
      const renderComponent = new RenderComponent();
      this.testEntity.addComponent(renderComponent);
      
      // Test Resource Loading
      await Promise.all([
        this.loadResources(),
        this.setupSystems()
      ]);

      // Set sprite after loading
      if (this.spriteLoaded && this.testEntity) {
        const resource = this.game.getResourceManager().getResource('test-sprite');
        if (resource && resource.type === 'image') {
          const sprite: Sprite = {
            image: resource.data as HTMLImageElement,
            sourceX: 0,
            sourceY: 0,
            sourceWidth: 50,
            sourceHeight: 50
          };
          const render = this.testEntity.getComponent<RenderComponent>(ComponentType.RENDER);
          if (render) {
            render.setSprite(sprite);
          }
        }
      }

      // Add entity to the game
      this.game.getEntityManager().addEntity(this.testEntity);

      // Subscribe to input events
      this.setupInputHandlers();

      // Test UI System
      this.setupUI();

      // Test State Management
      this.setupStateManagement();

      console.log('SystemTestScene initialized successfully');
    } catch (error) {
      console.error('Error initializing SystemTestScene:', error);
    }
  }

  private async loadResources(): Promise<void> {
    try {
      // Load test sprite
      await this.game.getResourceManager().loadImage('test-sprite', 'assets/test-sprite.svg');
      this.spriteLoaded = true;
      console.log('Resources loaded successfully');
    } catch (error) {
      console.error('Failed to load resources:', error);
      this.spriteLoaded = false;
    }
  }

  private setupSystems(): void {
    try {
      const systemManager = this.game.getSystemManager();
      const eventBus = this.game.getEventBus();

      // Test Physics System
      if (this.testEntity) {
        const physicsSystem = systemManager.getSystem<PhysicsSystem>(SystemType.PHYSICS);
        physicsSystem.addBody(this.testEntity, {
          mass: 1,
          restitution: 0.8,
          friction: 0.1,
          velocity: { x: 0, y: 0 },
          angularVelocity: 0,
          force: { x: 0, y: 0 },
          torque: 0
        });
      }

      // Test Movement System
      if (this.testEntity) {
        const movementSystem = systemManager.getSystem<MovementSystem>(SystemType.MOVEMENT);
        movementSystem.addEntity(this.testEntity, {
          minX: 0,
          maxX: this.game.getCanvas().width,
          minY: 0,
          maxY: this.game.getCanvas().height,
          maxSpeed: 300,
          maxAcceleration: 500
        });
      }

      // Test Collision System
      if (this.testEntity) {
        const collisionSystem = systemManager.getSystem<CollisionSystem>(SystemType.COLLISION);
        collisionSystem.addCollider(this.testEntity, {
          shape: {
            type: 'circle',
            radius: 25
          },
          isTrigger: false,
          layer: 1,
          mask: 1
        });
      }

      // Test Particle System
      const particleSystem = systemManager.getSystem<ParticleSystem>(SystemType.PARTICLE);
      particleSystem.createEmitter('test-emitter', {
        position: { x: 400, y: 300 },
        spread: Math.PI / 4,
        rate: 10,
        maxParticles: 100,
        particleConfig: {
          velocity: { x: 0, y: -50 },
          acceleration: { x: 0, y: 50 },
          color: '#ff0000',
          size: 5,
          life: 2,
          alpha: 1,
          fadeRate: 0.5,
          shrinkRate: 1
        }
      });

      // Subscribe to test events
      eventBus.on('COLLISION', (event: GameEvent) => {
        console.log('Collision detected:', event);
      });

      console.log('Systems setup completed');
    } catch (error) {
      console.error('Error setting up systems:', error);
    }
  }

  private setupInputHandlers(): void {
    try {
      const eventBus = this.game.getEventBus();

      eventBus.on('INPUT_ACTION_START', (event: InputEvent) => {
        if (event.type === 'INPUT_ACTION_START' && this.testEntity) {
          const inputEvent = event as InputActionStartEvent;
          const transform = this.testEntity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
          
          if (transform) {
            const action = inputEvent.payload.action as GameAction;
            switch (action) {
              case 'MOVE_RIGHT':
                transform.translate({ x: 10, y: 0 });
                break;
              case 'MOVE_LEFT':
                transform.translate({ x: -10, y: 0 });
                break;
              case 'MOVE_UP':
                transform.translate({ x: 0, y: -10 });
                break;
              case 'MOVE_DOWN':
                transform.translate({ x: 0, y: 10 });
                break;
              case 'FIRE':
                transform.rotate(Math.PI / 8);
                break;
              case 'USE_ITEM':
                transform.rotate(-Math.PI / 8);
                break;
            }
          }
        }
      });

      console.log('Input handlers setup completed');
    } catch (error) {
      console.error('Error setting up input handlers:', error);
    }
  }

  private setupUI(): void {
    try {
      const hudSystem = this.game.getSystemManager().getSystem<HUDSystem>(SystemType.HUD);
      
      // Add test button
      hudSystem.createButton(
        'test-button',
        'Test Button',
        { x: 10, y: 10 },
        { x: 100, y: 30 },
        () => console.log('Button clicked!')
      );

      // Add test health bar
      hudSystem.createHealthBar(
        'test-health',
        { x: 10, y: 50 },
        { x: 100, y: 20 },
        100
      );

      console.log('UI setup completed');
    } catch (error) {
      console.error('Error setting up UI:', error);
    }
  }

  private setupStateManagement(): void {
    try {
      const dataStore = this.game.getDataStore();
      
      // Test state persistence
      dataStore.dispatch({
        type: 'LOAD_GAME',
        payload: {
          state: {
            version: '1.0.0',
            isInitialized: true,
            player: {
              health: 100,
              score: 0,
              coins: 0,
              powerups: new Map(),
              upgrades: new Map()
            },
            level: {
              currentLevel: 1,
              entities: [],
              status: 'playing'
            },
            shop: {
              availableItems: [],
              purchasedItems: [],
              selectedItems: []
            },
            settings: {
              volume: 1,
              difficulty: 'medium',
              controls: {
                keyboard: {},
                mouse: {}
              }
            }
          }
        }
      });

      console.log('State management setup completed');
    } catch (error) {
      console.error('Error setting up state management:', error);
    }
  }

  public update(deltaTime: number): void {
    try {
      // Test entity movement
      if (this.testEntity) {
        const transform = this.testEntity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
        if (transform) {
          transform.rotate(deltaTime * 0.5);
        }
      }
    } catch (error) {
      console.error('Error in update:', error);
    }
  }

  public cleanup(): void {
    try {
      if (this.testEntity) {
        this.game.getEntityManager().removeEntity(this.testEntity.id);
      }

      const particleSystem = this.game.getSystemManager().getSystem<ParticleSystem>(SystemType.PARTICLE);
      particleSystem.removeEmitter('test-emitter');
      
      console.log('SystemTestScene cleaned up successfully');
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
}
