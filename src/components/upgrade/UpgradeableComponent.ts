import { Component } from '../../core/Component';
import { UpgradeStats } from '../../types/ShopInterfaces';

export interface UpgradeableComponent extends Component {
  applyUpgrade(stats: UpgradeStats): void;
}

export interface WeaponStats {
  damage: number;
  fireRate: number;
  range: number;
}

export interface HealthStats {
  maxHealth: number;
  shield: number;
  regeneration: number;
}

export interface EngineStats {
  speed: number;
  acceleration: number;
  handling: number;
}

export class UpgradeableWeaponComponent implements UpgradeableComponent {
  private stats: WeaponStats;

  constructor(initialStats: WeaponStats) {
    this.stats = { ...initialStats };
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
}

export class UpgradeableHealthComponent implements UpgradeableComponent {
  private stats: HealthStats;

  constructor(initialStats: HealthStats) {
    this.stats = { ...initialStats };
  }

  public applyUpgrade(upgrade: UpgradeStats): void {
    if (upgrade.health) {
      this.stats.maxHealth += upgrade.health;
    }
    if (upgrade.shield) {
      this.stats.shield += upgrade.shield;
    }
  }

  public getStats(): HealthStats {
    return { ...this.stats };
  }
}

export class UpgradeableEngineComponent implements UpgradeableComponent {
  private stats: EngineStats;

  constructor(initialStats: EngineStats) {
    this.stats = { ...initialStats };
  }

  public applyUpgrade(upgrade: UpgradeStats): void {
    if (upgrade.speed) {
      this.stats.speed += upgrade.speed;
    }
  }

  public getStats(): EngineStats {
    return { ...this.stats };
  }
}
