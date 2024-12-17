import { Scene } from '../core/Scene';
import { EventBus } from '../core/EventBus';
import { DataStore } from '../core/DataStore';
import { ShopSystem } from '../systems/ShopSystem';
import { SystemType, GameEvent } from '../types/SystemTypes';
import { ShopUI } from '../ui/components/ShopUI';
import { Button } from '../ui/components/Button';
import { Game } from '../Game';

interface ItemPurchasedEvent extends GameEvent {
  type: 'ITEM_PURCHASED';
  payload: {
    item: {
      id: string;
      name: string;
      price: number;
    };
    newBalance: number;
  };
}

interface NotificationEvent extends GameEvent {
  type: 'SHOW_NOTIFICATION';
  payload: {
    message: string;
    type: 'success' | 'error';
  };
}

export class ShopTestScene implements Scene {
  private readonly eventBus: EventBus;
  private readonly dataStore: DataStore;
  private readonly game: Game;
  private shopUI: ShopUI | null = null;
  private testButtons: Button[] = [];

  constructor(game: Game) {
    this.game = game;
    this.eventBus = game.getEventBus();
    this.dataStore = game.getDataStore();
  }

  public async initialize(): Promise<void> {
    try {
      // Get shop system from game
      const shopSystem = this.game.getSystem<ShopSystem>(SystemType.SHOP);

      // Create shop UI
      this.shopUI = new ShopUI(
        { x: 50, y: 50 },
        { x: 700, y: 500 },
        this.eventBus,
        shopSystem
      );

      // Create test buttons
      this.createTestButtons();

      // Add test coins
      this.dataStore.dispatch({
        type: 'UPDATE_COINS',
        payload: { coins: 1000 }
      });

      // Subscribe to shop events
      this.eventBus.on<ItemPurchasedEvent>('ITEM_PURCHASED', this.onItemPurchased);
      this.eventBus.on<NotificationEvent>('SHOW_NOTIFICATION', this.onNotification);

      console.log('ShopTestScene initialized');
    } catch (error) {
      console.error('Failed to initialize ShopTestScene:', error);
      throw error;
    }
  }

  private createTestButtons(): void {
    // Add coins button
    const addCoinsButton = new Button(
      { x: 10, y: 10 },
      { x: 120, y: 30 },
      'Add 100 Coins',
      () => this.addTestCoins(),
      this.eventBus,
      {
        backgroundColor: '#4CAF50',
        hoverBackgroundColor: '#45a049'
      }
    );
    this.testButtons.push(addCoinsButton);

    // Show balance button
    const showBalanceButton = new Button(
      { x: 140, y: 10 },
      { x: 120, y: 30 },
      'Show Balance',
      () => this.showBalance(),
      this.eventBus,
      {
        backgroundColor: '#2196F3',
        hoverBackgroundColor: '#1976D2'
      }
    );
    this.testButtons.push(showBalanceButton);
  }

  private addTestCoins(): void {
    const currentCoins = this.dataStore.getState().player.coins;
    this.dataStore.dispatch({
      type: 'UPDATE_COINS',
      payload: { coins: currentCoins + 100 }
    });
    console.log('Added 100 coins. New balance:', currentCoins + 100);
  }

  private showBalance(): void {
    const coins = this.dataStore.getState().player.coins;
    console.log('Current balance:', coins);
    this.eventBus.emit<NotificationEvent>({
      type: 'SHOW_NOTIFICATION',
      payload: {
        message: `Current balance: ${coins} coins`,
        type: 'success'
      }
    });
  }

  private readonly onItemPurchased = (event: ItemPurchasedEvent): void => {
    const { item, newBalance } = event.payload;
    console.log(`Purchased ${item.name} for ${item.price} coins. New balance: ${newBalance}`);
  };

  private readonly onNotification = (event: NotificationEvent): void => {
    const { message, type } = event.payload;
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  public update(deltaTime: number): void {
    // Update UI components
    this.shopUI?.update(deltaTime);
    this.testButtons.forEach(button => button.update(deltaTime));
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Render shop UI
    this.shopUI?.render(ctx);

    // Render test buttons
    this.testButtons.forEach(button => button.render(ctx));
  }

  public handleInput(event: MouseEvent | TouchEvent): void {
    // Handle input for UI components
    this.shopUI?.handleInput(event);
    this.testButtons.forEach(button => button.handleInput(event));
  }

  public cleanup(): void {
    // Cleanup event listeners
    this.eventBus.off('ITEM_PURCHASED', this.onItemPurchased);
    this.eventBus.off('SHOW_NOTIFICATION', this.onNotification);

    // Cleanup UI components
    this.shopUI = null;
    this.testButtons = [];
  }
}
