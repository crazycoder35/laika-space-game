import { UpgradeType } from '../systems/UpgradeSystem';
import { UpgradeStats } from './ShopInterfaces';

export interface AddUpgradeAction {
  type: 'ADD_UPGRADE';
  payload: {
    type: UpgradeType;
    level: number;
    stats: UpgradeStats;
  };
}

export interface UpgradeAppliedEvent {
  type: 'UPGRADE_APPLIED';
  payload: {
    type: UpgradeType;
    level: number;
    stats: UpgradeStats;
  };
}

export type UpgradeAction = AddUpgradeAction;
