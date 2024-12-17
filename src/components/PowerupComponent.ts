import { Component } from '../core/Component';
import { Entity } from '../core/Entity';

export type PowerupType = 'SHIELD' | 'SPEED' | 'DAMAGE' | 'HEALTH' | 'RAPID_FIRE';

export interface PowerupConfig {
  type: PowerupType;
  duration: number;
  magnitude: number;
}

export class PowerupComponent implements Component {
  public readonly type = 'POWERUP';
  private readonly powerupType: PowerupType;
  private readonly duration: number;
  private readonly magnitude: number;

  constructor(config: PowerupConfig) {
    this.powerupType = config.type;
    this.duration = config.duration;
    this.magnitude = config.magnitude;
  }

  public apply(entity: Entity): void {
    switch (this.powerupType) {
      case 'SHIELD':
        const health = entity.getComponent('HEALTH');
        if (health) {
          health.addShield(this.magnitude);
        }
        break;

      case 'SPEED':
        const physics = entity.getComponent('PHYSICS');
        if (physics) {
          const originalSpeed = physics.maxSpeed;
          physics.maxSpeed *= this.magnitude;
          setTimeout(() => {
            if (physics.isActive) {
              physics.maxSpeed = originalSpeed;
            }
          }, this.duration);
        }
        break;

      case 'DAMAGE':
        const weapon = entity.getComponent('WEAPON');
        if (weapon) {
          const originalDamage = weapon.getDamage();
          weapon.setDamage(originalDamage * this.magnitude);
          setTimeout(() => {
            if (weapon.isActive) {
              weapon.setDamage(originalDamage);
            }
          }, this.duration);
        }
        break;

      case 'HEALTH':
        const healthComp = entity.getComponent('HEALTH');
        if (healthComp) {
          healthComp.heal(this.magnitude);
        }
        break;

      case 'RAPID_FIRE':
        const weaponComp = entity.getComponent('WEAPON');
        if (weaponComp) {
          const originalFireRate = weaponComp.getFireRate();
          weaponComp.setFireRate(originalFireRate / this.magnitude);
          setTimeout(() => {
            if (weaponComp.isActive) {
              weaponComp.setFireRate(originalFireRate);
            }
          }, this.duration);
        }
        break;
    }

    // Emit powerup applied event
    if (entity.eventBus) {
      entity.eventBus.emit({
        type: 'POWERUP_APPLIED',
        payload: {
          entityId: entity.id,
          powerupType: this.powerupType,
          duration: this.duration,
          magnitude: this.magnitude
        }
      });
    }
  }

  public getPowerupType(): PowerupType {
    return this.powerupType;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getMagnitude(): number {
    return this.magnitude;
  }
} 