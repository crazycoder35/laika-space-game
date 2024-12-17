import { GameEvent } from './SystemTypes';
import { PlayOptions } from '../systems/AudioSystem';

export interface AudioInitializedEvent extends GameEvent {
  type: 'AUDIO_INITIALIZED';
  payload: {
    state: AudioContextState;
  };
}

export interface SoundLoadedEvent extends GameEvent {
  type: 'SOUND_LOADED';
  payload: {
    name: string;
  };
}

export interface MusicLoadedEvent extends GameEvent {
  type: 'MUSIC_LOADED';
  payload: {
    name: string;
  };
}

export interface SoundPlayedEvent extends GameEvent {
  type: 'SOUND_PLAYED';
  payload: {
    name: string;
    id: string;
    options: PlayOptions;
  };
}

export interface SoundStoppedEvent extends GameEvent {
  type: 'SOUND_STOPPED';
  payload: {
    id: string;
  };
}

export interface AllSoundsStoppedEvent extends GameEvent {
  type: 'ALL_SOUNDS_STOPPED';
  payload: {
    timestamp: number;
  };
}

export interface MusicStartedEvent extends GameEvent {
  type: 'MUSIC_STARTED';
  payload: {
    name: string;
    options: PlayOptions;
  };
}

export interface MusicStoppedEvent extends GameEvent {
  type: 'MUSIC_STOPPED';
  payload: {
    timestamp: number;
  };
}

export interface VolumeChangedEvent extends GameEvent {
  type: 'VOLUME_CHANGED';
  payload: {
    type: 'master' | 'music' | 'sfx';
    volume: number;
  };
}

export interface MusicCrossfadeEvent extends GameEvent {
  type: 'MUSIC_CROSSFADE';
  payload: {
    name: string;
    duration: number;
  };
}

export type AudioEvent =
  | AudioInitializedEvent
  | SoundLoadedEvent
  | MusicLoadedEvent
  | SoundPlayedEvent
  | SoundStoppedEvent
  | AllSoundsStoppedEvent
  | MusicStartedEvent
  | MusicStoppedEvent
  | VolumeChangedEvent
  | MusicCrossfadeEvent;
