import { ShopSystem } from '../../systems/ShopSystem';
import { DataStore } from '../../core/DataStore';
import { EventBus } from '../../core/EventBus';
import { ShopCategory, ShopItem, PurchaseError, RequirementType } from '../../types/ShopTypes';
import { GameState } from '../../types/SystemTypes';

describe('ShopSystem', () => {
  let shopSystem: ShopSystem;
  let dataStore: DataStore;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    dataStore = new DataStore(createInitialState(), eventBus);
    shopSystem = new ShopSystem(eventBus, dataStore);
  });

  it('should initialize with empty shop inventory', () => {
    const items = shopSystem.getCategoryItems(ShopCategory.WEAPONS);
    expect(items).toHaveLength(0);
  });

  it('should add and retrieve items', async () => {
    const testItem: ShopItem = {
      id: 'test_weapon_1',
      name: 'Test Weapon',
      description: 'A test weapon',
      price: 100,
      category: ShopCategory.WEAPONS,
      requirements: []
    };

    // Add coins to player
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_COINS',
      payload: { coins: 1000 }
    });

    // Add item to shop
    dataStore.dispatch({
      type: 'ADD_SHOP_ITEM',
      payload: { itemId: testItem.id }
    });

    shopSystem.addItem(testItem);

    const result = await shopSystem.purchaseItem('test_weapon_1');
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should handle insufficient funds', async () => {
    const testItem: ShopItem = {
      id: 'expensive_weapon',
      name: 'Expensive Weapon',
      description: 'A very expensive weapon',
      price: 1000,
      category: ShopCategory.WEAPONS,
      requirements: []
    };

    // Add item to shop
    dataStore.dispatch({
      type: 'ADD_SHOP_ITEM',
      payload: { itemId: testItem.id }
    });

    shopSystem.addItem(testItem);

    const result = await shopSystem.purchaseItem('expensive_weapon');
    expect(result.success).toBe(false);
    expect(result.error).toBe(PurchaseError.INSUFFICIENT_FUNDS);
  });

  it('should handle item requirements', async () => {
    const testItem: ShopItem = {
      id: 'advanced_weapon',
      name: 'Advanced Weapon',
      description: 'A weapon with requirements',
      price: 100,
      category: ShopCategory.WEAPONS,
      requirements: [{
        type: RequirementType.LEVEL,
        value: 5
      }]
    };

    // Add coins but don't meet level requirement
    dataStore.dispatch({
      type: 'UPDATE_PLAYER_COINS',
      payload: { coins: 1000 }
    });

    // Add item to shop
    dataStore.dispatch({
      type: 'ADD_SHOP_ITEM',
      payload: { itemId: testItem.id }
    });

    shopSystem.addItem(testItem);

    const result = await shopSystem.purchaseItem('advanced_weapon');
    expect(result.success).toBe(false);
    expect(result.error).toBe(PurchaseError.REQUIREMENTS_NOT_MET);

    // Update level to meet requirement
    dataStore.dispatch({
      type: 'UPDATE_LEVEL',
      payload: { level: 5 }
    });

    const secondAttempt = await shopSystem.purchaseItem('advanced_weapon');
    expect(secondAttempt.success).toBe(true);
    expect(secondAttempt.error).toBeUndefined();
  });

  it('should filter items by category', () => {
    const weaponItem: ShopItem = {
      id: 'test_weapon',
      name: 'Test Weapon',
      description: 'A test weapon',
      price: 100,
      category: ShopCategory.WEAPONS,
      requirements: []
    };

    const powerupItem: ShopItem = {
      id: 'test_powerup',
      name: 'Test Powerup',
      description: 'A test powerup',
      price: 50,
      category: ShopCategory.POWERUPS,
      requirements: []
    };

    shopSystem.addItem(weaponItem);
    shopSystem.addItem(powerupItem);

    dataStore.dispatch({
      type: 'ADD_SHOP_ITEM',
      payload: { itemId: weaponItem.id }
    });

    dataStore.dispatch({
      type: 'ADD_SHOP_ITEM',
      payload: { itemId: powerupItem.id }
    });

    const weapons = shopSystem.getCategoryItems(ShopCategory.WEAPONS);
    const powerups = shopSystem.getCategoryItems(ShopCategory.POWERUPS);

    expect(weapons).toHaveLength(1);
    expect(powerups).toHaveLength(1);
    expect(weapons[0].id).toBe('test_weapon');
    expect(powerups[0].id).toBe('test_powerup');
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