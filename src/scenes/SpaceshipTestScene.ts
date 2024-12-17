import { Game } from '../Game';
import { SpaceshipFactory } from '../factories/SpaceshipFactory';
import { InputAction } from '../components/spaceship/InputComponent';
import { PowerupType } from '../components/spaceship/PowerupComponent';
import { ComponentType } from '../core/Component';
import { InputComponent } from '../components/spaceship/InputComponent';
import { PowerupComponent } from '../components/spaceship/PowerupComponent';

export class SpaceshipTestScene {
  private spaceshipFactory: SpaceshipFactory;
  private playerShipId: string | null = null;

  constructor(private game: Game) {
    this.spaceshipFactory = new SpaceshipFactory(
      game.getEntityManager(),
      game.getEventBus()
    );
  }

  public async initialize(): Promise<void> {
    // Load spaceship sprite
    const spriteImage = await this.game.getResourceManager().loadImage(
      'playerShip',
      '/assets/test-sprite.svg' // Using test sprite for now
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
        damage: 10,
        fireRate: 2,
        projectileSpeed: 500
      },
      health: {
        maxHealth: 100,
        initialShield: 50
      },
      input: {
        moveSpeed: 300,
        rotationSpeed: Math.PI, // Radians per second
        acceleration: 500,
        deceleration: 300,
        maxSpeed: 400
      }
    });

    this.playerShipId = playerShip.id;

    // Create test enemy ships
    this.createTestEnemies();

    // Set up input handlers
    this.setupInputHandlers();

    // Subscribe to game events
    this.setupEventHandlers();

    // Add periodic powerup test
    setInterval(() => this.testPowerup(), 5000);
  }

  private setupInputHandlers(): void {
    // Keyboard controls
    window.addEventListener('keydown', (e) => this.handleKeyboard(e, true));
    window.addEventListener('keyup', (e) => this.handleKeyboard(e, false));

    // Mouse controls for aiming and shooting
    window.addEventListener('mousedown', () => this.handleMouseDown());
    window.addEventListener('mouseup', () => this.handleMouseUp());
  }

  private handleKeyboard(event: KeyboardEvent, isDown: boolean): void {
    if (!this.playerShipId) return;

    const ship = this.game.getEntityManager().getEntity(this.playerShipId);
    if (!ship) return;

    const input = ship.getComponent<InputComponent>(ComponentType.INPUT);
    if (!input) return;

    switch (event.code) {
      case 'KeyW':
        input.setAction(InputAction.MOVE_FORWARD, isDown);
        break;
      case 'KeyS':
        input.setAction(InputAction.MOVE_BACKWARD, isDown);
        break;
      case 'KeyA':
        input.setAction(InputAction.TURN_LEFT, isDown);
        break;
      case 'KeyD':
        input.setAction(InputAction.TURN_RIGHT, isDown);
        break;
      case 'Space':
        input.setAction(InputAction.FIRE, isDown);
        break;
    }

    // Prevent scrolling when using spacebar
    if (event.code === 'Space') {
      event.preventDefault();
    }
  }

  private handleMouseDown(): void {
    if (!this.playerShipId) return;

    const ship = this.game.getEntityManager().getEntity(this.playerShipId);
    if (!ship) return;

    const input = ship.getComponent<InputComponent>(ComponentType.INPUT);
    if (!input) return;

    input.setAction(InputAction.FIRE, true);
  }

  private handleMouseUp(): void {
    if (!this.playerShipId) return;

    const ship = this.game.getEntityManager().getEntity(this.playerShipId);
    if (!ship) return;

    const input = ship.getComponent<InputComponent>(ComponentType.INPUT);
    if (!input) return;

    input.setAction(InputAction.FIRE, false);
  }

  private setupEventHandlers(): void {
    // Listen for damage events
    this.game.getEventBus().on('DAMAGE_TAKEN', (event) => {
      console.log(`Entity ${event.payload.entityId} took ${event.payload.damage} damage!`);
    });

    // Listen for powerup events
    this.game.getEventBus().on('POWERUP_APPLIED', (event) => {
      console.log(`Entity ${event.payload.entityId} got powerup: ${event.payload.powerupType}`);
    });
  }

  private createTestEnemies(): void {
    // Create a few enemy ships for testing
    const positions = [
      { x: 200, y: 200 },
      { x: 600, y: 200 },
      { x: 400, y: 400 }
    ];

    positions.forEach(pos => {
      this.spaceshipFactory.createEnemySpaceship(pos);
    });
  }

  private testPowerup(): void {
    if (!this.playerShipId) return;

    const ship = this.game.getEntityManager().getEntity(this.playerShipId);
    if (!ship) return;

    const powerup = ship.getComponent<PowerupComponent>(ComponentType.POWERUP);
    if (!powerup) return;

    // Apply a random powerup
    const powerupTypes = [
      PowerupType.WEAPON_BOOST,
      PowerupType.SHIELD,
      PowerupType.SPEED
    ];

    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    powerup.applyPowerup({
      type: randomType,
      duration: 3000, // 3 seconds
      strength: 0.5
    });
  }
}
