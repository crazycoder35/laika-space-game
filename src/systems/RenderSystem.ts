import { System, SystemType } from '../types/SystemTypes';
import { EventBus } from '../core/EventBus';
import { RenderComponent } from '../core/components/RenderComponent';
import { BatchRenderer } from '../core/BatchRenderer';
import { MemoryManager } from '../core/MemoryManager';

export interface RenderSystemConfig {
  canvas: HTMLCanvasElement;
  eventBus: EventBus;
  memoryManager: MemoryManager;
}

export interface RenderLayer {
  zIndex: number;
  renderables: Set<RenderComponent>;
}

export class RenderSystem implements System {
  public readonly priority = 4;
  public readonly dependencies = [SystemType.PHYSICS, SystemType.COLLISION];

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly layers: Map<number, RenderLayer>;
  private readonly eventBus: EventBus;
  private readonly memoryManager: MemoryManager;
  private batchRenderer?: BatchRenderer;
  private debug: boolean = false;

  constructor(config: RenderSystemConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.eventBus = config.eventBus;
    this.memoryManager = config.memoryManager;
    this.layers = new Map();

    // Initialize default layers
    this.createLayer(0); // Background
    this.createLayer(1); // Game Objects
    this.createLayer(2); // Effects
    this.createLayer(3); // UI
  }

  public async initialize(): Promise<void> {
    // Set up WebGL context if available
    try {
      this.batchRenderer = new BatchRenderer(this.canvas);
      this.eventBus.emit({
        type: 'WEBGL_INITIALIZED',
        payload: { supported: true }
      });
    } catch (error) {
      console.warn('WebGL not available, falling back to Canvas 2D');
      this.eventBus.emit({
        type: 'WEBGL_INITIALIZED',
        payload: { supported: false, error: (error as Error).message }
      });
    }
  }

  public update(_deltaTime: number): void {
    // Update animations or other render-related logic
  }

  public render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.batchRenderer) {
      this.renderWithBatching();
    } else {
      this.renderWithCanvas2D();
    }

    if (this.debug) {
      this.renderDebugInfo();
    }
  }

  private renderWithBatching(): void {
    if (!this.batchRenderer) return;

    // Sort layers
    const sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      // Sort renderables within layer
      const sortedRenderables = Array.from(layer.renderables)
        .sort((a, b) => a.getLayer() - b.getLayer());

      // Add sprites to batch renderer
      for (const renderable of sortedRenderables) {
        if (renderable.isVisible()) {
          const sprite = renderable.getSprite();
          if (sprite) {
            this.batchRenderer.addToBatch(sprite);
          }
        }
      }
    }

    // Render all batches
    this.batchRenderer.render();
  }

  private renderWithCanvas2D(): void {
    const sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      const sortedRenderables = Array.from(layer.renderables)
        .sort((a, b) => a.getLayer() - b.getLayer());

      for (const renderable of sortedRenderables) {
        if (renderable.isVisible()) {
          if (this.debug) {
            console.log(`Rendering entity: ${renderable.entity.id} on layer: ${layer.zIndex}`);
          }
          renderable.render(this.ctx);
        }
      }
    }
  }

  public cleanup(): void {
    this.layers.clear();
    if (this.batchRenderer) {
      this.batchRenderer.cleanup();
    }
  }

  private createLayer(zIndex: number): void {
    if (!this.layers.has(zIndex)) {
      this.layers.set(zIndex, {
        zIndex,
        renderables: new Set()
      });
    }
  }

  public addToLayer(layer: number, renderable: RenderComponent): void {
    if (!this.layers.has(layer)) {
      this.createLayer(layer);
    }
    this.layers.get(layer)!.renderables.add(renderable);

    // Track memory usage
    this.memoryManager.track(
      `render_component_${renderable.entity.id}`,
      this.estimateRenderableMemory(renderable)
    );

    this.eventBus.emit({
      type: 'RENDERABLE_ADDED',
      payload: {
        entityId: renderable.entity.id,
        layer
      }
    });
  }

  public removeFromLayer(layer: number, renderable: RenderComponent): void {
    const renderLayer = this.layers.get(layer);
    if (renderLayer) {
      renderLayer.renderables.delete(renderable);

      // Untrack memory usage
      this.memoryManager.untrack(`render_component_${renderable.entity.id}`);

      this.eventBus.emit({
        type: 'RENDERABLE_REMOVED',
        payload: {
          entityId: renderable.entity.id,
          layer
        }
      });
    }
  }

  private renderDebugInfo(): void {
    this.ctx.save();
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    
    let y = 20;
    this.layers.forEach((layer, index) => {
      this.ctx.fillText(
        `Layer ${index}: ${layer.renderables.size} objects`,
        10,
        y
      );
      y += 15;
    });

    // Add memory usage info
    const memoryUsage = this.memoryManager.getMemoryUsage();
    this.ctx.fillText(`Total Memory: ${(memoryUsage.total / 1024 / 1024).toFixed(2)} MB`, 10, y);
    y += 15;
    this.ctx.fillText(`Peak Memory: ${(memoryUsage.peak / 1024 / 1024).toFixed(2)} MB`, 10, y);

    this.ctx.restore();
  }

  private estimateRenderableMemory(renderable: RenderComponent): number {
    // Rough estimation of memory usage for a renderable component
    // This could be made more accurate based on specific implementation
    const baseSize = 256; // Base size for component data
    const spriteSize = renderable.getSprite() ? 1024 : 0; // Estimated size for sprite data
    return baseSize + spriteSize;
  }

  public setDebug(enabled: boolean): void {
    this.debug = enabled;
    this.eventBus.emit({
      type: 'RENDER_DEBUG_CHANGED',
      payload: { enabled }
    });
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getLayers(): Map<number, RenderLayer> {
    return new Map(this.layers);
  }

  public getLayerCount(layer: number): number {
    return this.layers.get(layer)?.renderables.size ?? 0;
  }

  public isDebugEnabled(): boolean {
    return this.debug;
  }
}
