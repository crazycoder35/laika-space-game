import { EventBus } from './EventBus';
import { ResourceManager } from './ResourceManager';
import {
  AssetMetadata,
  AssetLoadOptions,
  AssetCache,
  AssetLoadProgress,
  AssetLoadEvent
} from '../types/AssetTypes';

export class AssetManager {
  private readonly cache: Map<string, AssetCache> = new Map();
  private readonly loadQueue: Map<string, Promise<void>> = new Map();
  private readonly resourceManager: ResourceManager;
  private readonly eventBus: EventBus;
  private readonly maxCacheSize: number;
  private readonly cacheTimeout: number;
  private totalCacheSize: number = 0;

  constructor(config: {
    resourceManager: ResourceManager;
    eventBus: EventBus;
    maxCacheSize?: number;
    cacheTimeout?: number;
  }) {
    this.resourceManager = config.resourceManager;
    this.eventBus = config.eventBus;
    this.maxCacheSize = config.maxCacheSize || 100 * 1024 * 1024; // 100MB default
    this.cacheTimeout = config.cacheTimeout || 5 * 60 * 1000; // 5 minutes default

    // Start cache cleanup interval
    setInterval(() => this.cleanupCache(), this.cacheTimeout);
  }

  public async loadAsset(
    key: string,
    metadata: AssetMetadata,
    options: AssetLoadOptions = {}
  ): Promise<void> {
    // Check cache first
    if (this.cache.has(key)) {
      this.updateAssetAccess(key);
      return;
    }

    // Check if already loading
    const loadingPromise = this.loadQueue.get(key);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Start loading
    const promise = this.loadAssetInternal(key, metadata, options);
    this.loadQueue.set(key, promise);

    try {
      await promise;
      this.loadQueue.delete(key);
      this.eventBus.emit<AssetLoadEvent>({
        type: 'ASSET_LOADED',
        payload: { key, metadata }
      });
    } catch (error) {
      this.loadQueue.delete(key);
      this.eventBus.emit<AssetLoadEvent>({
        type: 'ASSET_LOAD_ERROR',
        payload: { key, error: error as Error }
      });
      throw error;
    }
  }

  private async loadAssetInternal(
    key: string,
    metadata: AssetMetadata,
    options: AssetLoadOptions
  ): Promise<void> {
    let data: any;
    const controller = new AbortController();
    const timeoutId = options.timeout
      ? setTimeout(() => controller.abort(), options.timeout)
      : undefined;

    try {
      const fetchOptions: RequestInit = {
        signal: controller.signal,
        credentials: options.credentials
      };

      const loadAsset = async (attempt: number = 1): Promise<any> => {
        try {
          switch (metadata.type) {
            case 'image':
              data = await this.resourceManager.loadImage(key, metadata.path);
              break;
            case 'audio':
              data = await this.resourceManager.loadAudio(key, metadata.path);
              break;
            case 'json':
              const jsonResponse = await fetch(metadata.path, fetchOptions);
              data = await jsonResponse.json();
              break;
            case 'text':
            case 'shader':
              const textResponse = await fetch(metadata.path, fetchOptions);
              data = await textResponse.text();
              break;
            case 'binary':
              const binaryResponse = await fetch(metadata.path, fetchOptions);
              data = await binaryResponse.arrayBuffer();
              break;
            default:
              throw new Error(`Unsupported asset type: ${metadata.type}`);
          }
          return data;
        } catch (error) {
          if (attempt < (options.retries || 0) + 1) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            return loadAsset(attempt + 1);
          }
          throw error;
        }
      };

      data = await loadAsset();

      // Add to cache
      await this.addToCache(key, data, metadata);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async addToCache(
    key: string,
    data: any,
    metadata: AssetMetadata
  ): Promise<void> {
    // Check if we need to free up space
    while (this.totalCacheSize + metadata.size > this.maxCacheSize) {
      if (!this.freeCacheSpace(metadata.size)) {
        throw new Error('Cannot allocate cache space for new asset');
      }
    }

    this.cache.set(key, {
      data,
      metadata,
      lastAccessed: Date.now(),
      refCount: 0
    });
    this.totalCacheSize += metadata.size;
  }

  private freeCacheSpace(requiredSize: number): boolean {
    // Sort cache entries by last accessed time
    const entries = Array.from(this.cache.entries())
      .filter(([_, cache]) => cache.refCount === 0)
      .sort(([_, a], [__, b]) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    for (const [key, cache] of entries) {
      this.cache.delete(key);
      freedSpace += cache.metadata.size;
      this.totalCacheSize -= cache.metadata.size;

      if (freedSpace >= requiredSize) {
        return true;
      }
    }

    return false;
  }

  public getAsset<T>(key: string): T | undefined {
    const cache = this.cache.get(key);
    if (cache) {
      this.updateAssetAccess(key);
      return cache.data as T;
    }
    return undefined;
  }

  public retainAsset(key: string): void {
    const cache = this.cache.get(key);
    if (cache) {
      cache.refCount++;
    }
  }

  public releaseAsset(key: string): void {
    const cache = this.cache.get(key);
    if (cache && cache.refCount > 0) {
      cache.refCount--;
    }
  }

  private updateAssetAccess(key: string): void {
    const cache = this.cache.get(key);
    if (cache) {
      cache.lastAccessed = Date.now();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cache] of this.cache.entries()) {
      if (
        cache.refCount === 0 &&
        now - cache.lastAccessed > this.cacheTimeout
      ) {
        this.totalCacheSize -= cache.metadata.size;
        this.cache.delete(key);
      }
    }
  }

  public preloadAssets(
    assets: { key: string; metadata: AssetMetadata; options?: AssetLoadOptions }[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const total = assets.length;
      let loaded = 0;
      let failed: string[] = [];
      let completed: string[] = [];

      const promises = assets.map(({ key, metadata, options }) =>
        this.loadAsset(key, metadata, options)
          .then(() => {
            loaded++;
            completed.push(key);
            this.emitProgress({ loaded, total, failed, completed });
          })
          .catch((error) => {
            failed.push(key);
            this.emitProgress({ loaded, total, failed, completed });
            console.error(`Failed to load asset ${key}:`, error);
          })
      );

      Promise.all(promises)
        .then(() => {
          if (failed.length === 0) {
            resolve();
          } else {
            reject(new Error(`Failed to load ${failed.length} assets`));
          }
        })
        .catch(reject);
    });
  }

  private emitProgress(progress: AssetLoadProgress): void {
    this.eventBus.emit({
      type: 'ASSET_LOAD_PROGRESS',
      payload: progress
    });
  }

  public getCacheStats(): {
    totalSize: number;
    itemCount: number;
    usage: number;
  } {
    return {
      totalSize: this.totalCacheSize,
      itemCount: this.cache.size,
      usage: (this.totalCacheSize / this.maxCacheSize) * 100
    };
  }

  public cleanup(): void {
    this.cache.clear();
    this.loadQueue.clear();
    this.totalCacheSize = 0;
  }
} 