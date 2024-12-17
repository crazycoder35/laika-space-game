import { Game } from './Game';
import { TransformComponent } from './core/components/TransformComponent';
import { RenderComponent, Sprite } from './core/components/RenderComponent';
import { ComponentType } from './core/Component';

export class TestScene {
  private game: Game;
  private testSprite?: Sprite;
  private rotatingSquare: string | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  public async initialize(): Promise<void> {
    try {
      console.log('Loading test sprite...');
      // Load test sprite
      const spriteImage = await this.game.getResourceManager().loadImage(
        'testSprite',
        './assets/test-sprite.svg'  // Updated path to be relative to public directory
      );
      console.log('Sprite loaded successfully:', spriteImage);

      // Create sprite configuration
      this.testSprite = {
        image: spriteImage,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: 50,
        sourceHeight: 50
      };

      // Create a rotating square entity
      const entity = this.game.getEntityManager().createEntity();
      console.log('Created entity:', entity.id);
      
      // Add transform component at center of screen
      const transform = new TransformComponent(
        { 
          x: this.game.getCanvas().width / 2,
          y: this.game.getCanvas().height / 2
        }
      );
      entity.addComponent(transform);
      console.log('Added transform component');

      // Add render component with our test sprite
      const render = new RenderComponent();
      render.setSprite(this.testSprite);
      entity.addComponent(render);
      console.log('Added render component');

      // Store entity ID for updates
      this.rotatingSquare = entity.id;

      // Subscribe to frame updates through game loop
      this.game.onUpdate(this.update.bind(this));
      console.log('TestScene initialized successfully');
    } catch (error) {
      console.error('Error initializing TestScene:', error);
      throw error;
    }
  }

  private update(deltaTime: number): void {
    if (!this.rotatingSquare) return;

    // Get the rotating square entity
    const entity = this.game.getEntityManager().getEntity(this.rotatingSquare);
    if (!entity) return;

    // Get transform component
    const transform = entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (!transform) return;

    // Rotate the square
    transform.rotate(deltaTime); // Rotate 1 radian per second

    // Make it move in a circle
    const time = performance.now() / 1000; // Current time in seconds
    const radius = 100; // Radius of the circle
    const centerX = this.game.getCanvas().width / 2;
    const centerY = this.game.getCanvas().height / 2;

    transform.setPosition(
      centerX + Math.cos(time) * radius,
      centerY + Math.sin(time) * radius
    );
  }
}
