import { GameEvent } from '../types/SystemTypes';

type EventHandler<T extends GameEvent> = (event: T) => void;

export class EventBus {
  private handlers: Map<string, Set<EventHandler<any>>>;

  constructor() {
    this.handlers = new Map();
  }

  public emit<T extends GameEvent>(event: T): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  public on<T extends GameEvent>(type: T['type'], handler: EventHandler<T>): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  public off<T extends GameEvent>(type: T['type'], handler: EventHandler<T>): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  public clear(): void {
    this.handlers.clear();
  }
}
