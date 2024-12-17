import { EventBus } from './EventBus';
import { DataStore } from './DataStore';
import { GameState } from '../types/SystemTypes';
import { SaveData, SaveMetadata, SaveConfig, SaveEventType } from '../types/SaveTypes';

export default class SaveManager {
  private readonly storageKey: string = 'laika_space_game_saves';
  private readonly config: SaveConfig = {
    maxSlots: 10,
    autoSaveInterval: 5 * 60 * 1000, // 5 minutes
    autoSaveSlot: 0,
    saveVersion: '1.0.0',
    maxSaveAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    encryptionKey: 'laika_game_' // Base encryption key
  };
  private saveInProgress: boolean = false;
  private loadInProgress: boolean = false;

  constructor(
    private readonly eventBus: EventBus,
    private readonly dataStore: DataStore
  ) {
    // Start periodic cleanup of old saves
    this.scheduleAutoCleanup();
  }

  private validateSlot(slot: number): void {
    if (slot < 0 || slot >= this.config.maxSlots) {
      throw new Error(`Invalid save slot: ${slot}. Slots must be between 0 and ${this.config.maxSlots - 1}`);
    }
  }

  private async checkStorageQuota(dataSize: number): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { usage, quota } = await navigator.storage.estimate();
      if (usage && quota && (usage + dataSize > quota)) {
        throw new Error('QUOTA_EXCEEDED');
      }
    }
  }

  private scheduleAutoCleanup(): void {
    setInterval(() => this.cleanupOldSaves(), 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private async cleanupOldSaves(): Promise<void> {
    try {
      const saves = await this.loadAllSaves();
      const now = Date.now();
      let cleaned = false;

      for (const [slotStr, save] of Object.entries(saves)) {
        const slot = parseInt(slotStr, 10);
        if (now - save.timestamp > this.config.maxSaveAge) {
          delete saves[slot];
          cleaned = true;
        }
      }

      if (cleaned) {
        localStorage.setItem(this.storageKey, JSON.stringify(saves));
        this.emitEvent('SAVES_CLEANED', { timestamp: now });
      }
    } catch (error) {
      console.error('Auto-cleanup failed:', error);
    }
  }

  private async compressData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    // In test environment, skip compression
    if (process.env.NODE_ENV === 'test') {
      return btoa(jsonString);
    }
    // Use browser's built-in compression
    const encoder = new TextEncoder();
    const blob = new Blob([encoder.encode(jsonString)]);
    const compressed = (window as any).CompressionStream 
      ? await new Response(
          blob.stream().pipeThrough(new (window as any).CompressionStream('gzip'))
        ).blob()
      : blob;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(compressed);
    });
  }

  private async decompressData(compressed: string): Promise<any> {
    // In test environment, skip decompression
    if (process.env.NODE_ENV === 'test') {
      return JSON.parse(atob(compressed));
    }
    // Use browser's built-in decompression
    const response = await fetch(compressed);
    const blob = await response.blob();
    const decompressed = (window as any).DecompressionStream
      ? await new Response(
          blob.stream().pipeThrough(new (window as any).DecompressionStream('gzip'))
        ).blob()
      : blob;
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(decompressed);
    });
    return JSON.parse(text);
  }

  private generateChecksum(data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private encrypt(data: string, slot: number): string {
    // Simple XOR encryption with slot-specific key
    const key = this.config.encryptionKey + slot;
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
  }

  private decrypt(encrypted: string, slot: number): string {
    // Simple XOR decryption with slot-specific key
    const key = this.config.encryptionKey + slot;
    const data = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  }

  private getStorageKeyForSlot(slot: number): string {
    return `${this.storageKey}_${slot}`;
  }

  private async loadAllSaves(): Promise<Record<number, SaveData>> {
    const saves: Record<number, SaveData> = {};
    for (let slot = 0; slot < this.config.maxSlots; slot++) {
      const key = this.getStorageKeyForSlot(slot);
      const encrypted = localStorage.getItem(key);
      if (encrypted) {
        try {
          const decrypted = this.decrypt(encrypted, slot);
          const saveData = await this.decompressData(decrypted);
          saves[slot] = saveData;
        } catch (error) {
          console.error(`Failed to load save in slot ${slot}:`, error);
        }
      }
    }
    return saves;
  }

  public async save(slot: number, metadata?: Partial<SaveMetadata>): Promise<void> {
    if (this.saveInProgress) {
      throw new Error('Save already in progress');
    }

    try {
      this.saveInProgress = true;
      this.validateSlot(slot);
      this.emitEvent('SAVE_STARTED', { slot });
      
      const timestamp = Date.now();
      const state = this.dataStore.getState();
      const statistics = this.dataStore.getStatistics();
      
      const saveData: SaveData = {
        version: this.config.saveVersion,
        timestamp,
        gameState: state,
        statistics,
        metadata: {
          slot,
          name: metadata?.name || `Save ${slot}`,
          playtime: metadata?.playtime || 0,
          level: state.level.currentLevel,
          screenshot: metadata?.screenshot,
          timestamp
        },
        checksum: '' // Will be set after data is prepared
      };

      // Generate checksum before compression and encryption
      saveData.checksum = this.generateChecksum({
        version: saveData.version,
        timestamp: saveData.timestamp,
        gameState: saveData.gameState,
        statistics: saveData.statistics,
        metadata: saveData.metadata
      });

      // Compress, encrypt, and store
      const compressed = await this.compressData(saveData);
      const encrypted = this.encrypt(compressed, slot);

      // Check storage quota before saving
      const dataSize = new Blob([encrypted]).size;
      await this.checkStorageQuota(dataSize);

      localStorage.setItem(this.getStorageKeyForSlot(slot), encrypted);

      this.emitEvent('SAVE_COMPLETED', { 
        slot,
        timestamp,
        metadata: saveData.metadata
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'QUOTA_EXCEEDED') {
        this.emitEvent('SAVE_QUOTA_EXCEEDED', {
          slot,
          requiredSpace: new Blob([JSON.stringify({})]).size,
          availableSpace: (await navigator.storage.estimate()).quota || 0
        });
      } else {
        this.emitEvent('SAVE_ERROR', { 
          slot,
          error: errorMessage
        });
      }
      throw error;
    } finally {
      this.saveInProgress = false;
    }
  }

  public async load(slot: number): Promise<GameState | null> {
    if (this.loadInProgress) {
      throw new Error('Load already in progress');
    }

    try {
      this.loadInProgress = true;
      this.validateSlot(slot);
      this.emitEvent('LOAD_STARTED', { slot });
      
      const encrypted = localStorage.getItem(this.getStorageKeyForSlot(slot));
      if (!encrypted) {
        this.emitEvent('LOAD_ERROR', {
          slot,
          error: `No save data found in slot ${slot}`
        });
        return null;
      }

      // Decrypt and decompress
      const decrypted = this.decrypt(encrypted, slot);
      const saveData = await this.decompressData(decrypted);

      // Verify checksum
      const calculatedChecksum = this.generateChecksum({
        version: saveData.version,
        timestamp: saveData.timestamp,
        gameState: saveData.gameState,
        statistics: saveData.statistics,
        metadata: saveData.metadata
      });

      if (calculatedChecksum !== saveData.checksum) {
        throw new Error('Save data integrity check failed');
      }

      // Load the state
      this.dataStore.dispatch({
        type: 'LOAD_STATE',
        payload: {
          state: saveData.gameState,
          statistics: saveData.statistics
        }
      });

      this.emitEvent('LOAD_COMPLETED', {
        slot,
        timestamp: saveData.timestamp,
        metadata: saveData.metadata
      });

      return saveData.gameState;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent('LOAD_ERROR', {
        slot,
        error: errorMessage
      });
      throw error;
    } finally {
      this.loadInProgress = false;
    }
  }

  public async listSaves(): Promise<SaveData[]> {
    const saves = await this.loadAllSaves();
    return Object.values(saves)
      .filter(save => save !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public async deleteSave(slot: number): Promise<void> {
    this.validateSlot(slot);
    localStorage.removeItem(this.getStorageKeyForSlot(slot));
    this.emitEvent('SAVE_DELETED', { slot });
  }

  private emitEvent(type: SaveEventType, data: any): void {
    this.eventBus.emit({
      type,
      payload: data
    });
  }

  public setConfig(config: Partial<SaveConfig>): void {
    Object.assign(this.config, config);
  }

  public getConfig(): SaveConfig {
    return { ...this.config };
  }
}
