import { Scene } from '../core/Scene';
import { EventBus } from '../core/EventBus';
import { DataStore } from '../core/DataStore';
import { ShopSystem } from '../systems/ShopSystem';
import { ShopUI } from '../ui/components/ShopUI';
import { Button } from '../ui/components/Button';
import { ShowNotificationAction } from '../types/ShopActions';
import { ShopItem } from '../types/ShopInterfaces';

interface ItemPurchasedEvent {
  type: 'ITEM_PURCHASED';
  payload: {
    item: ShopItem;
    newBalance: number;
  };
}

export class ShopScene implements Scene {
  private readonly eventBus: EventBus;
  private readonly dataStore: DataStore;
  private readonly shopSystem: ShopSystem;
  private shopUI: ShopUI | null = null;
  private backButton: Button | null = null;
  private boundOnItemPurchased: (event: ItemPurchasedEvent) => void;
  private boundShowNotification: (event: ShowNotificationAction) => void;

  constructor(eventBus: EventBus, dataStore: DataStore) {
    this.eventBus = eventBus;
    this.dataStore = dataStore;
    this.shopSystem = new ShopSystem(eventBus, dataStore);
    
    // Bind event handlers
    this.boundOnItemPurchased = this.onItemPurchased.bind(this);
    this.boundShowNotification = (event: ShowNotificationAction) => {
      this.showNotification(event.payload.message, event.payload.type);
    };
  }

  public async initialize(): Promise<void> {
    // Initialize shop system
    await this.shopSystem.initialize();

    // Create shop UI
    this.shopUI = new ShopUI(
      { x: 50, y: 50 },
      { x: 800, y: 500 },
      this.eventBus,
      this.shopSystem
    );

    // Create back button
    this.backButton = new Button(
      { x: 10, y: 10 },
      { x: 100, y: 30 },
      'Back',
      () => this.onBackClick(),
      this.eventBus,
      {
        backgroundColor: '#666666',
        hoverBackgroundColor: '#888888',
        activeBackgroundColor: '#444444'
      }
    );

    // Subscribe to shop events
    this.eventBus.on('ITEM_PURCHASED', this.boundOnItemPurchased);
    this.eventBus.on('SHOW_NOTIFICATION', this.boundShowNotification);

    // Emit scene ready event
    this.eventBus.emit({
      type: 'SCENE_READY',
      payload: { scene: 'shop' }
    });
  }

  public update(deltaTime: number): void {
    this.shopUI?.update(deltaTime);
    this.backButton?.update(deltaTime);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Render shop UI and back button
    this.shopUI?.render(ctx);
    this.backButton?.render(ctx);
  }

  public handleInput(event: MouseEvent | TouchEvent): void {
    this.shopUI?.handleInput(event);
    this.backButton?.handleInput(event);
  }

  public cleanup(): void {
    // Cleanup event listeners
    this.eventBus.off('ITEM_PURCHASED', this.boundOnItemPurchased);
    this.eventBus.off('SHOW_NOTIFICATION', this.boundShowNotification);
    
    // Cleanup UI components
    this.shopUI = null;
    this.backButton = null;
  }

  private onBackClick(): void {
    this.eventBus.emit({
      type: 'SCENE_CHANGE',
      payload: { scene: 'game' }
    });
  }

  private onItemPurchased(event: ItemPurchasedEvent): void {
    const { item, newBalance } = event.payload;
    
    // Show purchase confirmation
    this.showNotification(
      `Purchased ${item.name} for ${item.price} coins. Balance: ${newBalance}`,
      'success'
    );

    // Apply item effects based on category
    this.dataStore.dispatch({
      type: 'ADD_UPGRADE',
      payload: {
        upgradeId: item.id,
        level: item.level
      }
    });
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    // Emit notification event for the UI system to handle
    this.eventBus.emit({
      type: 'SHOW_NOTIFICATION',
      payload: { message, type }
    } as ShowNotificationAction);
  }

  // Optional: Add methods for handling transitions
  public onEnter(): void {
    // Scene transition in logic
  }

  public onExit(): void {
    // Scene transition out logic
  }
}
