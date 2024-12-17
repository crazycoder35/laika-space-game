import { ShopItem, ShopCategory } from '../../systems/ShopSystem';

// Extended interface for UI needs
export interface UIShopItem extends ShopItem {
  readonly icon: string;
  readonly level: number;
  readonly maxLevel: number;
}

export class ShopUIAdapter {
  // Convert system ShopItem to UIShopItem
  static adaptItem(item: ShopItem): UIShopItem {
    return {
      ...item,
      icon: this.getIconForItem(item),
      level: this.getLevelForItem(item),
      maxLevel: this.getMaxLevelForItem(item)
    };
  }

  // Convert array of system ShopItems to UIShopItems
  static adaptItems(items: ShopItem[]): UIShopItem[] {
    return items.map(item => this.adaptItem(item));
  }

  private static getIconForItem(item: ShopItem): string {
    // Map item types to icons
    const iconMap: Record<string, string> = {
      'laser1': 'laser_1',
      'shield1': 'shield_1',
      'engine1': 'engine_1'
    };
    return iconMap[item.id] || 'default_icon';
  }

  private static getLevelForItem(item: ShopItem): number {
    // Determine item level based on price or requirements
    const baseLevel = item.requirements.find(req => req.type === 'LEVEL')?.value || 1;
    return baseLevel;
  }

  private static getMaxLevelForItem(item: ShopItem): number {
    // Determine max level based on category
    const maxLevelMap: Record<ShopCategory, number> = {
      [ShopCategory.WEAPONS]: 3,
      [ShopCategory.POWERUPS]: 2,
      [ShopCategory.UPGRADES]: 5,
      [ShopCategory.COSMETICS]: 1
    };
    return maxLevelMap[item.category] || 1;
  }
}
