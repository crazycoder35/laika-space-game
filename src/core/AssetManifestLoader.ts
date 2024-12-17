import { AssetManifest, AssetEntry, AssetBundle, AssetConfig } from '../types/AssetTypes';
import { EventBus } from './EventBus';

export class AssetManifestLoader {
  private manifest?: AssetManifest;
  private readonly config: AssetConfig;
  private readonly eventBus: EventBus;
  private loadedBundles: Set<string> = new Set();

  constructor(config: AssetConfig, eventBus: EventBus) {
    this.config = config;
    this.eventBus = eventBus;
  }

  public async loadManifest(): Promise<AssetManifest> {
    try {
      const response = await fetch(this.config.manifestPath);
      const manifest = await response.json() as AssetManifest;
      
      // Validate manifest
      this.validateManifest(manifest);
      
      // Store validated manifest
      this.manifest = manifest;
      
      // Emit manifest loaded event
      this.eventBus.emit({
        type: 'MANIFEST_LOADED',
        payload: {
          version: manifest.version,
          assetCount: Object.keys(manifest.assets).length,
          bundleCount: Object.keys(manifest.bundles).length
        }
      });

      return manifest;
    } catch (error) {
      this.eventBus.emit({
        type: 'MANIFEST_LOAD_ERROR',
        payload: { error }
      });
      throw error;
    }
  }

  private validateManifest(manifest: AssetManifest): void {
    if (!manifest.version) {
      throw new Error('Manifest missing version');
    }
    if (!manifest.assets || typeof manifest.assets !== 'object') {
      throw new Error('Manifest missing assets object');
    }
    if (!manifest.bundles || typeof manifest.bundles !== 'object') {
      throw new Error('Manifest missing bundles object');
    }

    // Validate each asset entry
    for (const [key, asset] of Object.entries(manifest.assets)) {
      this.validateAssetEntry(key, asset);
    }

    // Validate each bundle
    for (const [key, bundle] of Object.entries(manifest.bundles)) {
      this.validateBundle(key, bundle);
    }

    // Check for circular dependencies
    this.checkCircularDependencies(manifest);
  }

  private validateAssetEntry(key: string, asset: AssetEntry): void {
    if (!asset.type) {
      throw new Error(`Asset ${key} missing type`);
    }
    if (!asset.path) {
      throw new Error(`Asset ${key} missing path`);
    }
    if (typeof asset.size !== 'number') {
      throw new Error(`Asset ${key} missing or invalid size`);
    }
  }

  private validateBundle(key: string, bundle: AssetBundle): void {
    if (!bundle.name) {
      throw new Error(`Bundle ${key} missing name`);
    }
    if (!Array.isArray(bundle.assets)) {
      throw new Error(`Bundle ${key} assets must be an array`);
    }
    if (typeof bundle.priority !== 'number') {
      throw new Error(`Bundle ${key} missing or invalid priority`);
    }
    if (typeof bundle.preload !== 'boolean') {
      throw new Error(`Bundle ${key} missing or invalid preload flag`);
    }
  }

  private checkCircularDependencies(manifest: AssetManifest): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkDependencies = (bundleKey: string): void => {
      if (recursionStack.has(bundleKey)) {
        throw new Error(`Circular dependency detected in bundle: ${bundleKey}`);
      }
      if (visited.has(bundleKey)) {
        return;
      }

      visited.add(bundleKey);
      recursionStack.add(bundleKey);

      const bundle = manifest.bundles[bundleKey];
      if (bundle.dependencies) {
        for (const dep of bundle.dependencies) {
          checkDependencies(dep);
        }
      }

      recursionStack.delete(bundleKey);
    };

    for (const bundleKey of Object.keys(manifest.bundles)) {
      checkDependencies(bundleKey);
    }
  }

  public getAssetEntry(key: string): AssetEntry | undefined {
    return this.manifest?.assets[key];
  }

  public getBundle(name: string): AssetBundle | undefined {
    return this.manifest?.bundles[name];
  }

  public getBundleAssets(name: string): AssetEntry[] {
    const bundle = this.getBundle(name);
    if (!bundle) {
      return [];
    }

    return bundle.assets
      .map(key => this.getAssetEntry(key))
      .filter((asset): asset is AssetEntry => asset !== undefined);
  }

  public getPreloadBundles(): AssetBundle[] {
    if (!this.manifest) {
      return [];
    }

    return Object.values(this.manifest.bundles)
      .filter(bundle => bundle.preload)
      .sort((a, b) => b.priority - a.priority);
  }

  public markBundleLoaded(name: string): void {
    this.loadedBundles.add(name);
  }

  public isBundleLoaded(name: string): boolean {
    return this.loadedBundles.has(name);
  }

  public getLoadedBundles(): string[] {
    return Array.from(this.loadedBundles);
  }

  public getAssetPath(key: string): string {
    const asset = this.getAssetEntry(key);
    if (!asset) {
      throw new Error(`Asset not found: ${key}`);
    }
    return `${this.config.basePath}/${asset.path}`;
  }

  public cleanup(): void {
    this.manifest = undefined;
    this.loadedBundles.clear();
  }
} 