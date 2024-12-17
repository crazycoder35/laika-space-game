export type AssetType = 'image' | 'audio' | 'json' | 'text' | 'binary' | 'shader';

export interface AssetMetadata {
  type: AssetType;
  path: string;
  size: number;
  lastModified?: number;
  dependencies?: string[];
  version?: string;
  tags?: string[];
}

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  failed: string[];
  completed: string[];
}

export interface AssetLoadOptions {
  priority?: number;
  timeout?: number;
  retries?: number;
  credentials?: RequestCredentials;
  lazy?: boolean;
}

export interface AssetCache {
  data: any;
  metadata: AssetMetadata;
  lastAccessed: number;
  refCount: number;
}

export interface AssetManifest {
  version: string;
  assets: Record<string, AssetEntry>;
  bundles: Record<string, AssetBundle>;
}

export interface AssetEntry {
  type: AssetType;
  path: string;
  size: number;
  hash?: string;
  dependencies?: string[];
  bundle?: string;
  tags?: string[];
  compression?: 'none' | 'gzip' | 'brotli';
  encoding?: 'utf8' | 'base64' | 'binary';
  metadata?: Record<string, any>;
}

export interface AssetBundle {
  name: string;
  assets: string[];
  priority: number;
  preload: boolean;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface AssetLoadEvent {
  type: 'ASSET_LOADED' | 'ASSET_LOAD_ERROR' | 'ASSET_LOAD_PROGRESS';
  payload: {
    key: string;
    metadata?: AssetEntry;
    error?: Error;
    progress?: {
      loaded: number;
      total: number;
      failed: string[];
      completed: string[];
    };
  };
}

export interface AssetConfig {
  basePath: string;
  manifestPath: string;
  maxCacheSize: number;
  cacheTimeout: number;
  defaultLoadOptions: {
    priority: number;
    timeout: number;
    retries: number;
    credentials: RequestCredentials;
  };
} 