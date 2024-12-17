import { Component, ComponentType } from '../../core/Component';
import { UpgradeStats } from '../../types/ShopInterfaces';
import { Upgradeable, WeaponStats } from '../../types/UpgradeableTypes';
import { EventBus } from '../../core/EventBus';

export class UpgradeableWeaponComponent extends Component implements Upgradeable {
  private stats: WeaponStats;
  private upgradeLevel: number = 0;
  private readonly eventBus: EventBus;

  constructor(eventBus: EventBus, initialStats?: Partial<WeaponStats>) {
    super(ComponentType.WEAPON);
    this.eventBus = eventBus;
    this.stats = {
      damage: initialStats?.damage ?? 10,
      fireRate: initialStats?.fireRate ?? 1,
      range: initialStats?.range ?? 100
    };
  }

  public initialize(): void {
    this.eventBus.emit({
      type: 'WEAPON_INITIALIZED',
      payload: {
        entityId: this.entity.id,
        stats: this.getStats()
      }
    });
  }

  public update(deltaTime: number): void {
    // Update weapon cooldown and state
  }

  public cleanup(): void {
    // Cleanup weapon resources
  }

  public applyUpgrade(upgrade: UpgradeStats): void {
    const oldStats = { ...this.stats };

    if (upgrade.damage) {
      this.stats.damage += upgrade.damage;
    }
    if (upgrade.range) {
      this.stats.range += upgrade.range;
    }

    this.upgradeLevel++;

    // Emit upgrade event
    this.eventBus.emit({
      type: 'WEAPON_UPGRADED',
      payload: {
        entityId: this.entity.id,
        oldStats,
        newStats: this.getStats(),
        level: this.upgradeLevel
      }
    });
  }

  public getUpgradeLevel(): number {
    return this.upgradeLevel;
  }

  public getStats(): WeaponStats {
    return { ...this.stats };
  }

  public getDamage(): number {
    return this.stats.damage;
  }

  public getFireRate(): number {
    return this.stats.fireRate;
  }

  public getRange(): number {
    return this.stats.range;
  }

  public fire(): void {
    // Create projectile
    this.eventBus.emit({
      type: 'WEAPON_FIRED',
      payload: {
        entityId: this.entity.id,
        damage: this.stats.damage,
        range: this.stats.range
      }
    });
  }

  // Factory method for creating a default weapon
  public static createDefault(eventBus: EventBus): UpgradeableWeaponComponent {
    return new UpgradeableWeaponComponent(eventBus);
  }

  // Factory method for creating a specific weapon type
  public static createWithStats(
    eventBus: EventBus,
    stats: WeaponStats
  ): UpgradeableWeaponComponent {
    return new UpgradeableWeaponComponent(eventBus, stats);
  }
}
