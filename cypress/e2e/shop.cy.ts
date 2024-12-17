import { TestUtils } from '../support/utils';
import { TestConfig as Config } from '../support/config';

describe('Shop System', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.window().then((win) => {
      win.startGame();
    });
    cy.waitForGameLoad();
  });

  it('should show shop UI elements', () => {
    TestUtils.switchToShopScene();
    
    cy.get('canvas').should('be.visible');
    cy.get('button').contains(Config.BUTTONS.ADD_COINS).should('be.visible');
    cy.get('button').contains(Config.BUTTONS.SHOW_BALANCE).should('be.visible');
    cy.get('button').contains(Config.BUTTONS.SWITCH_TO_TEST).should('be.visible');
  });

  it('should start with correct initial balance', () => {
    TestUtils.switchToShopScene();
    
    TestUtils.getBalance().then(balance => {
      expect(balance).to.equal(Config.INITIAL_BALANCE);
    });
  });

  it('should add coins correctly', () => {
    TestUtils.switchToShopScene();
    TestUtils.addCoins(1);

    TestUtils.getBalance().then(balance => {
      expect(balance).to.equal(Config.INITIAL_BALANCE + Config.COINS_PER_CLICK);
    });
  });

  it('should maintain balance between scenes', () => {
    TestUtils.switchToShopScene();
    TestUtils.addCoins(1);

    TestUtils.switchToTestScene();
    TestUtils.switchToShopScene();

    TestUtils.getBalance().then(balance => {
      expect(balance).to.equal(Config.INITIAL_BALANCE + Config.COINS_PER_CLICK);
    });
  });

  it('should purchase item successfully', () => {
    TestUtils.switchToShopScene();
    const item = Config.ITEMS.LASER_1;

    // Add coins for purchase
    TestUtils.addCoins(1);

    // Purchase item
    TestUtils.purchaseItem(item.id).then(result => {
      expect(result.success).to.be.true;
      expect(result.message).to.include(Config.MESSAGES.PURCHASE_SUCCESS);
    });

    // Verify balance
    TestUtils.getBalance().then(balance => {
      expect(balance).to.equal(Config.INITIAL_BALANCE + Config.COINS_PER_CLICK - item.price);
    });

    // Verify ownership
    TestUtils.isItemOwned(item.id).then(owned => {
      expect(owned).to.be.true;
    });
  });

  it('should prevent purchase with insufficient funds', () => {
    TestUtils.switchToShopScene();
    const item = Config.ITEMS.LASER_1;

    // Attempt purchase without enough coins
    TestUtils.purchaseItem(item.id).then(result => {
      expect(result.success).to.be.false;
      expect(result.message).to.include(Config.MESSAGES.INSUFFICIENT_FUNDS);
    });

    // Verify balance unchanged
    TestUtils.getBalance().then(balance => {
      expect(balance).to.equal(Config.INITIAL_BALANCE);
    });

    // Verify item not owned
    TestUtils.isItemOwned(item.id).then(owned => {
      expect(owned).to.be.false;
    });
  });

  it('should show balance in UI', () => {
    TestUtils.switchToShopScene();
    TestUtils.addCoins(1);

    cy.window().then(win => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    cy.get('button').contains(Config.BUTTONS.SHOW_BALANCE).click();
    cy.get('@consoleLog').should('be.calledWithMatch', Config.MESSAGES.BALANCE_PATTERN);
  });
});
