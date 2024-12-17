import { Entity } from '../core/Entity';

export enum ShopCategory {
  WEAPONS = 'WEAPONS',
  POWERUPS = 'POWERUPS',
  UPGRADES = 'UPGRADES',
  COSMETICS = 'COSMETICS',
  CONSUMABLES = 'CONSUMABLES'
}

export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: ShopCategory;
  readonly requirements: PurchaseRequirement[];
  readonly icon?: string;
  readonly preview?: string;
  readonly stats?: ItemStats;
}

export interface ItemStats {
  readonly damage?: number;
  readonly speed?: number;
  readonly range?: number;
  readonly duration?: number;
  readonly cooldown?: number;
  readonly [key: string]: number | undefined;
}

export interface PurchaseRequirement {
  readonly type: RequirementType;
  readonly value: number;
  readonly itemId?: string;
}

export enum RequirementType {
  LEVEL = 'LEVEL',
  SCORE = 'SCORE',
  ITEM = 'ITEM',
  ACHIEVEMENT = 'ACHIEVEMENT'
}

export interface PurchaseResult {
  readonly success: boolean;
  readonly error?: PurchaseError;
  readonly item?: ShopItem;
  readonly newBalance?: number;
}

export enum PurchaseError {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  REQUIREMENTS_NOT_MET = 'REQUIREMENTS_NOT_MET',
  ALREADY_OWNED = 'ALREADY_OWNED',
  ITEM_NOT_AVAILABLE = 'ITEM_NOT_AVAILABLE',
  INVALID_ITEM = 'INVALID_ITEM'
}

export interface ShopEvent {
  readonly type: ShopEventType;
  readonly payload: ShopEventPayload;
}

export type ShopEventType =
  | 'ITEM_PURCHASED'
  | 'ITEM_UNLOCKED'
  | 'PURCHASE_FAILED'
  | 'ITEM_SELECTED'
  | 'ITEM_DESELECTED'
  | 'CATEGORY_CHANGED'
  | 'SHOP_OPENED'
  | 'SHOP_CLOSED';

export interface ShopEventPayload {
  readonly itemId?: string;
  readonly category?: ShopCategory;
  readonly error?: PurchaseError;
  readonly balance?: number;
}

export interface Upgrade {
  readonly type: string;
  readonly maxLevel: number;
  readonly baseCost: number;
  readonly costMultiplier: number;
  
  apply(entity: Entity, level: number): void;
}

export interface ShopState {
  readonly availableItems: string[];
  readonly purchasedItems: string[];
  readonly selectedItems: string[];
}

export interface ShopEvents {
  SHOP_INITIALIZED: {
    categories: ShopCategory[];
    itemCount: number;
  };
  ITEM_PURCHASED: {
    item: ShopItem;
    newBalance: number;
  };
  ITEM_UNLOCKED: {
    item: ShopItem;
  };
  UPGRADE_APPLIED: {
    type: string;
    level: number;
    entity: Entity;
  };
}
