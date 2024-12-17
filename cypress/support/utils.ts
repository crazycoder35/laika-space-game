/// <reference types="cypress" />

/**
 * Wait for a specific amount of time in milliseconds
 * @param ms Time to wait in milliseconds
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get the current game state
 */
export const getGameState = () => {
  return cy.getGame().then(game => game.getDataStore().getState());
};

/**
 * Get the current player state
 */
export const getPlayerState = () => {
  return getGameState().then(state => state.player);
};

/**
 * Get the current shop state
 */
export const getShopState = () => {
  return getGameState().then(state => state.shop);
};

/**
 * Switch to the shop scene and wait for it to load
 */
export const switchToShopScene = () => {
  cy.get('button').contains('Switch to Shop').click();
  cy.get('button').contains('Add 100 Coins').should('be.visible');
};

/**
 * Switch to the test scene and wait for it to load
 */
export const switchToTestScene = () => {
  cy.get('button').contains('Switch to Test').click();
  cy.get('button').contains('Switch to Shop').should('be.visible');
};

/**
 * Add coins to the player's balance
 * @param amount Number of times to click the add coins button (each click adds 100 coins)
 */
export const addCoins = (amount: number) => {
  for (let i = 0; i < amount; i++) {
    cy.get('button').contains('Add 100 Coins').click();
  }
};

/**
 * Purchase an item from the shop
 * @param itemId The ID of the item to purchase
 */
export const purchaseItem = (itemId: string) => {
  return cy.getShopSystem().then(shopSystem => shopSystem.purchaseItem(itemId));
};

/**
 * Check if an item is owned by the player
 * @param itemId The ID of the item to check
 */
export const isItemOwned = (itemId: string) => {
  return getShopState().then(state => state.purchasedItems.includes(itemId));
};

/**
 * Get the current balance
 */
export const getBalance = () => {
  return getPlayerState().then(state => state.coins);
};

/**
 * Verify a console message was logged
 * @param pattern Regex pattern or string to match against console logs
 */
export const verifyConsoleLog = (pattern: string | RegExp) => {
  cy.window().then(win => {
    cy.spy(win.console, 'log').as('consoleLog');
  });
  cy.get('@consoleLog').should('be.calledWithMatch', pattern);
};

/**
 * Clear all console spies
 */
export const clearConsoleSpies = () => {
  cy.window().then(win => {
    if (win.console.log.restore) {
      win.console.log.restore();
    }
  });
};

export const TestUtils = {
  wait,
  getGameState,
  getPlayerState,
  getShopState,
  switchToShopScene,
  switchToTestScene,
  addCoins,
  purchaseItem,
  isItemOwned,
  getBalance,
  verifyConsoleLog,
  clearConsoleSpies,
};

export default TestUtils;
