import { Vector2D } from '../../core/components/TransformComponent';
import { EventBus } from '../../core/EventBus';
import { UIComponent, UIStyle } from './UIComponent';

export interface ButtonStyle extends UIStyle {
  hoverBackgroundColor?: string;
  activeBackgroundColor?: string;
  disabledBackgroundColor?: string;
  hoverBorderColor?: string;
  activeBorderColor?: string;
  disabledColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  textBaseline?: 'top' | 'middle' | 'bottom';
}

export class Button extends UIComponent {
  private text: string;
  private isHovered: boolean = false;
  private isPressed: boolean = false;
  private onClick: () => void;

  constructor(
    position: Vector2D,
    size: Vector2D,
    text: string,
    onClick: () => void,
    eventBus: EventBus,
    style: ButtonStyle = {}
  ) {
    super(position, size, eventBus, {
      backgroundColor: '#4a90e2',
      hoverBackgroundColor: '#357abd',
      activeBackgroundColor: '#2b6399',
      disabledBackgroundColor: '#cccccc',
      color: '#ffffff',
      disabledColor: '#999999',
      borderRadius: 4,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
      padding: 10,
      ...style
    });

    this.text = text;
    this.onClick = onClick;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    ctx.save();

    // Apply global alpha if set
    if (this.style.opacity !== undefined) {
      ctx.globalAlpha = this.style.opacity;
    }

    // Draw shadow if specified
    if (this.style.shadow) {
      ctx.shadowColor = this.style.shadow.color;
      ctx.shadowBlur = this.style.shadow.blur;
      ctx.shadowOffsetX = this.style.shadow.offsetX;
      ctx.shadowOffsetY = this.style.shadow.offsetY;
    }

    // Draw background
    ctx.fillStyle = this.getBackgroundColor();
    if (this.style.borderRadius) {
      this.roundRect(ctx, this.rect.x, this.rect.y, this.rect.width, this.rect.height, this.style.borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
    }

    // Draw border
    this.renderBorder(ctx);

    // Draw text
    ctx.fillStyle = this.enabled ? (this.style.color || '#000000') : (this.style.disabledColor || '#999999');
    ctx.font = `${this.style.fontSize || 16}px ${this.style.fontFamily || 'Arial, sans-serif'}`;
    ctx.textAlign = (this.style as ButtonStyle).textAlign || 'center';
    ctx.textBaseline = (this.style as ButtonStyle).textBaseline || 'middle';

    const textX = this.rect.x + this.rect.width / 2;
    const textY = this.rect.y + this.rect.height / 2;

    ctx.fillText(this.text, textX, textY);

    ctx.restore();

    // Render children
    this.children.forEach(child => child.render(ctx));
  }

  protected onPointerDown(event: MouseEvent | TouchEvent): void {
    super.onPointerDown(event);
    if (this.enabled && this.isPointInside(this.getEventPosition(event))) {
      this.isPressed = true;
      this.eventBus.emit({
        type: 'UI_BUTTON_PRESS',
        payload: { id: this.text }
      });
    }
  }

  protected onPointerUp(event: MouseEvent | TouchEvent): void {
    super.onPointerUp(event);
    if (this.enabled && this.isPressed && this.isPointInside(this.getEventPosition(event))) {
      this.onClick();
      this.eventBus.emit({
        type: 'UI_BUTTON_CLICK',
        payload: { id: this.text }
      });
    }
    this.isPressed = false;
  }

  protected onPointerMove(event: MouseEvent | TouchEvent): void {
    super.onPointerMove(event);
    const wasHovered = this.isHovered;
    this.isHovered = this.enabled && this.isPointInside(this.getEventPosition(event));

    if (this.isHovered !== wasHovered) {
      this.eventBus.emit({
        type: this.isHovered ? 'UI_BUTTON_HOVER_START' : 'UI_BUTTON_HOVER_END',
        payload: { id: this.text }
      });
    }
  }

  private getBackgroundColor(): string {
    const style = this.style as ButtonStyle;
    if (!this.enabled) {
      return style.disabledBackgroundColor || '#cccccc';
    }
    if (this.isPressed) {
      return style.activeBackgroundColor || '#2b6399';
    }
    if (this.isHovered) {
      return style.hoverBackgroundColor || '#357abd';
    }
    return style.backgroundColor || '#4a90e2';
  }

  public setText(text: string): void {
    this.text = text;
  }

  public getText(): string {
    return this.text;
  }

  public setOnClick(onClick: () => void): void {
    this.onClick = onClick;
  }
}
