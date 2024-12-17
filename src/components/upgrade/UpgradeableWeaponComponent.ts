import { Component, ComponentType } from '../../core/Component';
import { Entity } from '../../core/Entity';
import { UpgradeStats } from '../../types/ShopInterfaces';

export interface WeaponStats {
  damage: number;
  fireRate: number;
  range: number;
}

export class UpgradeableWeaponComponent extends Component {
  private stats: WeaponStats;

  constructor(entity: Entity, initialStats: WeaponStats) {
    super(ComponentType.WEAPON, entity);
    this.stats = { ...initialStats };
  }

  public initialize(): void {
    // Initialize weapon stats
  }

  public update(deltaTime: number): void {
    // Update weapon state
  }

  public cleanup(): void {
    // Cleanup weapon resources
  }

  public applyUpgrade(upgrade: UpgradeStats): void {
    if (upgrade.damage) {
      this.stats.damage += upgrade.damage;
    }
    if (upgrade.range) {
      this.stats.range += upgrade.range;
    }
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
}
