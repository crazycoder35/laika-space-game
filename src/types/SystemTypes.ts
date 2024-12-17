import { GameStatistics } from './SaveTypes';
import { ShopState } from './ShopTypes';

export enum SystemType {
  PHYSICS = 'PHYSICS',
  RENDER = 'RENDER',
  AUDIO = 'AUDIO',
  INPUT = 'INPUT',
  PARTICLE = 'PARTICLE',
  COLLISION = 'COLLISION',
  AI = 'AI',
  NETWORK = 'NETWORK',
  MOVEMENT = 'MOVEMENT',
  SPRITE = 'SPRITE',
  HUD = 'HUD',
  MUSIC = 'MUSIC',
  SAVE = 'SAVE',
  SHOP = 'SHOP'
}

export interface System {
  readonly priority: number;
  readonly dependencies: SystemType[];
  
  initialize(): Promise<void>;
  update(deltaTime: number): void;
  cleanup(): void;
}

export interface GameEvent {
  type: string;
  payload: any;
}

export interface Action {
  type: string;
  payload?: any;
}

export interface PlayerState {
  readonly health: number;
  readonly score: number;
  readonly coins: number;
  readonly powerups: Map<string, number>;
  readonly upgrades: Map<string, number>;
}

export interface LevelState {
  readonly currentLevel: number;
  readonly entities: string[];
  readonly status: 'loading' | 'playing' | 'paused' | 'completed';
}

export interface GameSettings {
  readonly volume: number;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly controls: {
    readonly keyboard: {
      readonly [key: string]: string;
    };
    readonly mouse: {
      readonly [button: string]: string;
    };
  };
}

export interface GameState {
  readonly version: string;
  readonly isInitialized: boolean;
  readonly player: PlayerState;
  readonly level: LevelState;
  readonly shop: ShopState;
  readonly settings: GameSettings;
  readonly statistics: GameStatistics;
}
