// Helper functions for shop system testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Switch to the shop scene
       */
      switchToShop(): Chainable<void>;

      /**
       * Switch back to the test scene
       */
      switchToTest(): Chainable<void>;

      /**
       * Add coins to the player's balance
       * @param amount Number of times to click the add coins button (each click adds 100 coins)
       */
      addCoins(amount: number): Chainable<void>;

      /**
       * Get the current coin balance
       */
      getBalance(): Chainable<number>;

      /**
       * Purchase an item from the shop
       * @param itemId The ID of the item to purchase
       */
      purchaseItem(itemId: string): Chainable<boolean>;
    }
  }
}

// Switch to shop scene
Cypress.Commands.add('switchToShop', () => {
  cy.get('button').contains('Switch to Shop').click();
});

// Switch to test scene
Cypress.Commands.add('switchToTest', () => {
  cy.get('button').contains('Switch to Test').click();
});

// Add coins
Cypress.Commands.add('addCoins', (amount: number) => {
  for (let i = 0; i < amount; i++) {
    cy.get('button').contains('Add 100 Coins').click();
  }
});

// Get balance
Cypress.Commands.add('getBalance', () => {
  return cy.window().then((win) => {
    const game = (win as any).Game;
    return game.getDataStore().getState().player.coins;
  });
});

// Purchase item
Cypress.Commands.add('purchaseItem', (itemId: string) => {
  return cy.window().then((win) => {
    const game = (win as any).Game;
    const shopSystem = game.getSystem((win as any).SystemType.SHOP);
    const result = shopSystem.purchaseItem(itemId);
    return result.success;
  });
});

// Add commands to Cypress
export {};
