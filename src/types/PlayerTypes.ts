import { Entity } from '../core/Entity';
import { UpgradeType } from './UpgradeSystemTypes';

export interface PlayerState {
  readonly id: string;
  readonly entity: Entity;
  readonly health: number;
  readonly score: number;
  readonly coins: number;
  readonly powerups: Map<string, number>;
  readonly upgrades: Map<UpgradeType, number>;
}

export interface PlayerUpgradeState {
  readonly type: UpgradeType;
  readonly level: number;
  readonly maxLevel: number;
}

export interface PlayerStatsState {
  readonly health: number;
  readonly shield: number;
  readonly damage: number;
  readonly speed: number;
  readonly range: number;
}

export interface PlayerAction {
  type: 'UPDATE_PLAYER';
  payload: Partial<PlayerState>;
}

export interface PlayerUpgradeAction {
  type: 'UPGRADE_PLAYER';
  payload: {
    upgradeType: UpgradeType;
    level: number;
    stats: PlayerStatsState;
  };
}

export type PlayerActions = PlayerAction | PlayerUpgradeAction;
