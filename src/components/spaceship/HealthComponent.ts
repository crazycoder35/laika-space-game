import { Component, ComponentType } from '../../core/Component';
import { EventBus } from '../../core/EventBus';

export interface HealthConfig {
  maxHealth: number;
  initialShield?: number;
}

export interface DamageInfo {
  amount: number;
  source: string;
}

export class HealthComponent extends Component {
  private readonly maxHealth: number;
  private currentHealth: number;
  private shield: number;
  private invulnerable: boolean = false;
  private invulnerabilityTimer: number = 0;
  private readonly INVULNERABILITY_DURATION = 1000; // 1 second in ms

  constructor(config: HealthConfig, private eventBus: EventBus) {
    super(ComponentType.HEALTH);
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.maxHealth;
    this.shield = config.initialShield || 0;
  }

  public override update(_deltaTime: number): void {
    // Update invulnerability status
    if (this.invulnerable && performance.now() > this.invulnerabilityTimer) {
      this.invulnerable = false;
      
      // Emit invulnerability end event
      this.eventBus.emit({
        type: 'INVULNERABILITY_END',
        payload: {
          entityId: this.entity.id
        }
      });
    }
  }

  public takeDamage(info: DamageInfo): void {
    if (this.invulnerable) return;

    let remainingDamage = info.amount;

    // Shield takes damage first
    if (this.shield > 0) {
      if (this.shield >= remainingDamage) {
        this.shield -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= this.shield;
        this.shield = 0;
      }

      // Emit shield damage event
      this.eventBus.emit({
        type: 'SHIELD_DAMAGED',
        payload: {
          entityId: this.entity.id,
          currentShield: this.shield,
          damage: info.amount - remainingDamage
        }
      });
    }

    // Remaining damage affects health
    if (remainingDamage > 0) {
      this.currentHealth = Math.max(0, this.currentHealth - remainingDamage);
      
      // Emit damage event
      this.eventBus.emit({
        type: 'DAMAGE_TAKEN',
        payload: {
          entityId: this.entity.id,
          damage: remainingDamage,
          currentHealth: this.currentHealth,
          source: info.source
        }
      });

      // Brief invulnerability after taking damage
      this.setInvulnerable();

      // Check for death
      if (this.currentHealth <= 0) {
        this.eventBus.emit({
          type: 'ENTITY_DESTROYED',
          payload: {
            entityId: this.entity.id,
            source: info.source
          }
        });
      }
    }
  }

  public heal(amount: number): void {
    const oldHealth = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);

    if (this.currentHealth > oldHealth) {
      this.eventBus.emit({
        type: 'HEALTH_RESTORED',
        payload: {
          entityId: this.entity.id,
          amount: this.currentHealth - oldHealth,
          currentHealth: this.currentHealth
        }
      });
    }
  }

  public addShield(amount: number): void {
    const oldShield = this.shield;
    this.shield += amount;

    this.eventBus.emit({
      type: 'SHIELD_CHANGED',
      payload: {
        entityId: this.entity.id,
        amount: this.shield - oldShield,
        currentShield: this.shield
      }
    });
  }

  private setInvulnerable(): void {
    this.invulnerable = true;
    this.invulnerabilityTimer = performance.now() + this.INVULNERABILITY_DURATION;

    // Emit invulnerability start event
    this.eventBus.emit({
      type: 'INVULNERABILITY_START',
      payload: {
        entityId: this.entity.id,
        duration: this.INVULNERABILITY_DURATION
      }
    });
  }

  // Getters
  public getCurrentHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getShield(): number {
    return this.shield;
  }

  public isInvulnerable(): boolean {
    return this.invulnerable;
  }

  public getHealthPercentage(): number {
    return this.currentHealth / this.maxHealth;
  }
}
