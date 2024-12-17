import { Component, ComponentType } from '../../core/Component';
import { UpgradeStats } from '../../types/ShopInterfaces';
import { Upgradeable, HealthStats } from '../../types/UpgradeableTypes';
import { EventBus } from '../../core/EventBus';

export class UpgradeableHealthComponent extends Component implements Upgradeable {
  private stats: HealthStats;
  private currentHealth: number;
  private currentShield: number;
  private upgradeLevel: number = 0;
  private readonly eventBus: EventBus;

  constructor(eventBus: EventBus, initialStats?: Partial<HealthStats>) {
    super(ComponentType.HEALTH);
    this.eventBus = eventBus;
    this.stats = {
      maxHealth: initialStats?.maxHealth ?? 100,
      shield: initialStats?.shield ?? 0,
      regeneration: initialStats?.regeneration ?? 0
    };
    this.currentHealth = this.stats.maxHealth;
    this.currentShield = this.stats.shield;
  }

  public initialize(): void {
    this.eventBus.emit({
      type: 'HEALTH_INITIALIZED',
      payload: {
        entityId: this.entity.id,
        stats: this.getStats(),
        currentHealth: this.currentHealth,
        currentShield: this.currentShield
      }
    });
  }

  public update(deltaTime: number): void {
    // Apply regeneration
    if (this.stats.regeneration > 0 && this.currentHealth < this.stats.maxHealth) {
      const regenAmount = this.stats.regeneration * deltaTime;
      this.heal(regenAmount);
    }
  }

  public cleanup(): void {
    // Cleanup health resources
  }

  public applyUpgrade(upgrade: UpgradeStats): void {
    const oldStats = { ...this.stats };

    if (upgrade.health) {
      const healthIncrease = upgrade.health;
      this.stats.maxHealth += healthIncrease;
      // Also heal by the amount increased
      this.heal(healthIncrease);
    }

    if (upgrade.shield) {
      const shieldIncrease = upgrade.shield;
      this.stats.shield += shieldIncrease;
      // Also add to current shield
      this.currentShield += shieldIncrease;
    }

    this.upgradeLevel++;

    // Emit upgrade event
    this.eventBus.emit({
      type: 'HEALTH_UPGRADED',
      payload: {
        entityId: this.entity.id,
        oldStats,
        newStats: this.getStats(),
        level: this.upgradeLevel,
        currentHealth: this.currentHealth,
        currentShield: this.currentShield
      }
    });
  }

  public getUpgradeLevel(): number {
    return this.upgradeLevel;
  }

  public getStats(): HealthStats {
    return { ...this.stats };
  }

  public getCurrentHealth(): number {
    return this.currentHealth;
  }

  public getCurrentShield(): number {
    return this.currentShield;
  }

  public takeDamage(amount: number): void {
    // First apply damage to shield
    if (this.currentShield > 0) {
      if (this.currentShield >= amount) {
        this.currentShield -= amount;
        amount = 0;
      } else {
        amount -= this.currentShield;
        this.currentShield = 0;
      }
    }

    // Then apply remaining damage to health
    if (amount > 0) {
      this.currentHealth = Math.max(0, this.currentHealth - amount);
    }

    // Emit damage event
    this.eventBus.emit({
      type: 'HEALTH_DAMAGED',
      payload: {
        entityId: this.entity.id,
        damage: amount,
        currentHealth: this.currentHealth,
        currentShield: this.currentShield
      }
    });

    // Check if dead
    if (this.currentHealth <= 0) {
      this.eventBus.emit({
        type: 'ENTITY_DIED',
        payload: {
          entityId: this.entity.id
        }
      });
    }
  }

  public heal(amount: number): void {
    const oldHealth = this.currentHealth;
    this.currentHealth = Math.min(this.stats.maxHealth, this.currentHealth + amount);

    if (this.currentHealth !== oldHealth) {
      this.eventBus.emit({
        type: 'HEALTH_HEALED',
        payload: {
          entityId: this.entity.id,
          amount: this.currentHealth - oldHealth,
          currentHealth: this.currentHealth
        }
      });
    }
  }

  public rechargeShield(amount: number): void {
    const oldShield = this.currentShield;
    this.currentShield = Math.min(this.stats.shield, this.currentShield + amount);

    if (this.currentShield !== oldShield) {
      this.eventBus.emit({
        type: 'SHIELD_RECHARGED',
        payload: {
          entityId: this.entity.id,
          amount: this.currentShield - oldShield,
          currentShield: this.currentShield
        }
      });
    }
  }

  // Factory method for creating a default health component
  public static createDefault(eventBus: EventBus): UpgradeableHealthComponent {
    return new UpgradeableHealthComponent(eventBus);
  }

  // Factory method for creating a specific health configuration
  public static createWithStats(
    eventBus: EventBus,
    stats: HealthStats
  ): UpgradeableHealthComponent {
    return new UpgradeableHealthComponent(eventBus, stats);
  }
}
