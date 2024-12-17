import { Component, ComponentType } from '../../core/Component';
import { WeaponComponent, WeaponPowerup } from './WeaponComponent';
import { EventBus } from '../../core/EventBus';

export enum PowerupType {
  WEAPON_BOOST = 'WEAPON_BOOST',
  SHIELD = 'SHIELD',
  HEALTH = 'HEALTH',
  SPEED = 'SPEED',
  INVULNERABILITY = 'INVULNERABILITY'
}

export interface PowerupEffect {
  type: PowerupType;
  duration: number;
  strength: number;
  endTime?: number;
}

export class PowerupComponent extends Component {
  private activeEffects: Map<PowerupType, PowerupEffect>;

  constructor(private eventBus: EventBus) {
    super(ComponentType.POWERUP);
    this.activeEffects = new Map();
  }

  public override update(_deltaTime: number): void {
    const currentTime = performance.now();
    const expiredEffects: PowerupType[] = [];

    // Check for expired effects
    this.activeEffects.forEach((effect, type) => {
      if (effect.endTime && currentTime >= effect.endTime) {
        expiredEffects.push(type);
      }
    });

    // Remove expired effects
    expiredEffects.forEach(type => {
      this.removeEffect(type);
    });
  }

  public applyPowerup(effect: PowerupEffect): void {
    // Remove existing effect of the same type if it exists
    if (this.activeEffects.has(effect.type)) {
      this.removeEffect(effect.type);
    }

    // Apply the new effect
    switch (effect.type) {
      case PowerupType.WEAPON_BOOST:
        this.applyWeaponBoost(effect);
        break;
      case PowerupType.SHIELD:
        this.applyShieldBoost(effect);
        break;
      case PowerupType.HEALTH:
        this.applyHealthBoost(effect);
        break;
      case PowerupType.SPEED:
        this.applySpeedBoost(effect);
        break;
      case PowerupType.INVULNERABILITY:
        this.applyInvulnerability(effect);
        break;
    }

    // Store the effect with end time
    this.activeEffects.set(effect.type, {
      ...effect,
      endTime: performance.now() + effect.duration
    });

    // Emit powerup applied event
    this.eventBus.emit({
      type: 'POWERUP_APPLIED',
      payload: {
        entityId: this.entity.id,
        powerupType: effect.type,
        duration: effect.duration,
        strength: effect.strength
      }
    });
  }

  private removeEffect(type: PowerupType): void {
    const effect = this.activeEffects.get(type);
    if (!effect) return;

    // Clean up effect
    switch (type) {
      case PowerupType.WEAPON_BOOST:
        this.removeWeaponBoost();
        break;
      // Add other effect removal handlers as needed
    }

    this.activeEffects.delete(type);

    // Emit powerup removed event
    this.eventBus.emit({
      type: 'POWERUP_REMOVED',
      payload: {
        entityId: this.entity.id,
        powerupType: type
      }
    });
  }

  private applyWeaponBoost(effect: PowerupEffect): void {
    const weapon = this.entity.getComponent<WeaponComponent>(ComponentType.WEAPON);
    if (!weapon) return;

    const powerup: WeaponPowerup = {
      damageMod: 1 + effect.strength,
      fireRateMod: 1 + effect.strength * 0.5,
      projectileSpeedMod: 1 + effect.strength * 0.3,
      duration: effect.duration
    };

    weapon.attachPowerup(powerup);
  }

  private removeWeaponBoost(): void {
    // The weapon component handles its own powerup removal
  }

  private applyShieldBoost(_effect: PowerupEffect): void {
    // TODO: Implement shield boost when shield system is added
  }

  private applyHealthBoost(_effect: PowerupEffect): void {
    // TODO: Implement health boost
  }

  private applySpeedBoost(_effect: PowerupEffect): void {
    // TODO: Implement speed boost when movement system is added
  }

  private applyInvulnerability(_effect: PowerupEffect): void {
    // TODO: Implement invulnerability when damage system is added
  }

  // Getters
  public hasEffect(type: PowerupType): boolean {
    return this.activeEffects.has(type);
  }

  public getEffect(type: PowerupType): PowerupEffect | undefined {
    return this.activeEffects.get(type);
  }

  public getAllEffects(): Map<PowerupType, PowerupEffect> {
    return new Map(this.activeEffects);
  }
}
