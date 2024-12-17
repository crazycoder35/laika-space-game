import { System, SystemType } from '../types/SystemTypes';
import { DataStore } from '../core/DataStore';
import { EventBus } from '../core/EventBus';
import { SaveSystemConfig } from '../types/SystemInterfaces';

export interface AutoSaveConfig {
  interval: number;  // Time in milliseconds between auto-saves
  maxSlots: number;  // Maximum number of auto-save slots to maintain
  triggerEvents: string[];  // Events that should trigger an auto-save
}

export class AutoSaveSystem implements System {
  public readonly priority = 10;  // Low priority, run after other systems
  public readonly dependencies: SystemType[] = [];

  private timer: number = 0;
  private currentSlot: number = 0;
  private enabled: boolean = true;
  private readonly defaultConfig: AutoSaveConfig = {
    interval: 5 * 60 * 1000,  // 5 minutes
    maxSlots: 3,
    triggerEvents: [
      'LEVEL_COMPLETED',
      'CHECKPOINT_REACHED',
      'ITEM_PURCHASED',
      'UPGRADE_APPLIED'
    ]
  };
  private config: AutoSaveConfig;
  private readonly dataStore: DataStore;
  private readonly eventBus: EventBus;

  constructor(config: SaveSystemConfig) {
    this.dataStore = config.dataStore;
    this.eventBus = config.eventBus;
    this.config = { ...this.defaultConfig };
    this.setupEventListeners();
  }

  public async initialize(): Promise<void> {
    // Load last used slot from localStorage
    const lastSlot = localStorage.getItem('lastAutoSaveSlot');
    if (lastSlot) {
      this.currentSlot = parseInt(lastSlot, 10);
    }
  }

  public update(deltaTime: number): void {
    if (!this.enabled) return;

    this.timer += deltaTime * 1000;  // Convert to milliseconds
    if (this.timer >= this.config.interval) {
      this.performAutoSave();
      this.timer = 0;
    }
  }

  public cleanup(): void {
    // Clean up event listeners
    this.config.triggerEvents.forEach(eventType => {
      // Remove event listeners if needed
    });
  }

  private setupEventListeners(): void {
    // Listen for events that should trigger auto-save
    this.config.triggerEvents.forEach(eventType => {
      this.eventBus.on(eventType, () => {
        if (this.enabled) {
          this.performAutoSave();
        }
      });
    });

    // Listen for state changes that might affect auto-save
    this.eventBus.on('STATE_CHANGE', (event: any) => {
      const { action } = event.payload;
      if (action.type === 'UPDATE_LEVEL_STATUS') {
        // Disable auto-save during cutscenes or loading
        this.enabled = action.payload.status === 'playing';
      }
    });
  }

  private async performAutoSave(): Promise<void> {
    try {
      // Calculate next slot in rotation
      this.currentSlot = (this.currentSlot + 1) % this.config.maxSlots;
      
      // Save the game
      await this.dataStore.saveGame(this.getAutoSaveSlot());
      
      // Store last used slot
      localStorage.setItem('lastAutoSaveSlot', this.currentSlot.toString());

      // Emit auto-save event
      this.eventBus.emit({
        type: 'AUTO_SAVE',
        payload: {
          slot: this.getAutoSaveSlot(),
          timestamp: Date.now()
        }
      });

      // Clean up old auto-saves if needed
      this.cleanupOldAutoSaves();
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.eventBus.emit({
        type: 'SAVE_ERROR',
        payload: {
          slot: this.getAutoSaveSlot(),
          error: (error as Error).message
        }
      });
    }
  }

  private getAutoSaveSlot(): number {
    // Auto-save slots start from 1000 to distinguish from manual saves
    return 1000 + this.currentSlot;
  }

  private async cleanupOldAutoSaves(): Promise<void> {
    const saves = this.dataStore.listSaves();
    const autoSaves = saves.filter(save => save.slot >= 1000);
    
    // Sort by timestamp, newest first
    autoSaves.sort((a, b) => b.timestamp - a.timestamp);

    // Remove excess auto-saves
    for (let i = this.config.maxSlots; i < autoSaves.length; i++) {
      try {
        await this.dataStore.deleteSave(autoSaves[i].slot);
      } catch (error) {
        console.warn('Failed to cleanup auto-save:', error);
      }
    }
  }

  // Configuration methods
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.timer = 0;
    }
  }

  public setInterval(interval: number): void {
    this.config.interval = interval;
    this.timer = 0;  // Reset timer when interval changes
  }

  public setMaxSlots(maxSlots: number): void {
    this.config.maxSlots = maxSlots;
    // Cleanup excess saves if needed
    this.cleanupOldAutoSaves();
  }

  public addTriggerEvent(eventType: string): void {
    if (!this.config.triggerEvents.includes(eventType)) {
      this.config.triggerEvents.push(eventType);
      // Setup listener for new event
      this.eventBus.on(eventType, () => {
        if (this.enabled) {
          this.performAutoSave();
        }
      });
    }
  }

  public removeTriggerEvent(eventType: string): void {
    const index = this.config.triggerEvents.indexOf(eventType);
    if (index !== -1) {
      this.config.triggerEvents.splice(index, 1);
      // Remove listener if needed
    }
  }

  public getConfig(): AutoSaveConfig {
    return { ...this.config };
  }
}
