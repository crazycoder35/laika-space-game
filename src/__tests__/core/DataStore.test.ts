import { DataStore } from '../../core/DataStore';
import { EventBus } from '../../core/EventBus';
import { GameState } from '../../types/SystemTypes';

describe('DataStore', () => {
  let dataStore: DataStore;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    dataStore = new DataStore(createInitialState(), eventBus);
  });

  it('should initialize with correct state', async () => {
    const state = dataStore.getState();
    expect(state.isInitialized).toBe(false);
    expect(state.player.health).toBe(100);
    expect(state.player.score).toBe(0);
  });

  it('should handle state updates', async () => {
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_HEALTH',
      payload: { health: 80 }
    });

    const state = dataStore.getState();
    expect(state.player.health).toBe(80);
  });

  it('should notify subscribers of state changes', async () => {
    let callCount = 0;
    const unsubscribe = dataStore.subscribe(() => {
      callCount++;
    });

    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: 100 }
    });
    
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_HEALTH',
      payload: { health: 90 }
    });
    
    expect(callCount).toBe(2);
    unsubscribe();

    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: 200 }
    });
    expect(callCount).toBe(2); // Should not increase after unsubscribe
  });

  it('should handle shop actions', async () => {
    // Add coins
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_COINS',
      payload: { coins: 100 }
    });

    // Purchase item
    dataStore.dispatch({
      type: 'PURCHASE_ITEM',
      payload: { itemId: 'weapon_1' }
    });

    const state = dataStore.getState();
    expect(state.player.coins).toBe(100);
    expect(state.shop.purchasedItems).toContain('weapon_1');
  });

  it('should handle save/load actions', async () => {
    // Modify state
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: 1000 }
    });

    // Save state
    const savedState = dataStore.getState();

    // Reset state
    dataStore = new DataStore(createInitialState(), eventBus);
    expect(dataStore.getState().player.score).toBe(0);

    // Load saved state
    dataStore.dispatch({
      type: 'LOAD_STATE',
      payload: {
        state: savedState,
        statistics: savedState.statistics
      }
    });

    expect(dataStore.getState().player.score).toBe(1000);
  });

  it('should emit events on state changes', async () => {
    let eventReceived = false;
    
    eventBus.on('STATE_CHANGE', () => {
      eventReceived = true;
    });

    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: 100 }
    });

    expect(eventReceived).toBe(true);
  });
});

function createInitialState(): GameState {
  return {
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
      status: 'playing'
    },
    shop: {
      availableItems: [],
      purchasedItems: [],
      selectedItems: []
    },
    settings: {
      volume: 1,
      difficulty: 'medium',
      controls: {
        keyboard: {},
        mouse: {}
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
  };
} 