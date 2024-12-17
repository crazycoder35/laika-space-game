import { Vector2D } from '../../core/components/TransformComponent';
import { EventBus } from '../../core/EventBus';

export interface UIStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  color?: string;
  disabledColor?: string;
  fontSize?: number;
  fontFamily?: string;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  textBaseline?: 'top' | 'middle' | 'bottom';
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface UIRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class UIComponent {
  protected position: Vector2D;
  protected size: Vector2D;
  protected visible: boolean;
  protected enabled: boolean;
  protected style: UIStyle;
  protected parent: UIComponent | null;
  protected children: UIComponent[];
  protected rect: UIRect;
  protected isDragging: boolean = false;
  protected dragOffset: Vector2D = { x: 0, y: 0 };

  constructor(
    position: Vector2D,
    size: Vector2D,
    protected eventBus: EventBus,
    style: UIStyle = {}
  ) {
    this.position = { ...position };
    this.size = { ...size };
    this.visible = true;
    this.enabled = true;
    this.style = { ...style };
    this.parent = null;
    this.children = [];
    this.rect = this.calculateRect();
  }

  public abstract render(ctx: CanvasRenderingContext2D): void;

  protected calculateRect(): UIRect {
    let x = this.position.x;
    let y = this.position.y;

    // Add parent offset if exists
    if (this.parent) {
      x += this.parent.rect.x;
      y += this.parent.rect.y;
    }

    return {
      x,
      y,
      width: this.size.x,
      height: this.size.y
    };
  }

  public update(deltaTime: number): void {
    // Update rect in case position or size changed
    this.rect = this.calculateRect();

    // Update children
    this.children.forEach(child => child.update(deltaTime));
  }

  public handleInput(event: MouseEvent | TouchEvent): boolean {
    if (!this.enabled) return false;

    // Check children first (in reverse order for proper z-index)
    for (let i = this.children.length - 1; i >= 0; i--) {
      if (this.children[i].handleInput(event)) {
        return true;
      }
    }

    // Then check self
    if (this.isPointInside(this.getEventPosition(event))) {
      this.processEvent(event);
      return true;
    }

    return false;
  }

  protected processEvent(event: MouseEvent | TouchEvent): void {
    switch (event.type) {
      case 'mousedown':
      case 'touchstart':
        this.onPointerDown(event);
        break;
      case 'mousemove':
      case 'touchmove':
        this.onPointerMove(event);
        break;
      case 'mouseup':
      case 'touchend':
        this.onPointerUp(event);
        break;
    }
  }

  protected onPointerDown(event: MouseEvent | TouchEvent): void {
    const pos = this.getEventPosition(event);
    if (this.isPointInside(pos)) {
      this.isDragging = true;
      this.dragOffset = {
        x: pos.x - this.position.x,
        y: pos.y - this.position.y
      };
    }
  }

  protected onPointerMove(event: MouseEvent | TouchEvent): void {
    if (this.isDragging) {
      const pos = this.getEventPosition(event);
      this.position = {
        x: pos.x - this.dragOffset.x,
        y: pos.y - this.dragOffset.y
      };
      this.rect = this.calculateRect();
    }
  }

  protected onPointerUp(_event: MouseEvent | TouchEvent): void {
    this.isDragging = false;
  }

  protected getEventPosition(event: MouseEvent | TouchEvent): Vector2D {
    if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    } else {
      const touch = event.touches[0] || event.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
  }

  protected isPointInside(point: Vector2D): boolean {
    return point.x >= this.rect.x &&
           point.x <= this.rect.x + this.rect.width &&
           point.y >= this.rect.y &&
           point.y <= this.rect.y + this.rect.height;
  }

  public addChild(child: UIComponent): void {
    child.parent = this;
    this.children.push(child);
  }

  public removeChild(child: UIComponent): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
    }
  }

  public setPosition(position: Vector2D): void {
    this.position = { ...position };
    this.rect = this.calculateRect();
  }

  public setSize(size: Vector2D): void {
    this.size = { ...size };
    this.rect = this.calculateRect();
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setStyle(style: Partial<UIStyle>): void {
    this.style = { ...this.style, ...style };
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getPosition(): Vector2D {
    return { ...this.position };
  }

  public getSize(): Vector2D {
    return { ...this.size };
  }

  public getRect(): UIRect {
    return { ...this.rect };
  }

  public getStyle(): UIStyle {
    return { ...this.style };
  }

  protected renderBackground(ctx: CanvasRenderingContext2D): void {
    if (this.style.backgroundColor) {
      ctx.fillStyle = this.style.backgroundColor;
      if (this.style.borderRadius) {
        this.roundRect(ctx, this.rect.x, this.rect.y, this.rect.width, this.rect.height, this.style.borderRadius);
        ctx.fill();
      } else {
        ctx.fillRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
      }
    }
  }

  protected renderBorder(ctx: CanvasRenderingContext2D): void {
    if (this.style.borderColor && this.style.borderWidth) {
      ctx.strokeStyle = this.style.borderColor;
      ctx.lineWidth = this.style.borderWidth;
      if (this.style.borderRadius) {
        this.roundRect(ctx, this.rect.x, this.rect.y, this.rect.width, this.rect.height, this.style.borderRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
      }
    }
  }

  protected roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
