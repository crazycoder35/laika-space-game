import { UpgradeStats } from './ShopInterfaces';

export interface Upgradeable {
  applyUpgrade(stats: UpgradeStats): void;
  getUpgradeLevel(): number;
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
