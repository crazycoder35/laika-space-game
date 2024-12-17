import { System, SystemType } from '../types/SystemTypes';
import SaveManager from '../core/SaveManager'; // Corrected import
import { EventBus } from '../core/EventBus';
import { DataStore } from '../core/DataStore';

export class SaveSystem implements System {
  public readonly priority = 10; // Low priority since it's not time-critical
  public readonly dependencies: SystemType[] = [];
  
  private saveManager: SaveManager;
  private autoSaveInterval: number = 5 * 60 * 1000; // 5 minutes
  private lastAutoSave: number = Date.now();

  constructor(eventBus: EventBus, dataStore: DataStore) {
    this.saveManager = new SaveManager(eventBus, dataStore);
  }

  public async initialize(): Promise<void> {
    // Load the last auto-save if it exists
    const saves = await this.saveManager.listSaves();
    const autoSave = saves.find(save => save.slot === 0);
    
    if (autoSave) {
      await this.saveManager.load(0);
    }
  }

  public update(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Check if it's time for auto-save
    if (currentTime - this.lastAutoSave >= this.autoSaveInterval) {
      this.autoSave();
      this.lastAutoSave = currentTime;
    }
  }

  public cleanup(): void {
    // Perform final auto-save before cleanup
    this.autoSave();
  }

  public async save(slot: number): Promise<void> {
    await this.saveManager.save(slot);
  }

  public async load(slot: number): Promise<void> {
    await this.saveManager.load(slot);
  }

  public async deleteSave(slot: number): Promise<void> {
    await this.saveManager.deleteSave(slot);
  }

  public async listSaves(): Promise<Array<{ slot: number; timestamp: number }>> {
    return this.saveManager.listSaves();
  }

  private async autoSave(): Promise<void> {
    try {
      await this.saveManager.save(0); // Use slot 0 for auto-saves
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  public setAutoSaveInterval(minutes: number): void {
    this.autoSaveInterval = minutes * 60 * 1000;
  }
}
