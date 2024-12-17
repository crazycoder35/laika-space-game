import { System, SystemType } from '../types/SystemTypes';
import { UIComponent } from '../ui/components/UIComponent';
import { Button } from '../ui/components/Button';
import { HealthBar } from '../ui/components/HealthBar';
import { Vector2D } from '../core/components/TransformComponent';
import { EventBus } from '../core/EventBus';
import { HUDSystemConfig } from '../types/SystemInterfaces';

interface HUDLayer {
  readonly zIndex: number;
  readonly components: Set<UIComponent>;
}

export class HUDSystem implements System {
  public readonly priority = 100; // Render last, on top of everything
  public readonly dependencies = [SystemType.RENDER];

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly components: Map<string, UIComponent>;
  private readonly layers: Map<number, HUDLayer>;
  private readonly eventBus: EventBus;
  private enabled: boolean = true;

  constructor(config: HUDSystemConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.eventBus = config.eventBus;
    this.components = new Map();
    this.layers = new Map();

    // Initialize default layers
    this.createLayer(0); // Background layer
    this.createLayer(1); // Main UI layer
    this.createLayer(2); // Overlay layer
  }

  public async initialize(): Promise<void> {
    // Initialize HUD system
    this.eventBus.emit({
      type: 'HUD_INITIALIZED',
      payload: {
        layers: Array.from(this.layers.keys())
      }
    });
  }

  public update(deltaTime: number): void {
    if (!this.enabled) return;

    // Update all components
    this.components.forEach(component => {
      component.update(deltaTime);
    });
  }

  public render(): void {
    if (!this.enabled) return;

    // Clear the entire canvas first
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Render each layer in order
    const sortedLayers = Array.from(this.layers.keys()).sort((a, b) => a - b);
    for (const layer of sortedLayers) {
      const components = this.layers.get(layer)?.components;
      if (components) {
        components.forEach(component => {
          if (component.isVisible()) {
            component.render(this.ctx);
          }
        });
      }
    }

    this.ctx.restore();
  }

  public cleanup(): void {
    this.components.clear();
    this.layers.clear();
  }

  private createLayer(zIndex: number): void {
    if (!this.layers.has(zIndex)) {
      this.layers.set(zIndex, {
        zIndex,
        components: new Set()
      });
    }
  }

  public addToLayer(component: UIComponent, layer: number = 1): void {
    if (!this.layers.has(layer)) {
      this.createLayer(layer);
    }
    this.layers.get(layer)!.components.add(component);

    this.eventBus.emit({
      type: 'HUD_COMPONENT_ADDED',
      payload: {
        id: component.constructor.name,
        layer
      }
    });
  }

  public removeFromLayer(component: UIComponent, layer: number): void {
    const components = this.layers.get(layer)?.components;
    if (components) {
      components.delete(component);

      this.eventBus.emit({
        type: 'HUD_COMPONENT_REMOVED',
        payload: {
          id: component.constructor.name,
          layer
        }
      });
    }
  }

  // Component Management
  public addComponent(id: string, component: UIComponent, layer: number = 1): void {
    if (this.components.has(id)) {
      throw new Error(`Component with id ${id} already exists`);
    }
    this.components.set(id, component);
    this.addToLayer(component, layer);
  }

  public removeComponent(id: string): void {
    const component = this.components.get(id);
    if (component) {
      // Remove from all layers
      this.layers.forEach(layer => layer.components.delete(component));
      this.components.delete(id);
    }
  }

  public getComponent(id: string): UIComponent | undefined {
    return this.components.get(id);
  }

  // Helper methods for common UI components
  public createButton(
    id: string,
    text: string,
    position: Vector2D,
    size: Vector2D,
    onClick: () => void,
    layer: number = 1
  ): Button {
    const button = new Button(
      position,
      size,
      text,
      onClick,
      this.eventBus
    );
    this.addComponent(id, button, layer);
    return button;
  }

  public createHealthBar(
    id: string,
    position: Vector2D,
    size: Vector2D,
    maxHealth: number,
    layer: number = 1
  ): HealthBar {
    const healthBar = new HealthBar(
      position,
      size,
      maxHealth,
      this.eventBus
    );
    this.addComponent(id, healthBar, layer);
    return healthBar;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.eventBus.emit({
      type: 'HUD_ENABLED_CHANGED',
      payload: { enabled }
    });
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getComponentCount(): number {
    return this.components.size;
  }

  public getLayerCount(layer: number): number {
    return this.layers.get(layer)?.components.size ?? 0;
  }

  public getLayers(): Map<number, HUDLayer> {
    return new Map(this.layers);
  }
}
