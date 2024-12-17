import { Component, ComponentType } from '../Component';
import { Sprite } from '../../types/CommonTypes';

export class RenderComponent extends Component {
  private sprite: Sprite | null = null;
  private layer: number = 0;
  private visible: boolean = true;

  constructor() {
    super(ComponentType.RENDER);
  }

  public setSprite(sprite: Sprite): void {
    this.sprite = sprite;
  }

  public getSprite(): Sprite | null {
    return this.sprite;
  }

  public setLayer(layer: number): void {
    this.layer = layer;
  }

  public getLayer(): number {
    return this.layer;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this.sprite) return;

    const { position, rotation, scale, alpha } = this.sprite;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(position.x, position.y);
    ctx.rotate(rotation);
    ctx.scale(scale.x, scale.y);

    // Draw the sprite
    if (this.sprite.texture instanceof WebGLTexture) {
      // WebGL texture handling would be done by BatchRenderer
      // This path shouldn't be called when using WebGL
      console.warn('WebGL texture encountered in Canvas2D context');
    } else {
      // Assume it's an HTMLImageElement or similar for Canvas2D
      const img = this.sprite.texture as unknown as HTMLImageElement;
      const { x, y, width, height } = this.sprite.textureRegion;
      ctx.drawImage(img, x, y, width, height, -width/2, -height/2, width, height);
    }

    ctx.restore();
  }
}
