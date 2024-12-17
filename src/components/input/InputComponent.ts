import { Component, ComponentType } from '../../core/Component';
import { TransformComponent, Vector2D } from '../../core/components/TransformComponent';
import { WeaponComponent } from '../spaceship/WeaponComponent';
import { GameAction } from '../../systems/InputSystem';
import { EventBus } from '../../core/EventBus';

export interface InputConfig {
  moveSpeed: number;
  rotationSpeed: number;
  acceleration: number;
  deceleration: number;
  maxSpeed: number;
}

export class InputComponent extends Component {
  private currentVelocity: Vector2D;
  private actionStates: Map<GameAction, boolean>;
  private readonly config: InputConfig;

  constructor(
    config: InputConfig,
    private eventBus: EventBus
  ) {
    super(ComponentType.INPUT);
    
    this.config = config;
    this.currentVelocity = { x: 0, y: 0 };
    this.actionStates = new Map();
    this.setupEventListeners();
  }

  public override update(deltaTime: number): void {
    const transform = this.entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (!transform) return;

    // Handle rotation
    if (this.actionStates.get('MOVE_LEFT')) {
      transform.rotate(-this.config.rotationSpeed * deltaTime);
    }
    if (this.actionStates.get('MOVE_RIGHT')) {
      transform.rotate(this.config.rotationSpeed * deltaTime);
    }

    // Handle movement
    const direction: Vector2D = {
      x: Math.cos(transform.rotation),
      y: Math.sin(transform.rotation)
    };

    // Calculate target velocity based on input
    let targetVelocity: Vector2D = { x: 0, y: 0 };
    if (this.actionStates.get('MOVE_UP')) {
      targetVelocity = {
        x: direction.x * this.config.moveSpeed,
        y: direction.y * this.config.moveSpeed
      };
    } else if (this.actionStates.get('MOVE_DOWN')) {
      targetVelocity = {
        x: -direction.x * this.config.moveSpeed * 0.5,
        y: -direction.y * this.config.moveSpeed * 0.5
      };
    }

    // Apply acceleration/deceleration
    this.currentVelocity = this.updateVelocity(
      this.currentVelocity,
      targetVelocity,
      deltaTime
    );

    // Update position
    transform.translate({
      x: this.currentVelocity.x * deltaTime,
      y: this.currentVelocity.y * deltaTime
    });

    // Handle weapon firing
    if (this.actionStates.get('FIRE')) {
      const weapon = this.entity.getComponent<WeaponComponent>(ComponentType.WEAPON);
      if (weapon) {
        weapon.fire();
      }
    }
  }

  public override cleanup(): void {
    this.removeEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on('INPUT_ACTION_START', this.handleActionStart);
    this.eventBus.on('INPUT_ACTION_END', this.handleActionEnd);
    this.eventBus.on('TOUCH_JOYSTICK', this.handleJoystick);
  }

  private removeEventListeners(): void {
    this.eventBus.off('INPUT_ACTION_START', this.handleActionStart);
    this.eventBus.off('INPUT_ACTION_END', this.handleActionEnd);
    this.eventBus.off('TOUCH_JOYSTICK', this.handleJoystick);
  }

  private handleActionStart = (event: any): void => {
    this.actionStates.set(event.payload.action, true);
  };

  private handleActionEnd = (event: any): void => {
    this.actionStates.set(event.payload.action, false);
  };

  private handleJoystick = (event: any): void => {
    const { x, y } = event.payload;
    const transform = this.entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (!transform) return;

    // Convert joystick values to movement
    const angle = Math.atan2(y, x);
    transform.rotation = angle;

    const magnitude = Math.sqrt(x * x + y * y);
    const targetVelocity = {
      x: x * this.config.moveSpeed * magnitude,
      y: y * this.config.moveSpeed * magnitude
    };

    this.currentVelocity = this.updateVelocity(
      this.currentVelocity,
      targetVelocity,
      1/60 // Assuming 60 FPS for touch updates
    );
  };

  private updateVelocity(
    current: Vector2D,
    target: Vector2D,
    deltaTime: number
  ): Vector2D {
    const result: Vector2D = { x: current.x, y: current.y };

    // Apply acceleration or deceleration
    const rate = target.x === 0 && target.y === 0 
      ? this.config.deceleration 
      : this.config.acceleration;

    // Update each component of velocity
    result.x = this.moveToward(current.x, target.x, rate * deltaTime);
    result.y = this.moveToward(current.y, target.y, rate * deltaTime);

    // Limit to max speed
    const speed = Math.sqrt(result.x * result.x + result.y * result.y);
    if (speed > this.config.maxSpeed) {
      const scale = this.config.maxSpeed / speed;
      result.x *= scale;
      result.y *= scale;
    }

    return result;
  }

  private moveToward(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }
    return current + Math.sign(target - current) * maxDelta;
  }

  public getCurrentVelocity(): Vector2D {
    return { ...this.currentVelocity };
  }

  public getSpeed(): number {
    return Math.sqrt(
      this.currentVelocity.x * this.currentVelocity.x + 
      this.currentVelocity.y * this.currentVelocity.y
    );
  }
}
