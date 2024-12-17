import { GameState } from './SystemTypes';

export interface GameStatistics {
  totalPlayTime: number;
  highScore: number;
  meteorsDestroyed: number;
  powerupsCollected: number;
  distanceTraveled: number;
  levelsCompleted: number;
  totalDeaths: number;
  accuracyRate: number;
}

export interface SaveData {
  version: string;
  timestamp: number;
  gameState: GameState;
  statistics: GameStatistics;
  metadata: SaveMetadata;
  checksum: string;
}

export interface SaveMetadata {
  slot: number;
  name: string;
  playtime: number;
  level: number;
  screenshot?: string;
  timestamp: number;
}

export interface SaveEvent {
  type: SaveEventType;
  payload: SaveEventPayload;
}

export type SaveEventType = 
  | 'SAVE_STARTED'
  | 'SAVE_COMPLETED'
  | 'SAVE_ERROR'
  | 'LOAD_STARTED'
  | 'LOAD_COMPLETED'
  | 'LOAD_ERROR'
  | 'AUTOSAVE_STARTED'
  | 'AUTOSAVE_COMPLETED'
  | 'AUTOSAVE_ERROR'
  | 'SAVE_QUOTA_EXCEEDED'
  | 'SAVE_MIGRATION'
  | 'SAVE_CORRUPTED'
  | 'SAVE_DELETED'
  | 'DELETE_ERROR'
  | 'SAVES_CLEANED';

export interface SaveEventPayload {
  slot: number;
  timestamp?: number;
  error?: string;
  metadata?: SaveMetadata;
  fromVersion?: string;
  toVersion?: string;
  requiredSpace?: number;
  availableSpace?: number;
}

export interface SaveConfig {
  maxSlots: number;
  autoSaveInterval: number;
  autoSaveSlot: number;
  saveVersion: string;
  maxSaveAge: number;
  encryptionKey: string;
}
