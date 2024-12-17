export interface Poolable {
  reset(): void;
  isActive(): boolean;
  setActive(active: boolean): void;
}

export class ObjectPool<T extends Poolable> {
  private readonly available: T[] = [];
  private readonly active: Set<T> = new Set();
  private readonly factory: () => T;
  private readonly maxSize: number;

  constructor(factory: () => T, initialSize: number = 100, maxSize: number = 1000) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.prewarm(initialSize);
  }

  public acquire(): T | null {
    // Try to get an object from the available pool
    let object = this.available.pop();

    // If no object is available and we haven't reached max size, create a new one
    if (!object && this.active.size < this.maxSize) {
      object = this.factory();
    }

    // If we got an object (either from pool or newly created), activate it
    if (object) {
      object.reset();
      object.setActive(true);
      this.active.add(object);
      return object;
    }

    return null;
  }

  public release(object: T): void {
    if (!this.active.has(object)) return;

    object.setActive(false);
    this.active.delete(object);
    this.available.push(object);
  }

  public releaseAll(): void {
    this.active.forEach(object => {
      object.setActive(false);
      this.available.push(object);
    });
    this.active.clear();
  }

  public prewarm(count: number): void {
    const toCreate = Math.min(count, this.maxSize);
    for (let i = 0; i < toCreate; i++) {
      const object = this.factory();
      object.setActive(false);
      this.available.push(object);
    }
  }

  public getActiveCount(): number {
    return this.active.size;
  }

  public getAvailableCount(): number {
    return this.available.length;
  }

  public getTotalCount(): number {
    return this.active.size + this.available.length;
  }

  public clear(): void {
    this.active.clear();
    this.available.length = 0;
  }
} 