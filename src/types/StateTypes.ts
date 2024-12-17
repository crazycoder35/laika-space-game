import { Vector2D } from './CommonTypes';

export type GameStateType = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface PlayerState {
  health: number;
  score: number;
  coins: number;
  powerups: Map<string, number>;
  upgrades: Map<string, number>;
}

export interface LevelState {
  currentLevel: number;
  meteorSpawnRate: number;
  powerupSpawnRate: number;
}

export interface GameState {
  player: PlayerState;
  level: LevelState;
  gameState: GameStateType;
}

export type GameAction = 
  | { type: 'SET_GAME_STATE'; payload: { state: GameStateType } }
  | { type: 'ADD_SCORE'; payload: { score: number } }
  | { type: 'UPDATE_HEALTH'; payload: { health: number } }
  | { type: 'ADD_COINS'; payload: { coins: number } }
  | { type: 'ADD_POWERUP'; payload: { powerupId: string; duration: number } }
  | { type: 'ADD_UPGRADE'; payload: { upgradeId: string; level: number } }; 