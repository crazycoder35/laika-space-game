import { GameState, GameSettings } from './SystemTypes';
import { GameStatistics } from './SaveTypes';

export type GameAction =
  | LoadStateAction
  | UpdatePlayerHealthAction
  | UpdatePlayerScoreAction
  | UpdatePlayerCoinsAction
  | AddPowerupAction
  | UpdateLevelAction
  | UpdateSettingsAction
  | AddShopItemAction
  | PurchaseItemAction;

export interface LoadStateAction {
  type: 'LOAD_STATE';
  payload: {
    state: GameState;
    statistics: GameStatistics;
  };
}

export interface UpdatePlayerHealthAction {
  type: 'UPDATE_PLAYER_HEALTH';
  payload: {
    health: number;
  };
}

export interface UpdatePlayerScoreAction {
  type: 'UPDATE_PLAYER_SCORE';
  payload: {
    score: number;
  };
}

export interface UpdatePlayerCoinsAction {
  type: 'UPDATE_PLAYER_COINS';
  payload: {
    coins: number;
  };
}

export interface AddPowerupAction {
  type: 'ADD_POWERUP';
  payload: {
    powerupId: string;
  };
}

export interface UpdateLevelAction {
  type: 'UPDATE_LEVEL';
  payload: {
    level: number;
  };
}

export interface UpdateSettingsAction {
  type: 'UPDATE_SETTINGS';
  payload: Partial<GameSettings>;
}

export interface AddShopItemAction {
  type: 'ADD_SHOP_ITEM';
  payload: {
    itemId: string;
  };
}

export interface PurchaseItemAction {
  type: 'PURCHASE_ITEM';
  payload: {
    itemId: string;
  };
}
