import { Entity } from '../core/Entity';
import { UpgradeStats } from './ShopInterfaces';

export enum UpgradeType {
  WEAPON = 'WEAPON',
  SHIELD = 'SHIELD',
  HEALTH = 'HEALTH',
  ENGINE = 'ENGINE'
}

export interface UpgradeConfig {
  type: UpgradeType;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  stats: UpgradeStats;
}

export interface PlayerEntity {
  id: string;
  entity: Entity;
}

export interface UpgradeEvent {
  type: 'UPGRADE_APPLIED';
  payload: {
    upgradeType: UpgradeType;
    level: number;
    stats: UpgradeStats;
    entityId: string;
  };
}

export interface UpgradeAction {
  type: 'ADD_UPGRADE';
  payload: {
    upgradeId: string;
    level: number;
  };
}

export interface UpgradePurchaseEvent {
  type: 'ITEM_PURCHASED';
  payload: {
    item: {
      id: string;
      category: string;
      upgradeType: UpgradeType;
    };
  };
}
