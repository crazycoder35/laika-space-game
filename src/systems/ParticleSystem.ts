import { System, SystemType } from '../types/SystemTypes';
import { Vector2D } from '../core/components/TransformComponent';
import { ParticleSystemConfig } from '../types/SystemInterfaces';

export interface ParticleConfig {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  color: string;
  size: number;
  life: number;
  alpha: number;
  fadeRate: number;
  shrinkRate: number;
}

export interface EmitterConfig {
  position: Vector2D;
  spread: number;
  rate: number;
  maxParticles: number;
  particleConfig: Omit<ParticleConfig, 'position'>;
}

class Particle {
  public position: Vector2D;
  public velocity: Vector2D;
  public acceleration: Vector2D;
  public color: string;
  public size: number;
  public life: number;
  public alpha: number;
  public fadeRate: number;
  public shrinkRate: number;
  public isDead: boolean = false;

  constructor(config: ParticleConfig) {
    this.position = { ...config.position };
    this.velocity = { ...config.velocity };
    this.acceleration = { ...config.acceleration };
    this.color = config.color;
    this.size = config.size;
    this.life = config.life;
    this.alpha = config.alpha;
    this.fadeRate = config.fadeRate;
    this.shrinkRate = config.shrinkRate;
  }

  public update(deltaTime: number): void {
    // Update physics
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Update appearance
    this.alpha -= this.fadeRate * deltaTime;
    this.size -= this.shrinkRate * deltaTime;
    this.life -= deltaTime;

    // Check if particle should die
    if (this.life <= 0 || this.alpha <= 0 || this.size <= 0) {
      this.isDead = true;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ParticleEmitter {
  private particles: Particle[] = [];
  private timer: number = 0;
  private active: boolean = true;

  constructor(private config: EmitterConfig) {}

  public update(deltaTime: number): void {
    if (this.active) {
      this.timer += deltaTime;
      const particlesToEmit = Math.floor(this.timer * this.config.rate);
      this.timer -= particlesToEmit / this.config.rate;

      for (let i = 0; i < particlesToEmit; i++) {
        if (this.particles.length < this.config.maxParticles) {
          this.emitParticle();
        }
      }
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);

      if (particle.isDead) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => particle.render(ctx));
  }

  private emitParticle(): void {
    const angle = (Math.random() - 0.5) * this.config.spread;
    const speed = Math.sqrt(
      this.config.particleConfig.velocity.x ** 2 +
      this.config.particleConfig.velocity.y ** 2
    );

    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };

    const particle = new Particle({
      position: { ...this.config.position },
      velocity,
      acceleration: { ...this.config.particleConfig.acceleration },
      color: this.config.particleConfig.color,
      size: this.config.particleConfig.size,
      life: this.config.particleConfig.life,
      alpha: this.config.particleConfig.alpha,
      fadeRate: this.config.particleConfig.fadeRate,
      shrinkRate: this.config.particleConfig.shrinkRate
    });

    this.particles.push(particle);
  }

  public setPosition(position: Vector2D): void {
    this.config.position = position;
  }

  public start(): void {
    this.active = true;
  }

  public stop(): void {
    this.active = false;
  }

  public clear(): void {
    this.particles = [];
  }

  public getParticleCount(): number {
    return this.particles.length;
  }
}

export class ParticleSystem implements System {
  public readonly priority = 5; // After render system
  public readonly dependencies = [SystemType.RENDER];

  private emitters: Map<string, ParticleEmitter>;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(config: ParticleSystemConfig) {
    this.emitters = new Map();
    this.ctx = config.canvas.getContext('2d')!;
  }

  public async initialize(): Promise<void> {
    // Initialization if needed
  }

  public update(deltaTime: number): void {
    this.emitters.forEach(emitter => emitter.update(deltaTime));
  }

  public render(): void {
    this.emitters.forEach(emitter => emitter.render(this.ctx));
  }

  public cleanup(): void {
    this.emitters.clear();
  }

  public createEmitter(id: string, config: EmitterConfig): void {
    if (this.emitters.has(id)) {
      throw new Error(`Emitter with id ${id} already exists`);
    }
    this.emitters.set(id, new ParticleEmitter(config));
  }

  public removeEmitter(id: string): void {
    this.emitters.delete(id);
  }

  public getEmitter(id: string): ParticleEmitter | undefined {
    return this.emitters.get(id);
  }

  public updateEmitterPosition(id: string, position: Vector2D): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.setPosition(position);
    }
  }

  public startEmitter(id: string): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.start();
    }
  }

  public stopEmitter(id: string): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.stop();
    }
  }

  public clearEmitter(id: string): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.clear();
    }
  }

  public getEmitterCount(): number {
    return this.emitters.size;
  }

  public getTotalParticleCount(): number {
    let count = 0;
    this.emitters.forEach(emitter => {
      count += emitter.getParticleCount();
    });
    return count;
  }
}
