import { Vector2D } from '../../core/components/TransformComponent';
import { EventBus } from '../../core/EventBus';
import { UIComponent, UIStyle } from './UIComponent';

export interface HealthBarStyle extends UIStyle {
  fillColor?: string;
  lowHealthColor?: string;
  criticalHealthColor?: string;
  lowHealthThreshold?: number;
  criticalHealthThreshold?: number;
  showText?: boolean;
  animationDuration?: number;
}

export class HealthBar extends UIComponent {
  private maxHealth: number;
  private currentHealth: number;
  private targetHealth: number;
  private animationStartTime: number = 0;
  private animationStartHealth: number = 0;
  private isAnimating: boolean = false;

  constructor(
    position: Vector2D,
    size: Vector2D,
    maxHealth: number,
    eventBus: EventBus,
    style: HealthBarStyle = {}
  ) {
    super(position, size, eventBus, {
      backgroundColor: '#333333',
      fillColor: '#4CAF50',
      lowHealthColor: '#FFC107',
      criticalHealthColor: '#F44336',
      borderColor: '#000000',
      borderWidth: 2,
      borderRadius: 4,
      lowHealthThreshold: 0.4,
      criticalHealthThreshold: 0.2,
      showText: true,
      color: '#ffffff',
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      animationDuration: 500,
      ...style
    });

    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.targetHealth = maxHealth;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    ctx.save();

    // Draw background
    this.renderBackground(ctx);

    // Draw health bar
    const healthStyle = this.style as HealthBarStyle;
    const healthPercentage = this.getCurrentHealthPercentage();
    const barWidth = this.rect.width * healthPercentage;

    // Determine fill color based on health percentage
    ctx.fillStyle = this.getHealthColor(healthPercentage);

    if (healthStyle.borderRadius) {
      this.roundRect(
        ctx,
        this.rect.x,
        this.rect.y,
        barWidth,
        this.rect.height,
        healthStyle.borderRadius
      );
      ctx.fill();
    } else {
      ctx.fillRect(this.rect.x, this.rect.y, barWidth, this.rect.height);
    }

    // Draw border
    this.renderBorder(ctx);

    // Draw health text if enabled
    if (healthStyle.showText) {
      const text = `${Math.round(this.currentHealth)}/${this.maxHealth}`;
      ctx.fillStyle = healthStyle.color || '#ffffff';
      ctx.font = `${healthStyle.fontSize || 12}px ${healthStyle.fontFamily || 'Arial, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        text,
        this.rect.x + this.rect.width / 2,
        this.rect.y + this.rect.height / 2
      );
    }

    ctx.restore();

    // Render children
    this.children.forEach(child => child.render(ctx));
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.isAnimating) {
      const healthStyle = this.style as HealthBarStyle;
      const currentTime = performance.now();
      const elapsed = currentTime - this.animationStartTime;
      const duration = healthStyle.animationDuration || 500;

      if (elapsed >= duration) {
        this.currentHealth = this.targetHealth;
        this.isAnimating = false;
      } else {
        const progress = elapsed / duration;
        const easedProgress = this.easeOutCubic(progress);
        this.currentHealth = this.animationStartHealth + 
          (this.targetHealth - this.animationStartHealth) * easedProgress;
      }

      // Emit health change event
      this.eventBus.emit({
        type: 'HEALTH_CHANGE',
        payload: {
          currentHealth: this.currentHealth,
          maxHealth: this.maxHealth,
          percentage: this.getCurrentHealthPercentage()
        }
      });
    }
  }

  private easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
  }

  private getCurrentHealthPercentage(): number {
    return Math.max(0, Math.min(1, this.currentHealth / this.maxHealth));
  }

  private getHealthColor(percentage: number): string {
    const style = this.style as HealthBarStyle;
    if (percentage <= (style.criticalHealthThreshold || 0.2)) {
      return style.criticalHealthColor || '#F44336';
    }
    if (percentage <= (style.lowHealthThreshold || 0.4)) {
      return style.lowHealthColor || '#FFC107';
    }
    return style.fillColor || '#4CAF50';
  }

  public setHealth(health: number, animate: boolean = true): void {
    const newHealth = Math.max(0, Math.min(this.maxHealth, health));
    
    if (animate) {
      this.animationStartTime = performance.now();
      this.animationStartHealth = this.currentHealth;
      this.targetHealth = newHealth;
      this.isAnimating = true;
    } else {
      this.currentHealth = newHealth;
      this.targetHealth = newHealth;
      this.isAnimating = false;
    }
  }

  public setMaxHealth(maxHealth: number): void {
    const percentage = this.currentHealth / this.maxHealth;
    this.maxHealth = maxHealth;
    this.setHealth(maxHealth * percentage, false);
  }

  public getHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public isAnimatingHealth(): boolean {
    return this.isAnimating;
  }
}
