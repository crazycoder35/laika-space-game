import { GameState } from '../types/SystemTypes';
import { GameAction } from '../types/StateActions';
import { EventBus } from './EventBus';
import { GameStatistics } from '../types/SaveTypes';

type Listener = () => void;

interface StateHistory {
  readonly past: GameState[];
  readonly present: GameState;
  readonly future: GameState[];
}

export class DataStore {
  private readonly MAX_HISTORY = 50;
  private history: StateHistory;
  private listeners: Set<Listener>;

  constructor(
    initialState: GameState,
    private readonly eventBus: EventBus
  ) {
    this.validateState(initialState);
    this.history = {
      past: [],
      present: initialState,
      future: []
    };
    this.listeners = new Set();
  }

  public getState(): Readonly<GameState> {
    return this.history.present;
  }

  public getStatistics(): Readonly<GameStatistics> {
    return this.history.present.statistics;
  }

  public dispatch(action: GameAction): void {
    try {
      const previousState = this.history.present;
      const newState = this.reducer(previousState, action);
      
      // Validate new state before applying
      this.validateState(newState);

      // Update history
      this.history = {
        past: [...this.history.past.slice(-this.MAX_HISTORY), previousState],
        present: newState,
        future: []
      };
      
      // Notify listeners of state change
      this.notifyListeners();

      // Emit state change event
      this.eventBus.emit({
        type: 'STATE_CHANGE',
        payload: {
          action,
          previousState,
          currentState: newState
        }
      });
    } catch (error) {
      this.eventBus.emit({
        type: 'STATE_ERROR',
        payload: {
          action,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  public undo(): void {
    if (this.history.past.length === 0) return;

    const previous = this.history.past[this.history.past.length - 1];
    const newPast = this.history.past.slice(0, -1);

    this.history = {
      past: newPast,
      present: previous,
      future: [this.history.present, ...this.history.future]
    };

    this.notifyListeners();
  }

  public redo(): void {
    if (this.history.future.length === 0) return;

    const next = this.history.future[0];
    const newFuture = this.history.future.slice(1);

    this.history = {
      past: [...this.history.past, this.history.present],
      present: next,
      future: newFuture
    };

    this.notifyListeners();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private validateState(state: GameState): void {
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid state: must be an object');
    }

    // Validate required sections
    const requiredSections = ['player', 'level', 'shop', 'settings', 'statistics'];
    for (const section of requiredSections) {
      if (!(section in state)) {
        throw new Error(`Invalid state: missing ${section} section`);
      }
    }

    // Validate player state
    if (typeof state.player.health !== 'number' || state.player.health < 0) {
      throw new Error('Invalid player health');
    }
    if (typeof state.player.score !== 'number' || state.player.score < 0) {
      throw new Error('Invalid player score');
    }
    if (typeof state.player.coins !== 'number' || state.player.coins < 0) {
      throw new Error('Invalid player coins');
    }

    // Validate level state
    if (typeof state.level.currentLevel !== 'number' || state.level.currentLevel < 1) {
      throw new Error('Invalid current level');
    }
    if (!Array.isArray(state.level.entities)) {
      throw new Error('Invalid entities array');
    }

    // Validate settings
    if (typeof state.settings.volume !== 'number' || 
        state.settings.volume < 0 || 
        state.settings.volume > 1) {
      throw new Error('Invalid volume setting');
    }
  }

  private reducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'LOAD_STATE':
        return {
          ...state,
          ...action.payload.state,
          statistics: action.payload.statistics
        };

      case 'UPDATE_PLAYER_HEALTH':
        return {
          ...state,
          player: {
            ...state.player,
            health: Math.max(0, Math.min(100, action.payload.health))
          }
        };

      case 'UPDATE_PLAYER_SCORE':
        return {
          ...state,
          player: {
            ...state.player,
            score: Math.max(0, action.payload.score)
          },
          statistics: {
            ...state.statistics,
            highScore: Math.max(state.statistics.highScore, action.payload.score)
          }
        };

      case 'UPDATE_PLAYER_COINS':
        return {
          ...state,
          player: {
            ...state.player,
            coins: Math.max(0, action.payload.coins)
          }
        };

      case 'ADD_POWERUP':
        return {
          ...state,
          player: {
            ...state.player,
            powerups: new Map([...state.player.powerups, [
              action.payload.powerupId,
              (state.player.powerups.get(action.payload.powerupId) || 0) + 1
            ]])
          },
          statistics: {
            ...state.statistics,
            powerupsCollected: state.statistics.powerupsCollected + 1
          }
        };

      case 'UPDATE_LEVEL':
        return {
          ...state,
          level: {
            ...state.level,
            currentLevel: action.payload.level,
            status: 'loading'
          },
          statistics: {
            ...state.statistics,
            levelsCompleted: action.payload.level - 1
          }
        };

      case 'UPDATE_SETTINGS':
        return {
          ...state,
          settings: {
            ...state.settings,
            ...action.payload
          }
        };

      case 'ADD_SHOP_ITEM':
        return {
          ...state,
          shop: {
            ...state.shop,
            availableItems: [...state.shop.availableItems, action.payload.itemId]
          }
        };

      case 'PURCHASE_ITEM':
        return {
          ...state,
          shop: {
            ...state.shop,
            purchasedItems: [...state.shop.purchasedItems, action.payload.itemId],
            availableItems: state.shop.availableItems.filter(id => id !== action.payload.itemId)
          }
        };

      default:
        return state;
    }
  }
}

// Create and export initial state
export const createInitialState = (): GameState => ({
  version: '1.0.0',
  isInitialized: false,
  player: {
    health: 100,
    score: 0,
    coins: 0,
    powerups: new Map(),
    upgrades: new Map()
  },
  level: {
    currentLevel: 1,
    entities: [],
    status: 'loading'
  },
  shop: {
    availableItems: [],
    purchasedItems: [],
    selectedItems: []
  },
  settings: {
    volume: 1.0,
    difficulty: 'medium',
    controls: {
      keyboard: {
        'up': 'ArrowUp',
        'down': 'ArrowDown',
        'left': 'ArrowLeft',
        'right': 'ArrowRight',
        'shoot': 'Space'
      },
      mouse: {
        'primary': 'left',
        'secondary': 'right'
      }
    }
  },
  statistics: {
    totalPlayTime: 0,
    highScore: 0,
    meteorsDestroyed: 0,
    powerupsCollected: 0,
    distanceTraveled: 0,
    levelsCompleted: 0,
    totalDeaths: 0,
    accuracyRate: 0
  }
});
