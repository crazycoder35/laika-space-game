import { GameEvent } from './SystemTypes';
import { GameAction } from './StateActions';
import { GameState } from './SystemTypes';

export interface StateChangeEvent extends GameEvent {
  type: 'STATE_CHANGE';
  payload: {
    action: GameAction;
    previousState: GameState;
    currentState: GameState;
  };
}

export interface GameSavedEvent extends GameEvent {
  type: 'GAME_SAVED';
  payload: {
    slot: number;
    timestamp: number;
  };
}

export interface GameLoadedEvent extends GameEvent {
  type: 'GAME_LOADED';
  payload: {
    slot: number;
  };
}

export interface SaveDeletedEvent extends GameEvent {
  type: 'SAVE_DELETED';
  payload: {
    slot: number;
  };
}

export interface SaveErrorEvent extends GameEvent {
  type: 'SAVE_ERROR';
  payload: {
    slot: number;
    error: string;
  };
}

export interface LoadErrorEvent extends GameEvent {
  type: 'LOAD_ERROR';
  payload: {
    slot: number;
    error: string;
  };
}

export interface DeleteErrorEvent extends GameEvent {
  type: 'DELETE_ERROR';
  payload: {
    slot: number;
    error: string;
  };
}

export interface SaveMigrationEvent extends GameEvent {
  type: 'SAVE_MIGRATION';
  payload: {
    fromVersion: string;
    toVersion: string;
    slot: number;
  };
}

export interface SaveCorruptedEvent extends GameEvent {
  type: 'SAVE_CORRUPTED';
  payload: {
    slot: number;
    error: string;
  };
}

export interface SaveQuotaExceededEvent extends GameEvent {
  type: 'SAVE_QUOTA_EXCEEDED';
  payload: {
    slot: number;
    requiredSpace: number;
    availableSpace: number;
  };
}

export interface AutoSaveEvent extends GameEvent {
  type: 'AUTO_SAVE';
  payload: {
    slot: number;
    timestamp: number;
  };
}

export type StateEvent =
  | StateChangeEvent
  | GameSavedEvent
  | GameLoadedEvent
  | SaveDeletedEvent
  | SaveErrorEvent
  | LoadErrorEvent
  | DeleteErrorEvent
  | SaveMigrationEvent
  | SaveCorruptedEvent
  | SaveQuotaExceededEvent
  | AutoSaveEvent;
