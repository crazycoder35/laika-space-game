import { SystemManager } from './core/SystemManager';
import { EventBus } from './core/EventBus';
import { DataStore } from './core/DataStore';
import { RenderSystem } from './systems/RenderSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { InputSystem } from './systems/InputSystem';
import { AudioSystem } from './systems/AudioSystem';
import { AssetManager } from './core/AssetManager';
import { EntityManager } from './core/EntityManager';
import { GameState } from './types/StateTypes';
import { SpaceshipFactory } from './factories/SpaceshipFactory';
import { MeteorFactory } from './factories/MeteorFactory';
import { Entity } from './core/Entity';
import { Vector2D } from './types/CommonTypes';
import { PowerupComponent } from './components/PowerupComponent';
import { ResourceManager } from './core/ResourceManager';
import { MemoryManager } from './core/MemoryManager';

class LaikaGame {
  private systemManager: SystemManager;
  private eventBus: EventBus;
  private dataStore: DataStore;
  private assetManager: AssetManager;
  private entityManager: EntityManager;
  private spaceshipFactory: SpaceshipFactory;
  private meteorFactory: MeteorFactory;
  private memoryManager: MemoryManager;
  private resourceManager: ResourceManager;

  constructor() {
    // Initialize core systems
    this.eventBus = new EventBus();
    this.resourceManager = new ResourceManager();
    this.memoryManager = new MemoryManager();
    this.dataStore = new DataStore({
      player: {
        health: 100,
        score: 0,
        coins: 0,
        powerups: new Map(),
        upgrades: new Map()
      },
      level: {
        currentLevel: 1,
        meteorSpawnRate: 2000,
        powerupSpawnRate: 15000
      },
      gameState: 'MENU'
    });

    // Initialize managers
    this.assetManager = new AssetManager({
      resourceManager: this.resourceManager,
      eventBus: this.eventBus
    });
    this.entityManager = new EntityManager();

    // Initialize factories
    this.spaceshipFactory = new SpaceshipFactory(this.entityManager, this.eventBus);
    this.meteorFactory = new MeteorFactory(this.entityManager, this.eventBus);

    // Initialize system manager
    this.systemManager = new SystemManager();
    this.initializeSystems();

    // Subscribe to events
    this.setupEventListeners();
  }

  private initializeSystems(): void {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    
    // Initialize all game systems
    this.systemManager.addSystem('render', new RenderSystem({
      canvas,
      eventBus: this.eventBus,
      memoryManager: this.memoryManager
    }));

    this.systemManager.addSystem('physics', new PhysicsSystem({
      gravity: { x: 0, y: 0 }
    }));

    this.systemManager.addSystem('input', new InputSystem({
      eventBus: this.eventBus
    }));

    this.systemManager.addSystem('audio', new AudioSystem({
      eventBus: this.eventBus,
      resourceManager: this.resourceManager
    }));

    // Validate system dependencies
    this.systemManager.validateDependencies();
  }

  private setupEventListeners(): void {
    // Handle game state changes
    this.eventBus.on('GAME_STATE_CHANGED', (event) => {
      switch (event.payload.state) {
        case 'PLAYING':
          this.startGame();
          break;
        case 'PAUSED':
          this.pauseGame();
          break;
        case 'GAME_OVER':
          this.gameOver();
          break;
      }
    });

    // Handle collisions
    this.eventBus.on('COLLISION', (event) => {
      const { entityA, entityB } = event.payload;
      // Handle different collision types
      if (entityA.type === 'PROJECTILE' && entityB.type === 'METEOR') {
        this.handleProjectileHit(entityA, entityB);
      }
      if (entityA.type === 'PLAYER' && entityB.type === 'POWERUP') {
        this.handlePowerupCollected(entityA, entityB);
      }
    });
  }

  private async startGame(): Promise<void> {
    // Create player spaceship
    const playerShip = await this.spaceshipFactory.createPlayerShip({
      position: { x: window.innerWidth / 2, y: window.innerHeight - 100 }
    });

    // Start meteor spawning
    this.startMeteorSpawning();

    // Start game loop
    this.gameLoop();
  }

  private gameLoop(): void {
    const loop = (timestamp: number) => {
      // Update all systems
      this.systemManager.update(timestamp);

      // Request next frame
      if (this.dataStore.getState().gameState === 'PLAYING') {
        requestAnimationFrame(loop);
      }
    };

    requestAnimationFrame(loop);
  }

  private startMeteorSpawning(): void {
    const spawnMeteor = () => {
      if (this.dataStore.getState().gameState !== 'PLAYING') return;

      const x = Math.random() * window.innerWidth;
      this.meteorFactory.createMeteor({
        position: { x, y: -50 },
        velocity: { 
          x: (Math.random() - 0.5) * 2,
          y: 2 + Math.random() * 2
        }
      });

      // Schedule next spawn
      const { meteorSpawnRate } = this.dataStore.getState().level;
      setTimeout(spawnMeteor, meteorSpawnRate);
    };

    spawnMeteor();
  }

  private handleProjectileHit(projectile: Entity, meteor: Entity): void {
    // Update score
    this.dataStore.dispatch({
      type: 'ADD_SCORE',
      payload: { score: 100 }
    });

    // Create explosion effect
    this.createExplosion(meteor.position);

    // Remove entities
    this.entityManager.removeEntity(projectile.id);
    this.entityManager.removeEntity(meteor.id);
  }

  private handlePowerupCollected(player: Entity, powerup: Entity): void {
    // Apply powerup effect
    const powerupComponent = powerup.getComponent('POWERUP') as PowerupComponent;
    powerupComponent.apply(player);

    // Remove powerup entity
    this.entityManager.removeEntity(powerup.id);
  }

  private createExplosion(position: Vector2D): void {
    // Create particle effect
    const particles = 20;
    for (let i = 0; i < particles; i++) {
      const angle = (i / particles) * Math.PI * 2;
      const velocity = {
        x: Math.cos(angle) * 2,
        y: Math.sin(angle) * 2
      };
      
      this.entityManager.createEntity({
        type: 'PARTICLE',
        position,
        velocity,
        lifetime: 1000
      });
    }

    // Play explosion sound
    this.eventBus.emit({
      type: 'PLAY_SOUND',
      payload: { soundId: 'explosion' }
    });
  }

  private pauseGame(): void {
    this.dataStore.dispatch({
      type: 'SET_GAME_STATE',
      payload: { state: 'PAUSED' }
    });
  }

  private gameOver(): void {
    this.dataStore.dispatch({
      type: 'SET_GAME_STATE',
      payload: { state: 'GAME_OVER' }
    });

    // Show game over screen
    this.eventBus.emit({
      type: 'SHOW_SCREEN',
      payload: { screen: 'GAME_OVER' }
    });
  }

  public async initialize(): Promise<void> {
    // Load all game assets
    await this.assetManager.loadManifest('assets/manifest.json');

    // Initialize all systems
    await this.systemManager.initialize();

    // Show main menu
    this.eventBus.emit({
      type: 'SHOW_SCREEN',
      payload: { screen: 'MAIN_MENU' }
    });
  }
}

// Start the game
const game = new LaikaGame();
game.initialize().catch(console.error);
