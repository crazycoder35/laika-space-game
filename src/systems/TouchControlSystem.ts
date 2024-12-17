import { System, SystemType } from '../types/SystemTypes';
import { EventBus } from '../core/EventBus';

export interface VirtualJoystick {
  position: { x: number; y: number };
  value: { x: number; y: number };
  active: boolean;
  radius: number;
  deadzone: number;
}

export interface TouchButton {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  pressed: boolean;
  visible: boolean;
  action: string;
}

export class TouchControlSystem implements System {
  public readonly priority = 2; // After input system
  public readonly dependencies = [SystemType.INPUT];

  private readonly joystick: VirtualJoystick;
  private readonly buttons: Map<string, TouchButton>;
  private readonly ctx: CanvasRenderingContext2D;
  private enabled: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    private eventBus: EventBus
  ) {
    this.ctx = canvas.getContext('2d')!;
    
    // Initialize virtual joystick
    this.joystick = {
      position: { x: 100, y: canvas.height - 100 },
      value: { x: 0, y: 0 },
      active: false,
      radius: 50,
      deadzone: 0.1
    };

    // Initialize touch buttons
    this.buttons = new Map([
      ['fire', {
        id: 'fire',
        position: { x: canvas.width - 100, y: canvas.height - 100 },
        size: { width: 60, height: 60 },
        pressed: false,
        visible: true,
        action: 'FIRE'
      }],
      ['ability', {
        id: 'ability',
        position: { x: canvas.width - 180, y: canvas.height - 100 },
        size: { width: 60, height: 60 },
        pressed: false,
        visible: true,
        action: 'USE_ITEM'
      }]
    ]);
  }

  public async initialize(): Promise<void> {
    // Enable touch controls on mobile devices
    this.enabled = 'ontouchstart' in window;
    if (this.enabled) {
      this.setupEventListeners();
    }
  }

  public update(_deltaTime: number): void {
    if (!this.enabled) return;

    // Emit joystick values if active
    if (this.joystick.active && (Math.abs(this.joystick.value.x) > this.joystick.deadzone || 
        Math.abs(this.joystick.value.y) > this.joystick.deadzone)) {
      this.eventBus.emit({
        type: 'TOUCH_JOYSTICK',
        payload: {
          x: this.joystick.value.x,
          y: this.joystick.value.y
        }
      });
    }
  }

  public render(): void {
    if (!this.enabled) return;

    // Render joystick
    this.renderJoystick();

    // Render buttons
    this.buttons.forEach(button => {
      if (button.visible) {
        this.renderButton(button);
      }
    });
  }

  public cleanup(): void {
    if (this.enabled) {
      this.removeEventListeners();
    }
  }

  private setupEventListeners(): void {
    this.ctx.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.ctx.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.ctx.canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  private removeEventListeners(): void {
    this.ctx.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.ctx.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.ctx.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();
    
    Array.from(event.touches).forEach(touch => {
      const pos = this.getTouchPosition(touch);

      // Check joystick
      if (this.isInJoystickArea(pos)) {
        this.joystick.active = true;
        this.updateJoystickValue(pos);
      }

      // Check buttons
      this.buttons.forEach(button => {
        if (this.isInButton(pos, button)) {
          button.pressed = true;
          this.eventBus.emit({
            type: 'TOUCH_BUTTON_DOWN',
            payload: { action: button.action }
          });
        }
      });
    });
  };

  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault();

    Array.from(event.touches).forEach(touch => {
      const pos = this.getTouchPosition(touch);

      if (this.joystick.active) {
        this.updateJoystickValue(pos);
      }
    });
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    event.preventDefault();

    // Reset joystick if no touches remain
    if (event.touches.length === 0) {
      this.joystick.active = false;
      this.joystick.value = { x: 0, y: 0 };

      // Reset all buttons
      this.buttons.forEach(button => {
        if (button.pressed) {
          button.pressed = false;
          this.eventBus.emit({
            type: 'TOUCH_BUTTON_UP',
            payload: { action: button.action }
          });
        }
      });
    }
  };

  private getTouchPosition(touch: Touch): { x: number; y: number } {
    const rect = this.ctx.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  private isInJoystickArea(pos: { x: number; y: number }): boolean {
    const dx = pos.x - this.joystick.position.x;
    const dy = pos.y - this.joystick.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.joystick.radius;
  }

  private isInButton(pos: { x: number; y: number }, button: TouchButton): boolean {
    return pos.x >= button.position.x - button.size.width / 2 &&
           pos.x <= button.position.x + button.size.width / 2 &&
           pos.y >= button.position.y - button.size.height / 2 &&
           pos.y <= button.position.y + button.size.height / 2;
  }

  private updateJoystickValue(pos: { x: number; y: number }): void {
    const dx = pos.x - this.joystick.position.x;
    const dy = pos.y - this.joystick.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.joystick.radius) {
      const scale = this.joystick.radius / distance;
      this.joystick.value = {
        x: (dx * scale) / this.joystick.radius,
        y: (dy * scale) / this.joystick.radius
      };
    } else {
      this.joystick.value = {
        x: dx / this.joystick.radius,
        y: dy / this.joystick.radius
      };
    }
  }

  private renderJoystick(): void {
    const { position, value, radius, active } = this.joystick;

    // Draw base
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.stroke();

    if (active) {
      // Draw stick
      const stickX = position.x + value.x * radius;
      const stickY = position.y + value.y * radius;
      const stickRadius = radius * 0.5;

      this.ctx.beginPath();
      this.ctx.arc(stickX, stickY, stickRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.fill();
    }
  }

  private renderButton(button: TouchButton): void {
    const { position, size, pressed } = button;

    this.ctx.beginPath();
    this.ctx.rect(
      position.x - size.width / 2,
      position.y - size.height / 2,
      size.width,
      size.height
    );
    this.ctx.fillStyle = pressed 
      ? 'rgba(255, 255, 255, 0.4)'
      : 'rgba(255, 255, 255, 0.2)';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.stroke();
  }

  // Public methods for configuration
  public setJoystickPosition(x: number, y: number): void {
    this.joystick.position = { x, y };
  }

  public setButtonPosition(id: string, x: number, y: number): void {
    const button = this.buttons.get(id);
    if (button) {
      button.position = { x, y };
    }
  }

  public setButtonVisibility(id: string, visible: boolean): void {
    const button = this.buttons.get(id);
    if (button) {
      button.visible = visible;
    }
  }

  public addButton(
    id: string,
    position: { x: number; y: number },
    size: { width: number; height: number },
    action: string
  ): void {
    this.buttons.set(id, {
      id,
      position,
      size,
      pressed: false,
      visible: true,
      action
    });
  }

  public removeButton(id: string): void {
    this.buttons.delete(id);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled && 'ontouchstart' in window;
  }
}
