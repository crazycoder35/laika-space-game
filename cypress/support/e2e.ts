/// <reference types="cypress" />

import './shop';

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
    }
  }
}

// Custom commands
Cypress.Commands.add('waitForGameLoad', () => {
  cy.window().should('have.property', 'Game');
  cy.get('canvas').should('be.visible');
});

Cypress.Commands.add('getGame', () => {
  return cy.window().then((win) => win.Game);
});

Cypress.Commands.add('getShopSystem', () => {
  return cy.window().then((win) => {
    const game = win.Game;
    return game.getSystem(win.SystemType.SHOP);
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

export {};
