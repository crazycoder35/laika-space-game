import { UpgradeStats } from './ShopInterfaces';

export interface UpdatePlayerStatsAction {
  type: 'UPDATE_PLAYER_STATS';
  payload: {
    stats: UpgradeStats;
  };
}

export interface ShowNotificationAction {
  type: 'SHOW_NOTIFICATION';
  payload: {
    message: string;
    type: 'success' | 'error';
  };
}

export type ShopAction = 
  | UpdatePlayerStatsAction
  | ShowNotificationAction;
