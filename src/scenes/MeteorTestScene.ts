import { Game } from '../Game';
import { MeteorFactory } from '../factories/MeteorFactory';
import { SpaceshipFactory } from '../factories/SpaceshipFactory';

export class MeteorTestScene {
  private meteorFactory: MeteorFactory;
  private spaceshipFactory: SpaceshipFactory;
  private playerShipId: string | null = null;
  private waveCount: number = 0;
  private meteorsDestroyed: number = 0;
  private score: number = 0;

  constructor(private game: Game) {
    this.meteorFactory = new MeteorFactory(
      game.getEntityManager(),
      game.getEventBus(),
      game.getResourceManager()
    );
    this.spaceshipFactory = new SpaceshipFactory(
      game.getEntityManager(),
      game.getEventBus()
    );

    // Subscribe to meteor events
    this.setupEventHandlers();
  }

  public async initialize(): Promise<void> {
    // Load spaceship sprite
    const spriteImage = await this.game.getResourceManager().loadImage(
      'playerShip',
      '/assets/test-sprite.svg'
    );

    // Create player spaceship
    const playerShip = this.spaceshipFactory.createSpaceship({
      position: {
        x: this.game.getCanvas().width / 2,
        y: this.game.getCanvas().height / 2
      },
      sprite: {
        image: spriteImage,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: 50,
        sourceHeight: 50
      },
      weapon: {
        damage: 25,
        fireRate: 2,
        projectileSpeed: 500
      },
      health: {
        maxHealth: 100,
        initialShield: 50
      },
      input: {
        moveSpeed: 300,
        rotationSpeed: Math.PI,
        acceleration: 500,
        deceleration: 300,
        maxSpeed: 400
      }
    });

    this.playerShipId = playerShip.id;

    // Start spawning waves
    this.startWaveSpawner();
  }

  private setupEventHandlers(): void {
    const eventBus = this.game.getEventBus();

    // Handle meteor destruction
    eventBus.on('METEOR_DESTROYED', (event) => {
      this.meteorsDestroyed++;
      this.score += event.payload.scoreValue;

      console.log(`Meteor destroyed! Score: ${this.score}`);
    });

    // Handle wave completion
    eventBus.on('WAVE_SPAWNED', (event) => {
      this.waveCount++;
      console.log(`Wave ${this.waveCount} started with ${event.payload.count} meteors`);
    });

    // Handle player damage
    eventBus.on('DAMAGE_TAKEN', (event) => {
      if (event.payload.entityId === this.playerShipId) {
        console.log(`Player took ${event.payload.damage} damage! Health: ${event.payload.currentHealth}`);
      }
    });

    // Handle player destruction
    eventBus.on('ENTITY_DESTROYED', (event) => {
      if (event.payload.entityId === this.playerShipId) {
        console.log('Game Over!');
        console.log(`Final Score: ${this.score}`);
        console.log(`Meteors Destroyed: ${this.meteorsDestroyed}`);
        console.log(`Waves Survived: ${this.waveCount}`);
      }
    });
  }

  private startWaveSpawner(): void {
    const spawnWave = () => {
      const baseCount = 3;
      const additionalPerWave = 1;
      const count = baseCount + (this.waveCount * additionalPerWave);

      this.meteorFactory.spawnWave(
        count,
        this.game.getCanvas().width,
        this.game.getCanvas().height
      );
    };

    // Spawn first wave immediately
    spawnWave();

    // Set up wave timer
    const WAVE_INTERVAL = 30000; // 30 seconds between waves
    setInterval(spawnWave, WAVE_INTERVAL);
  }

  public getScore(): number {
    return this.score;
  }

  public getWaveCount(): number {
    return this.waveCount;
  }

  public getMeteorsDestroyed(): number {
    return this.meteorsDestroyed;
  }
}
