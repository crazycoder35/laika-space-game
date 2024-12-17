import { System, SystemType } from '../types/SystemTypes';
import { EventBus } from '../core/EventBus';
import { DataStore } from '../core/DataStore';
import { Entity } from '../core/Entity';
import { ComponentType } from '../core/Component';
import { Upgradeable } from '../types/UpgradeableTypes';
import { 
  UpgradeType, 
  UpgradeConfig, 
  PlayerEntity, 
  UpgradeEvent, 
  UpgradeAction,
  UpgradePurchaseEvent 
} from '../types/UpgradeSystemTypes';

export class UpgradeSystem implements System {
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
    this.eventBus.on<UpgradePurchaseEvent>('ITEM_PURCHASED', (event) => {
      if (event.payload.item.category === 'UPGRADES') {
        this.handleUpgradePurchase(event.payload.item);
      }
    });
  }

  public update(_deltaTime: number): void {}

  public cleanup(): void {
    this.upgrades.clear();
  }

  public applyUpgrade(type: UpgradeType, entity: Entity): void {
    const upgrade = this.upgrades.get(type);
    if (!upgrade) return;

    const component = this.getUpgradeableComponent(type, entity);
    if (!component) return;

    const currentLevel = component.getUpgradeLevel();
    if (currentLevel >= upgrade.maxLevel) return;

    component.applyUpgrade(upgrade.stats);

    // Update state
    const action: UpgradeAction = {
      type: 'ADD_UPGRADE',
      payload: {
        upgradeId: type,
        level: currentLevel + 1
      }
    };
    this.dataStore.dispatch(action);

    // Emit upgrade event
    const event: UpgradeEvent = {
      type: 'UPGRADE_APPLIED',
      payload: {
        upgradeType: type,
        level: currentLevel + 1,
        stats: upgrade.stats,
        entityId: entity.id
      }
    };
    this.eventBus.emit(event);
  }

  public getUpgradeCost(type: UpgradeType, entity: Entity): number {
    const upgrade = this.upgrades.get(type);
    if (!upgrade) return 0;

    const component = this.getUpgradeableComponent(type, entity);
    if (!component) return 0;

    const currentLevel = component.getUpgradeLevel();
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
  }

  private getUpgradeableComponent(type: UpgradeType, entity: Entity): Upgradeable | null {
    switch (type) {
      case UpgradeType.WEAPON:
        return entity.getComponent(ComponentType.WEAPON) as Upgradeable;
      case UpgradeType.HEALTH:
      case UpgradeType.SHIELD:
        return entity.getComponent(ComponentType.HEALTH) as Upgradeable;
      case UpgradeType.ENGINE:
        return entity.getComponent(ComponentType.ENGINE) as Upgradeable;
      default:
        return null;
    }
  }

  private handleUpgradePurchase(item: { upgradeType: UpgradeType }): void {
    const state = this.dataStore.getState();
    const playerData = state.player as unknown as PlayerEntity;
    if (!playerData || !playerData.entity) return;

    this.applyUpgrade(item.upgradeType, playerData.entity);
  }

  private initializeUpgrades(): void {
    this.upgrades.set(UpgradeType.WEAPON, {
      type: UpgradeType.WEAPON,
      maxLevel: 5,
      baseCost: 100,
      costMultiplier: 1.5,
      stats: { damage: 10, range: 20 }
    });

    this.upgrades.set(UpgradeType.HEALTH, {
      type: UpgradeType.HEALTH,
      maxLevel: 5,
      baseCost: 150,
      costMultiplier: 1.6,
      stats: { health: 25 }
    });

    this.upgrades.set(UpgradeType.SHIELD, {
      type: UpgradeType.SHIELD,
      maxLevel: 3,
      baseCost: 200,
      costMultiplier: 2,
      stats: { shield: 50 }
    });

    this.upgrades.set(UpgradeType.ENGINE, {
      type: UpgradeType.ENGINE,
      maxLevel: 3,
      baseCost: 175,
      costMultiplier: 1.8,
      stats: { speed: 15 }
    });
  }
}
