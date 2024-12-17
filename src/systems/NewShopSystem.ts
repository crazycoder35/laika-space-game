import { System, SystemType } from '../types/SystemTypes';
import { EventBus } from '../core/EventBus';
import { DataStore } from '../core/DataStore';
import { 
  ShopItem, 
  ShopCategory, 
  PurchaseResult, 
  PurchaseRequirement 
} from '../types/ShopInterfaces';

export class NewShopSystem implements System {
  public readonly priority = 5;
  public readonly dependencies: SystemType[] = [];

  private readonly items: Map<string, ShopItem>;
  private readonly categories: Set<ShopCategory>;

  constructor(eventBus: EventBus, dataStore: DataStore) {
    this.items = new Map();
    this.categories = new Set(Object.values(ShopCategory));
    this.initializeItems();
  }

  public async initialize(): Promise<void> {
    this.eventBus.emit({
      type: 'SHOP_INITIALIZED',
      payload: {
        categories: Array.from(this.categories),
        itemCount: this.items.size
      }
    });
  }

  public update(_deltaTime: number): void {}

  public cleanup(): void {
    this.items.clear();
    this.categories.clear();
  }

  public purchaseItem(itemId: string): PurchaseResult {
    const item = this.items.get(itemId);
    if (!item) {
      return {
        success: false,
        message: `Item ${itemId} not found`
      };
    }

    const state = this.dataStore.getState();
    const playerCoins = state.player.coins;

    // Check if player has enough coins
    if (playerCoins < item.price) {
      return {
        success: false,
        message: 'Not enough coins'
      };
    }

    // Check requirements
    const requirementsMet = this.checkRequirements(item.requirements);
    if (!requirementsMet.success) {
      return requirementsMet;
    }

    // Process purchase
    this.dataStore.dispatch({
      type: 'UPDATE_COINS',
      payload: { coins: playerCoins - item.price }
    });

    // Add to purchased items
    this.dataStore.dispatch({
      type: 'ADD_SHOP_ITEM',
      payload: { itemId }
    });

    // Emit purchase event
    this.eventBus.emit({
      type: 'ITEM_PURCHASED',
      payload: { 
        item,
        newBalance: playerCoins - item.price
      }
    });

    return {
      success: true,
      message: 'Purchase successful',
      item,
      newBalance: playerCoins - item.price
    };
  }

  public unlockItem(itemId: string): void {
    const item = this.items.get(itemId);
    if (item) {
      this.dataStore.dispatch({
        type: 'ADD_SHOP_ITEM',
        payload: { itemId }
      });

      this.eventBus.emit({
        type: 'ITEM_UNLOCKED',
        payload: { item }
      });
    }
  }

  public getCategoryItems(category: ShopCategory): ShopItem[] {
    return Array.from(this.items.values())
      .filter(item => item.category === category);
  }

  private checkRequirements(requirements: PurchaseRequirement[]): PurchaseResult {
    const state = this.dataStore.getState();

    for (const req of requirements) {
      switch (req.type) {
        case 'LEVEL':
          if (state.level.currentLevel < req.value) {
            return {
              success: false,
              message: `Level ${req.value} required`
            };
          }
          break;

        case 'ITEM':
          if (!state.shop.purchasedItems.includes(req.itemId || '')) {
            return {
              success: false,
              message: `Required item not owned: ${req.value}`
            };
          }
          break;
      }
    }

    return { success: true, message: 'Requirements met' };
  }

  private initializeItems(): void {
    const defaultItems: ShopItem[] = [
      {
        id: 'weapon_laser_1',
        name: 'Basic Laser',
        description: 'Standard laser weapon',
        price: 100,
        category: ShopCategory.WEAPONS,
        requirements: [{ type: 'LEVEL', value: 1 }],
        icon: 'laser_1',
        level: 1,
        maxLevel: 3
      },
      {
        id: 'shield_basic',
        name: 'Basic Shield',
        description: 'Standard shield generator',
        price: 150,
        category: ShopCategory.POWERUPS,
        requirements: [{ type: 'LEVEL', value: 2 }],
        icon: 'shield_1',
        level: 1,
        maxLevel: 3
      }
    ];

    defaultItems.forEach(item => this.items.set(item.id, item));
  }
}
