import { Component } from '../core/Component';
import { Entity } from '../core/Entity';

export interface HealthConfig {
  maxHealth: number;
  currentHealth: number;
  shield?: number;
}

export class HealthComponent implements Component {
  public readonly type = 'HEALTH';
  private readonly maxHealth: number;
  private currentHealth: number;
  private shield: number;

  constructor(config: HealthConfig) {
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.currentHealth;
    this.shield = config.shield || 0;
  }

  public takeDamage(amount: number): void {
    // First apply damage to shield
    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        amount = 0;
      } else {
        amount -= this.shield;
        this.shield = 0;
      }
    }

    // Then apply remaining damage to health
    if (amount > 0) {
      this.currentHealth = Math.max(0, this.currentHealth - amount);
    }

    // Emit damage event
    if (this.entity) {
      this.entity.eventBus.emit({
        type: 'DAMAGE_TAKEN',
        payload: {
          entityId: this.entity.id,
          damage: amount,
          currentHealth: this.currentHealth,
          shield: this.shield
        }
      });

      // Check if entity is destroyed
      if (this.currentHealth <= 0) {
        this.entity.eventBus.emit({
          type: 'ENTITY_DESTROYED',
          payload: {
            entityId: this.entity.id,
            entityType: this.entity.type
          }
        });
      }
    }
  }

  public heal(amount: number): void {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);

    if (this.entity) {
      this.entity.eventBus.emit({
        type: 'HEALTH_CHANGED',
        payload: {
          entityId: this.entity.id,
          currentHealth: this.currentHealth,
          maxHealth: this.maxHealth
        }
      });
    }
  }

  public addShield(amount: number): void {
    this.shield += amount;

    if (this.entity) {
      this.entity.eventBus.emit({
        type: 'SHIELD_CHANGED',
        payload: {
          entityId: this.entity.id,
          shield: this.shield
        }
      });
    }
  }

  public getCurrentHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getShield(): number {
    return this.shield;
  }

  public getHealthPercentage(): number {
    return (this.currentHealth / this.maxHealth) * 100;
  }

  public isAlive(): boolean {
    return this.currentHealth > 0;
  }
} 