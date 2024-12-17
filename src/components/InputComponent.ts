import { Component } from '../core/Component';
import { Entity } from '../core/Entity';
import { PhysicsComponent } from './PhysicsComponent';
import { WeaponComponent } from './WeaponComponent';

export interface InputBindings {
  [key: string]: string;
}

export class InputComponent implements Component {
  public readonly type = 'INPUT';
  private readonly bindings: InputBindings;
  private readonly pressedKeys: Set<string> = new Set();

  constructor(config: { bindings: InputBindings }) {
    this.bindings = config.bindings;
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (this.bindings[e.key]) {
        this.pressedKeys.add(e.key);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.bindings[e.key]) {
        this.pressedKeys.delete(e.key);
      }
    });
  }

  public update(entity: Entity): void {
    const physics = entity.getComponent('PHYSICS') as PhysicsComponent;
    const weapon = entity.getComponent('WEAPON') as WeaponComponent;

    if (!physics) return;

    // Handle movement
    let moveX = 0;
    if (this.pressedKeys.has('ArrowLeft')) moveX -= 1;
    if (this.pressedKeys.has('ArrowRight')) moveX += 1;

    if (moveX !== 0) {
      physics.applyForce({
        x: moveX * physics.maxSpeed * 10,
        y: 0
      });
    }

    // Handle firing
    if (this.pressedKeys.has('Space') && weapon) {
      weapon.fire(entity);
    }
  }

  public cleanup(): void {
    // Clean up event listeners if needed
  }

  public isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }
} 