import { ShopItem, UpgradeStats } from './ShopInterfaces';

export interface ShopInitializedEvent {
  type: 'SHOP_INITIALIZED';
  payload: {
    categories: string[];
    itemCount: number;
  };
}

export interface ItemPurchasedEvent {
  type: 'ITEM_PURCHASED';
  payload: {
    item: ShopItem;
    newBalance: number;
  };
}

export interface ItemUnlockedEvent {
  type: 'ITEM_UNLOCKED';
  payload: {
    item: ShopItem;
  };
}

export interface UpgradeAppliedEvent {
  type: 'UPGRADE_APPLIED';
  payload: {
    item: ShopItem;
    stats: UpgradeStats;
  };
}

export interface ShopStateChangedEvent {
  type: 'SHOP_STATE_CHANGED';
  payload: {
    availableItems: string[];
    purchasedItems: string[];
    selectedItems: string[];
  };
}

export type ShopEvent =
  | ShopInitializedEvent
  | ItemPurchasedEvent
  | ItemUnlockedEvent
  | UpgradeAppliedEvent
  | ShopStateChangedEvent;
