import { System, SystemType } from '../types/SystemTypes';
import { EventBus } from '../core/EventBus';
import { DataStore } from '../core/DataStore';
import { Entity } from '../core/Entity';
import { ComponentType } from '../core/Component';
import { UpgradeStats } from '../types/ShopInterfaces';
import { Upgradeable } from '../types/UpgradeableTypes';

// Define upgrade types
export enum UpgradeType {
  WEAPON = 'WEAPON',
  SHIELD = 'SHIELD',
  HEALTH = 'HEALTH',
  MOVEMENT = 'MOVEMENT'  // Changed from ENGINE to MOVEMENT to match existing components
}

// Define upgrade configuration
interface UpgradeConfig {
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  stats: UpgradeStats;
}

export class UpgradeManager implements System {
  public readonly priority = 5;
  public readonly dependencies: SystemType[] = [];

  private readonly upgrades: Map<UpgradeType, UpgradeConfig>;

  constructor(
    private readonly eventBus: EventBus,
    private readonly dataStore: DataStore
  ) {
    this.upgrades = new Map();
    this.initializeUpgrades();
  }

  public async initialize(): Promise<void> {
    // Subscribe to shop events
    this.eventBus.on('ITEM_PURCHASED', (event) => {
      if (event.payload.item.category === 'UPGRADES') {
        this.handleUpgradePurchase(event.payload.item);
      }
    });
  }

  public update(_deltaTime: number): void {}

  public cleanup(): void {
    this.upgrades.clear();
  }

  private getComponentType(upgradeType: UpgradeType): ComponentType {
    switch (upgradeType) {
      case UpgradeType.WEAPON:
        return ComponentType.WEAPON;
      case UpgradeType.HEALTH:
      case UpgradeType.SHIELD:
        return ComponentType.HEALTH;
      case UpgradeType.MOVEMENT:
        return ComponentType.PHYSICS;
      default:
        throw new Error(`Unknown upgrade type: ${upgradeType}`);
    }
  }

  public applyUpgrade(type: UpgradeType, entity: Entity): boolean {
    const upgrade = this.upgrades.get(type);
    if (!upgrade) return false;

    const componentType = this.getComponentType(type);
    const component = entity.getComponent(componentType) as Upgradeable;
    
    if (!component) {
      console.warn(`Entity ${entity.id} missing required component: ${componentType}`);
      return false;
    }

    const currentLevel = component.getUpgradeLevel();
    if (currentLevel >= upgrade.maxLevel) {
      console.warn(`Upgrade ${type} already at max level: ${upgrade.maxLevel}`);
      return false;
    }

    // Apply upgrade
    component.applyUpgrade(upgrade.stats);

    // Update state
    this.dataStore.dispatch({
      type: 'ADD_UPGRADE',
      payload: {
        upgradeId: type,
        level: currentLevel + 1
      }
    });

    // Emit event
    this.eventBus.emit({
      type: 'UPGRADE_APPLIED',
      payload: {
        type,
        level: currentLevel + 1,
        stats: upgrade.stats,
        entityId: entity.id
      }
    });

    return true;
  }

  public getUpgradeCost(type: UpgradeType, entity: Entity): number {
    const upgrade = this.upgrades.get(type);
    if (!upgrade) return 0;

    const component = entity.getComponent(this.getComponentType(type)) as Upgradeable;
    if (!component) return 0;

    const currentLevel = component.getUpgradeLevel();
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
  }

  private handleUpgradePurchase(item: { upgradeType: UpgradeType }): void {
    const state = this.dataStore.getState();
    if (!state.player || !state.player.entity) return;

    this.applyUpgrade(item.upgradeType, state.player.entity);
  }

  private initializeUpgrades(): void {
    this.upgrades.set(UpgradeType.WEAPON, {
      maxLevel: 5,
      baseCost: 100,
      costMultiplier: 1.5,
      stats: { damage: 10, range: 20 }
    });

    this.upgrades.set(UpgradeType.HEALTH, {
      maxLevel: 5,
      baseCost: 150,
      costMultiplier: 1.6,
      stats: { health: 25 }
    });

    this.upgrades.set(UpgradeType.SHIELD, {
      maxLevel: 3,
      baseCost: 200,
      costMultiplier: 2,
      stats: { shield: 50 }
    });

    this.upgrades.set(UpgradeType.MOVEMENT, {
      maxLevel: 3,
      baseCost: 175,
      costMultiplier: 1.8,
      stats: { speed: 15 }
    });
  }
}
