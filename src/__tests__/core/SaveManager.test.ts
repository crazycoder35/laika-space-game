import SaveManager from '../../core/SaveManager';
import { DataStore } from '../../core/DataStore';
import { EventBus } from '../../core/EventBus';
import { GameState } from '../../types/SystemTypes';

describe('SaveManager', () => {
  let saveManager: SaveManager;
  let dataStore: DataStore;
  let eventBus: EventBus;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value.toString();
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        })
      },
      writable: true
    });

    eventBus = new EventBus();
    dataStore = new DataStore(createInitialState(), eventBus);
    saveManager = new SaveManager(eventBus, dataStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save and load game state', async () => {
    // Modify state
    const testScore = 1000;
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: testScore }
    });

    // Save to slot 1
    await saveManager.save(1);

    // Verify localStorage was called
    expect(localStorage.setItem).toHaveBeenCalled();
    const saveKey = Object.keys(mockLocalStorage).find(key => key.includes('_1'));
    expect(saveKey).toBeDefined();

    // Reset state
    dataStore.dispatch({
      type: 'LOAD_STATE',
      payload: { state: createInitialState(), statistics: createInitialState().statistics }
    });
    expect(dataStore.getState().player.score).toBe(0);

    // Load from slot 1
    await saveManager.load(1);
    expect(dataStore.getState().player.score).toBe(testScore);
  });

  it('should handle save slots independently', async () => {
    // Save different scores to different slots
    const score1 = 100;
    const score2 = 200;

    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: score1 }
    });
    await saveManager.save(1);

    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: score2 }
    });
    await saveManager.save(2);

    // Verify both saves exist in localStorage
    const saveKeys = Object.keys(mockLocalStorage);
    expect(saveKeys.length).toBe(2);
    expect(saveKeys.some(key => key.includes('_1'))).toBe(true);
    expect(saveKeys.some(key => key.includes('_2'))).toBe(true);

    // Reset and load slot 1
    dataStore.dispatch({
      type: 'LOAD_STATE',
      payload: { state: createInitialState(), statistics: createInitialState().statistics }
    });
    await saveManager.load(1);
    expect(dataStore.getState().player.score).toBe(score1);

    // Load slot 2
    await saveManager.load(2);
    expect(dataStore.getState().player.score).toBe(score2);
  });

  it('should list available saves', async () => {
    // Create saves with different timestamps
    await saveManager.save(1);
    await new Promise(resolve => setTimeout(resolve, 100)); // Ensure different timestamps
    await saveManager.save(2);

    const saves = await saveManager.listSaves();
    expect(saves.length).toBe(2);
    expect(saves[0].metadata.slot).toBe(2); // Most recent first
    expect(saves[1].metadata.slot).toBe(1);
  });

  it('should delete saves', async () => {
    // Create a save
    await saveManager.save(1);
    let saves = await saveManager.listSaves();
    expect(saves.length).toBe(1);

    // Delete the save
    await saveManager.deleteSave(1);
    saves = await saveManager.listSaves();
    expect(saves.length).toBe(0);
    expect(localStorage.removeItem).toHaveBeenCalled();
  });

  it('should handle save metadata', async () => {
    const testScore = 1000;
    const testLevel = 5;

    // Set up some game progress
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: testScore }
    });
    dataStore.dispatch({
      type: 'UPDATE_LEVEL',
      payload: { level: testLevel }
    });

    // Save game with custom metadata
    await saveManager.save(1, {
      name: 'Test Save',
      playtime: 3600
    });

    // Get save info
    const saves = await saveManager.listSaves();
    const saveInfo = saves[0];

    expect(saveInfo.metadata.timestamp).toBeDefined();
    expect(saveInfo.metadata.level).toBe(testLevel);
    expect(saveInfo.metadata.name).toBe('Test Save');
    expect(saveInfo.metadata.playtime).toBe(3600);
  });

  it('should handle save errors', async () => {
    // Try to load non-existent save
    await expect(saveManager.load(999)).rejects.toThrow('Invalid save slot: 999');

    // Try to save to invalid slot
    await expect(saveManager.save(-1)).rejects.toThrow('Invalid save slot: -1');

    // Try to delete non-existent save
    await expect(saveManager.deleteSave(999)).rejects.toThrow('Invalid save slot: 999');

    // Mock localStorage error
    jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage full');
    });

    await expect(saveManager.save(1)).rejects.toThrow('Storage full');
  });

  it('should emit save events in correct order', async () => {
    const events: string[] = [];

    eventBus.on('SAVE_STARTED', () => events.push('SAVE_STARTED'));
    eventBus.on('SAVE_COMPLETED', () => events.push('SAVE_COMPLETED'));
    eventBus.on('SAVE_ERROR', () => events.push('SAVE_ERROR'));

    await saveManager.save(1);

    expect(events).toEqual(['SAVE_STARTED', 'SAVE_COMPLETED']);
  });

  it('should handle data integrity in test environment', async () => {
    // Set up test state through dispatches
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_SCORE',
      payload: { score: 1000 }
    });
    
    dataStore.dispatch({
      type: 'UPDATE_LEVEL',
      payload: { level: 5 }
    });
    
    // Create a state with updated statistics
    const stateWithStats = createInitialState();
    stateWithStats.statistics.highScore = 2000;
    
    dataStore.dispatch({
      type: 'LOAD_STATE',
      payload: { 
        state: dataStore.getState(),
        statistics: stateWithStats.statistics
      }
    });

    const originalState = dataStore.getState();

    // Save state
    await saveManager.save(1);

    // Reset state
    dataStore.dispatch({
      type: 'LOAD_STATE',
      payload: { state: createInitialState(), statistics: createInitialState().statistics }
    });

    // Load and verify data integrity
    await saveManager.load(1);
    const loadedState = dataStore.getState();
    expect(loadedState.player.score).toBe(originalState.player.score);
    expect(loadedState.level.currentLevel).toBe(originalState.level.currentLevel);
    expect(loadedState.statistics.highScore).toBe(originalState.statistics.highScore);
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