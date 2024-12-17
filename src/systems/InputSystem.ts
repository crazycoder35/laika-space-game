import { System, SystemType } from '../types/SystemTypes';
import { EventBus } from '../core/EventBus';
import { InputSystemConfig } from '../types/SystemInterfaces';

export type GameAction = 
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'FIRE'
  | 'PAUSE'
  | 'USE_ITEM'
  | 'INTERACT';

export interface InputMapping {
  keyboard: Map<string, GameAction>;
  mouse: Map<number, GameAction>;
  touch: Map<string, GameAction>;
}

export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'rotate';
  touches: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export class InputSystem implements System {
  public readonly priority = 1; // High priority to handle input first
  public readonly dependencies: SystemType[] = [];

  private keys: Set<string>;
  private previousKeys: Set<string>;
  private mousePosition: { x: number; y: number };
  private mouseButtons: Set<number>;
  private touches: Map<number, Touch>;
  private mapping: InputMapping;
  private gestures: Map<string, TouchGesture>;
  private enabled: boolean;
  private readonly eventBus: EventBus;

  constructor(config: InputSystemConfig) {
    this.eventBus = config.eventBus;
    this.keys = new Set();
    this.previousKeys = new Set();
    this.mousePosition = { x: 0, y: 0 };
    this.mouseButtons = new Set();
    this.touches = new Map();
    this.gestures = new Map();
    this.enabled = true;

    // Default input mapping
    this.mapping = {
      keyboard: new Map([
        ['ArrowUp', 'MOVE_UP'],
        ['ArrowDown', 'MOVE_DOWN'],
        ['ArrowLeft', 'MOVE_LEFT'],
        ['ArrowRight', 'MOVE_RIGHT'],
        ['Space', 'FIRE'],
        ['Escape', 'PAUSE'],
        ['E', 'USE_ITEM'],
        ['F', 'INTERACT']
      ]),
      mouse: new Map([
        [0, 'FIRE'], // Left click
        [2, 'USE_ITEM'] // Right click
      ]),
      touch: new Map([
        ['tap', 'FIRE'],
        ['swipe_up', 'MOVE_UP'],
        ['swipe_down', 'MOVE_DOWN'],
        ['swipe_left', 'MOVE_LEFT'],
        ['swipe_right', 'MOVE_RIGHT']
      ])
    };
  }

  public async initialize(): Promise<void> {
    this.setupEventListeners();
  }

  public update(_deltaTime: number): void {
    if (!this.enabled) return;

    // Update previous keys state
    this.previousKeys = new Set(this.keys);

    // Emit input state events
    this.emitKeyboardEvents();
    this.emitMouseEvents();
    this.emitTouchEvents();
  }

  public cleanup(): void {
    this.removeEventListeners();
    this.keys.clear();
    this.mouseButtons.clear();
    this.touches.clear();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse events
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('contextmenu', this.handleContextMenu);

    // Touch events
    window.addEventListener('touchstart', this.handleTouchStart);
    window.addEventListener('touchmove', this.handleTouchMove);
    window.addEventListener('touchend', this.handleTouchEnd);
  }

  private removeEventListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }

  // Event handlers
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return;
    this.keys.add(event.key);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!this.enabled) return;
    this.keys.delete(event.key);
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.enabled) return;
    this.mousePosition = { x: event.clientX, y: event.clientY };
  };

  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.enabled) return;
    this.mouseButtons.add(event.button);
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (!this.enabled) return;
    this.mouseButtons.delete(event.button);
  };

  private handleContextMenu = (event: MouseEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
  };

  private handleTouchStart = (event: TouchEvent): void => {
    if (!this.enabled) return;
    Array.from(event.changedTouches).forEach(touch => {
      this.touches.set(touch.identifier, touch);
    });
    this.detectGesture('start', event);
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.enabled) return;
    Array.from(event.changedTouches).forEach(touch => {
      this.touches.set(touch.identifier, touch);
    });
    this.detectGesture('move', event);
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.enabled) return;
    Array.from(event.changedTouches).forEach(touch => {
      this.touches.delete(touch.identifier);
    });
    this.detectGesture('end', event);
  };

  // Gesture detection
  private detectGesture(phase: 'start' | 'move' | 'end', event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.detectSwipe(phase, event.touches[0]);
    } else if (event.touches.length === 2) {
      this.detectPinchAndRotate(phase, event.touches[0], event.touches[1]);
    }
  }

  private detectSwipe(phase: 'start' | 'move' | 'end', touch: Touch): void {
    // Implement swipe detection logic
  }

  private detectPinchAndRotate(
    phase: 'start' | 'move' | 'end',
    touch1: Touch,
    touch2: Touch
  ): void {
    // Implement pinch and rotate detection logic
  }

  // Event emission
  private emitKeyboardEvents(): void {
    this.mapping.keyboard.forEach((action, key) => {
      const isPressed = this.keys.has(key);
      const wasPressed = this.previousKeys.has(key);

      if (isPressed && !wasPressed) {
        this.eventBus.emit({
          type: 'INPUT_ACTION_START',
          payload: { action, source: 'keyboard', key }
        });
      } else if (!isPressed && wasPressed) {
        this.eventBus.emit({
          type: 'INPUT_ACTION_END',
          payload: { action, source: 'keyboard', key }
        });
      }
    });
  }

  private emitMouseEvents(): void {
    this.mapping.mouse.forEach((action, button) => {
      if (this.mouseButtons.has(button)) {
        this.eventBus.emit({
          type: 'INPUT_ACTION_START',
          payload: {
            action,
            source: 'mouse',
            button,
            position: this.mousePosition
          }
        });
      }
    });
  }

  private emitTouchEvents(): void {
    // Emit touch events based on detected gestures
  }

  // Public methods
  public isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  public isKeyJustPressed(key: string): boolean {
    return this.keys.has(key) && !this.previousKeys.has(key);
  }

  public isMouseButtonDown(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  public getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  public getTouches(): Map<number, Touch> {
    return new Map(this.touches);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.mouseButtons.clear();
      this.touches.clear();
    }
  }

  public updateMapping(newMapping: Partial<InputMapping>): void {
    if (newMapping.keyboard) {
      this.mapping.keyboard = new Map([...this.mapping.keyboard, ...newMapping.keyboard]);
    }
    if (newMapping.mouse) {
      this.mapping.mouse = new Map([...this.mapping.mouse, ...newMapping.mouse]);
    }
    if (newMapping.touch) {
      this.mapping.touch = new Map([...this.mapping.touch, ...newMapping.touch]);
    }
  }
}
