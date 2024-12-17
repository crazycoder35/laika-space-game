import { Component, ComponentType } from '../../core/Component';
import { TransformComponent, Vector2D } from '../../core/components/TransformComponent';

export interface WeaponStats {
  damage: number;
  fireRate: number;
  projectileSpeed: number;
}

export interface WeaponPowerup {
  damageMod: number;
  fireRateMod: number;
  projectileSpeedMod: number;
  duration: number;
}

export class WeaponComponent extends Component {
  private damage: number;
  private fireRate: number;
  private projectileSpeed: number;
  private lastFireTime: number = 0;
  private powerup: WeaponPowerup | null = null;
  private powerupEndTime: number = 0;

  constructor(stats: WeaponStats) {
    super(ComponentType.WEAPON);
    this.damage = stats.damage;
    this.fireRate = stats.fireRate;
    this.projectileSpeed = stats.projectileSpeed;
  }

  public override update(_deltaTime: number): void {
    // Update powerup status
    if (this.powerup && performance.now() > this.powerupEndTime) {
      this.removePowerup();
    }
  }

  public fire(): void {
    const currentTime = performance.now();
    if (currentTime - this.lastFireTime < 1000 / this.getFireRate()) {
      return; // Fire rate limit not reached
    }

    // Create projectile entity
    const transform = this.entity.getComponent<TransformComponent>(ComponentType.TRANSFORM);
    if (!transform) return;

    // Get firing direction based on ship's rotation
    const direction: Vector2D = {
      x: Math.cos(transform.rotation),
      y: Math.sin(transform.rotation)
    };

    // Calculate projectile spawn position (slightly in front of the ship)
    const spawnOffset = 30; // pixels in front of ship
    const spawnPosition = {
      x: transform.position.x + direction.x * spawnOffset,
      y: transform.position.y + direction.y * spawnOffset
    };

    // TODO: Create projectile through EntityManager
    // For now, just log the projectile creation
    console.log('Firing projectile:', {
      position: spawnPosition,
      direction,
      speed: this.getProjectileSpeed(),
      damage: this.getDamage()
    });

    this.lastFireTime = currentTime;
  }

  public upgrade(stats: WeaponStats): void {
    this.damage = stats.damage;
    this.fireRate = stats.fireRate;
    this.projectileSpeed = stats.projectileSpeed;
  }

  public attachPowerup(powerup: WeaponPowerup): void {
    this.powerup = powerup;
    this.powerupEndTime = performance.now() + powerup.duration;
  }

  private removePowerup(): void {
    this.powerup = null;
  }

  // Getters that account for powerups
  public getDamage(): number {
    return this.damage * (this.powerup ? this.powerup.damageMod : 1);
  }

  public getFireRate(): number {
    return this.fireRate * (this.powerup ? this.powerup.fireRateMod : 1);
  }

  public getProjectileSpeed(): number {
    return this.projectileSpeed * (this.powerup ? this.powerup.projectileSpeedMod : 1);
  }
}
