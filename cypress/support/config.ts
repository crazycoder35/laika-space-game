export const TestConfig = {
  // Game settings
  INITIAL_BALANCE: 1000,
  COINS_PER_CLICK: 100,

  // Shop items
  ITEMS: {
    LASER_1: {
      id: 'weapon_laser_1',
      name: 'Basic Laser',
      price: 100
    },
    LASER_2: {
      id: 'weapon_laser_2',
      name: 'Advanced Laser',
      price: 200
    },
    SHIELD_1: {
      id: 'powerup_shield_1',
      name: 'Basic Shield',
      price: 150
    }
  },

  // UI elements
  BUTTONS: {
    SWITCH_TO_SHOP: 'Switch to Shop',
    SWITCH_TO_TEST: 'Switch to Test',
    ADD_COINS: 'Add 100 Coins',
    SHOW_BALANCE: 'Show Balance'
  },

  // Messages
  MESSAGES: {
    PURCHASE_SUCCESS: 'Purchase successful',
    INSUFFICIENT_FUNDS: 'Not enough coins',
    BALANCE_PATTERN: /Current balance: \d+/
  },

  // Timeouts
  TIMEOUTS: {
    SCENE_LOAD: 5000,
    BUTTON_CLICK: 1000,
    STATE_UPDATE: 500
  },

  // Test data
  TEST_SCENARIOS: {
    SINGLE_PURCHASE: {
      coinsToAdd: 1,
      itemToPurchase: 'weapon_laser_1',
      expectedBalance: 1000 // Initial + 100 - 100
    },
    MULTIPLE_PURCHASES: {
      coinsToAdd: 5,
      items: ['weapon_laser_1', 'powerup_shield_1'],
      expectedBalance: 1250 // Initial + 500 - 250
    }
  }
};

export default TestConfig;
