export enum ShopCategory {
  WEAPONS = 'WEAPONS',
  POWERUPS = 'POWERUPS',
  UPGRADES = 'UPGRADES',
  COSMETICS = 'COSMETICS'
}

export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: ShopCategory;
  readonly requirements: PurchaseRequirement[];
  readonly icon: string; // Added icon property
  readonly level: number; // Added level property
  readonly maxLevel: number; // Added maxLevel property
}

export interface PurchaseRequirement {
  readonly type: 'LEVEL' | 'COINS' | 'ITEM';
  readonly value: number;
  readonly itemId?: string;
}

export interface PurchaseResult {
  readonly success: boolean;
  readonly message: string;
  readonly item?: ShopItem;
  readonly newBalance?: number;
}

// Define UpgradeStats interface
export interface UpgradeStats {
  readonly damage?: number;
  readonly speed?: number;
  readonly health?: number;
  readonly shield?: number;
  readonly range?: number;
}
