import { System, SystemType } from '../types/SystemTypes';
import { EventBus } from '../core/EventBus';
import { DataStore } from '../core/DataStore';
import {
  ShopItem,
  ShopCategory,
  PurchaseResult,
  PurchaseError,
  PurchaseRequirement,
  RequirementType,
  ShopEventType,
  ShopEventPayload
} from '../types/ShopTypes';

export class ShopSystem implements System {
  public readonly priority: number = 5;
  public readonly dependencies: SystemType[] = [];

  private readonly items: Map<string, ShopItem> = new Map();
  private readonly categories: Set<ShopCategory> = new Set(Object.values(ShopCategory));
  private readonly categoryItems: Map<ShopCategory, Set<string>> = new Map();

  constructor(
    private readonly eventBus: EventBus,
    private readonly dataStore: DataStore
  ) {
    this.initializeCategories();
  }

  private initializeCategories(): void {
    for (const category of this.categories) {
      this.categoryItems.set(category, new Set());
    }
  }

  public async initialize(): Promise<void> {
    // Load initial shop items
    await this.loadShopItems();
  }

  public update(_deltaTime: number): void {
    // Update item availability based on requirements
    this.updateItemAvailability();
  }

  public cleanup(): void {
    this.items.clear();
    this.categoryItems.clear();
  }

  private async loadShopItems(): Promise<void> {
    try {
      // In a real implementation, this would load from a configuration file or server
      // For now, we'll add some example items
      this.addItem({
        id: 'laser_cannon',
        name: 'Laser Cannon',
        description: 'High-powered laser weapon',
        price: 1000,
        category: ShopCategory.WEAPONS,
        requirements: [
          { type: RequirementType.LEVEL, value: 5 }
        ],
        stats: {
          damage: 50,
          cooldown: 2,
          range: 300
        }
      });

      // Add more items as needed
    } catch (error) {
      console.error('Failed to load shop items:', error);
    }
  }

  private updateItemAvailability(): void {
    const state = this.dataStore.getState();
    
    for (const [itemId, item] of this.items) {
      const meetsRequirements = this.checkRequirements(item.requirements);
      const isAvailable = !state.shop.purchasedItems.includes(itemId) && meetsRequirements;
      
      if (isAvailable && !state.shop.availableItems.includes(itemId)) {
        this.dataStore.dispatch({
          type: 'ADD_SHOP_ITEM',
          payload: { itemId }
        });
      }
    }
  }

  public addItem(item: ShopItem): void {
    this.items.set(item.id, item);
    this.categoryItems.get(item.category)?.add(item.id);
  }

  public getItem(itemId: string): ShopItem | undefined {
    return this.items.get(itemId);
  }

  public getCategoryItems(category: ShopCategory): ShopItem[] {
    const itemIds = this.categoryItems.get(category) || new Set();
    return Array.from(itemIds)
      .map(id => this.items.get(id))
      .filter((item): item is ShopItem => item !== undefined);
  }

  public async purchaseItem(itemId: string): Promise<PurchaseResult> {
    const state = this.dataStore.getState();
    const item = this.items.get(itemId);

    if (!item) {
      return {
        success: false,
        error: PurchaseError.INVALID_ITEM
      };
    }

    if (state.shop.purchasedItems.includes(itemId)) {
      return {
        success: false,
        error: PurchaseError.ALREADY_OWNED
      };
    }

    if (!state.shop.availableItems.includes(itemId)) {
      return {
        success: false,
        error: PurchaseError.ITEM_NOT_AVAILABLE
      };
    }

    if (state.player.coins < item.price) {
      return {
        success: false,
        error: PurchaseError.INSUFFICIENT_FUNDS
      };
    }

    if (!this.checkRequirements(item.requirements)) {
      return {
        success: false,
        error: PurchaseError.REQUIREMENTS_NOT_MET
      };
    }

    // Process purchase
    const newBalance = state.player.coins - item.price;
    this.dataStore.dispatch({
      type: 'UPDATE_PLAYER_COINS',
      payload: { coins: newBalance }
    });

    this.dataStore.dispatch({
      type: 'PURCHASE_ITEM',
      payload: { itemId }
    });

    this.emitEvent('ITEM_PURCHASED', {
      itemId,
      balance: newBalance
    });

    return {
      success: true,
      item,
      newBalance
    };
  }

  public unlockItem(itemId: string): void {
    const item = this.items.get(itemId);
    if (!item) return;

    this.dataStore.dispatch({
      type: 'ADD_SHOP_ITEM',
      payload: { itemId }
    });

    this.emitEvent('ITEM_UNLOCKED', { itemId });
  }

  private checkRequirements(requirements: PurchaseRequirement[]): boolean {
    const state = this.dataStore.getState();

    return requirements.every(req => {
      switch (req.type) {
        case RequirementType.LEVEL:
          return state.level.currentLevel >= req.value;
        case RequirementType.SCORE:
          return state.player.score >= req.value;
        case RequirementType.ITEM:
          return req.itemId && state.shop.purchasedItems.includes(req.itemId);
        case RequirementType.ACHIEVEMENT:
          // Implement achievement checking
          return true;
        default:
          return false;
      }
    });
  }

  private emitEvent(type: ShopEventType, payload: ShopEventPayload): void {
    this.eventBus.emit({
      type,
      payload
    });
  }
}
