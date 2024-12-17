import { System, SystemType } from '../types/SystemTypes';
import { ResourceManager } from '../core/ResourceManager';
import { RenderComponent, Sprite } from '../core/components/RenderComponent';
import { SpriteSystemConfig } from '../types/SystemInterfaces';

export interface SpriteSheet {
  texture: HTMLImageElement;
  frames: Map<string, SpriteFrame>;
}

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Animation {
  frames: string[];
  frameTime: number;
  loop: boolean;
}

export class SpriteSystem implements System {
  public readonly priority = 3;
  public readonly dependencies = [SystemType.RENDER];

  private spriteSheets: Map<string, SpriteSheet>;
  private animations: Map<string, Animation>;
  private activeAnimations: Map<string, AnimationState>;
  private readonly resourceManager: ResourceManager;

  constructor(config: SpriteSystemConfig) {
    this.resourceManager = config.resourceManager;
    this.spriteSheets = new Map();
    this.animations = new Map();
    this.activeAnimations = new Map();
  }

  public async initialize(): Promise<void> {
    // Load default spritesheets if needed
  }

  public update(deltaTime: number): void {
    // Update all active animations
    this.activeAnimations.forEach((state, entityId) => {
      this.updateAnimation(entityId, state, deltaTime);
    });
  }

  public cleanup(): void {
    this.spriteSheets.clear();
    this.animations.clear();
    this.activeAnimations.clear();
  }

  public async loadSpriteSheet(
    name: string,
    imageUrl: string,
    frames: Map<string, SpriteFrame>
  ): Promise<void> {
    const texture = await this.resourceManager.loadImage(name, imageUrl);
    this.spriteSheets.set(name, {
      texture,
      frames
    });
  }

  public getSprite(sheetName: string, frameName: string): Sprite | undefined {
    const sheet = this.spriteSheets.get(sheetName);
    if (!sheet) return undefined;

    const frame = sheet.frames.get(frameName);
    if (!frame) return undefined;

    return {
      image: sheet.texture,
      sourceX: frame.x,
      sourceY: frame.y,
      sourceWidth: frame.width,
      sourceHeight: frame.height
    };
  }

  public defineAnimation(
    name: string,
    frames: string[],
    frameTime: number,
    loop: boolean = true
  ): void {
    this.animations.set(name, { frames, frameTime, loop });
  }

  public playAnimation(
    entityId: string,
    renderComponent: RenderComponent,
    animationName: string,
    sheetName: string
  ): void {
    const animation = this.animations.get(animationName);
    if (!animation) return;

    const state: AnimationState = {
      animation,
      sheetName,
      currentFrame: 0,
      frameTimer: 0,
      renderComponent,
      finished: false
    };

    this.activeAnimations.set(entityId, state);
    this.updateSpriteFrame(state);
  }

  public stopAnimation(entityId: string): void {
    this.activeAnimations.delete(entityId);
  }

  private updateAnimation(
    entityId: string,
    state: AnimationState,
    deltaTime: number
  ): void {
    if (state.finished) return;

    state.frameTimer += deltaTime;
    if (state.frameTimer >= state.animation.frameTime) {
      state.frameTimer -= state.animation.frameTime;
      state.currentFrame++;

      if (state.currentFrame >= state.animation.frames.length) {
        if (state.animation.loop) {
          state.currentFrame = 0;
        } else {
          state.finished = true;
          this.activeAnimations.delete(entityId);
          return;
        }
      }

      this.updateSpriteFrame(state);
    }
  }

  private updateSpriteFrame(state: AnimationState): void {
    const frameName = state.animation.frames[state.currentFrame];
    const sprite = this.getSprite(state.sheetName, frameName);
    if (sprite) {
      state.renderComponent.setSprite(sprite);
    }
  }

  public getSpriteSheet(name: string): SpriteSheet | undefined {
    return this.spriteSheets.get(name);
  }

  public getAnimation(name: string): Animation | undefined {
    return this.animations.get(name);
  }

  public isAnimationPlaying(entityId: string): boolean {
    return this.activeAnimations.has(entityId);
  }

  public getActiveAnimations(): Map<string, AnimationState> {
    return new Map(this.activeAnimations);
  }
}

interface AnimationState {
  animation: Animation;
  sheetName: string;
  currentFrame: number;
  frameTimer: number;
  renderComponent: RenderComponent;
  finished: boolean;
}
