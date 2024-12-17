import { Scene } from './Scene';
import { Game } from '../Game';

export abstract class BaseScene implements Scene {
  protected constructor(protected readonly game: Game) {}

  public abstract initialize(): Promise<void>;
  public abstract update(deltaTime: number): void;
  public abstract cleanup(): void;
}
