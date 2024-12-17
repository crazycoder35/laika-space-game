/// <reference types="cypress" />

import { TestConfig as Config } from './config';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Wait for the game to load and canvas to be visible
       */
      waitForGameLoad(): Chainable<void>;

      /**
       * Get the game instance
       */
      getGame(): Chainable<any>;

      /**
       * Get the shop system
       */
      getShopSystem(): Chainable<any>;

      /**
       * Switch to shop scene
       */
      switchToShop(): Chainable<void>;

      /**
       * Switch to test scene
       */
      switchToTest(): Chainable<void>;

      /**
       * Add coins to player balance
       */
      addCoins(amount: number): Chainable<void>;

      /**
       * Get player balance
       */
      getBalance(): Chainable<number>;

      /**
       * Purchase an item from the shop
       */
      purchaseItem(itemId: string): Chainable<any>;

      /**
       * Check if an item is owned
       */
      isItemOwned(itemId: string): Chainable<boolean>;
    }
  }
}

// Wait for game load
Cypress.Commands.add('waitForGameLoad', () => {
  cy.get('canvas', { timeout: Config.TIMEOUTS.SCENE_LOAD }).should('be.visible');
});

// Get game instance
Cypress.Commands.add('getGame', () => {
  return cy.window().then(win => win.Game);
});

// Get shop system
Cypress.Commands.add('getShopSystem', () => {
  return cy.window().then(win => {
    const game = win.Game;
    return game.getSystem(win.SystemType.SHOP);
  });
});

// Switch to shop scene
Cypress.Commands.add('switchToShop', () => {
  cy.get('button').contains(Config.BUTTONS.SWITCH_TO_SHOP).click();
  cy.get('button').contains(Config.BUTTONS.ADD_COINS).should('be.visible');
});

// Switch to test scene
Cypress.Commands.add('switchToTest', () => {
  cy.get('button').contains(Config.BUTTONS.SWITCH_TO_TEST).click();
  cy.get('button').contains(Config.BUTTONS.SWITCH_TO_SHOP).should('be.visible');
});

// Add coins
Cypress.Commands.add('addCoins', (amount: number) => {
  for (let i = 0; i < amount; i++) {
    cy.get('button').contains(Config.BUTTONS.ADD_COINS).click();
    cy.wait(Config.TIMEOUTS.BUTTON_CLICK);
  }
});

// Get balance
Cypress.Commands.add('getBalance', () => {
  return cy.window().then(win => {
    const game = win.Game;
    return game.getDataStore().getState().player.coins;
  });
});

// Purchase item
Cypress.Commands.add('purchaseItem', (itemId: string) => {
  return cy.getShopSystem().then(shopSystem => shopSystem.purchaseItem(itemId));
});

// Check if item is owned
Cypress.Commands.add('isItemOwned', (itemId: string) => {
  return cy.window().then(win => {
    const game = win.Game;
    const state = game.getDataStore().getState();
    return state.shop.purchasedItems.includes(itemId);
  });
});

// Error handling
Cypress.on('uncaught:exception', (err) => {
  // Prevent WebGL context lost errors from failing tests
  if (err.message.includes('WebGL context lost')) {
    return false;
  }
  return true;
});

// Test configuration
beforeEach(() => {
  // Clear console before each test
  cy.window().then((win) => {
    win.console.clear();
  });
});
