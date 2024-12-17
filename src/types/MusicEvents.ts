import { GameEvent } from './SystemTypes';

export interface MusicTrackChangeEvent extends GameEvent {
  type: 'MUSIC_TRACK_CHANGE';
  payload: {
    previousTrack?: string;
    newTrack: string;
    immediate: boolean;
  };
}

export interface MusicTrackStopEvent extends GameEvent {
  type: 'MUSIC_TRACK_STOP';
  payload: {
    track: string;
    fadeOutDuration?: number;
  };
}

export interface MusicTrackLoadedEvent extends GameEvent {
  type: 'MUSIC_TRACK_LOADED';
  payload: {
    key: string;
    url: string;
  };
}

export interface PlaylistStartEvent extends GameEvent {
  type: 'PLAYLIST_START';
  payload: {
    tracks: string[];
    shuffled: boolean;
  };
}

export interface PlaylistStopEvent extends GameEvent {
  type: 'PLAYLIST_STOP';
  payload: {
    currentTrack?: string;
    remainingTracks: number;
    remainingTrackList: string[];
  };
}

export interface PlaylistTrackChangeEvent extends GameEvent {
  type: 'PLAYLIST_TRACK_CHANGE';
  payload: {
    previousTrack?: string;
    nextTrack: string;
    remainingTracks: number;
  };
}

export interface MusicVolumeChangeEvent extends GameEvent {
  type: 'MUSIC_VOLUME_CHANGE';
  payload: {
    track: string;
    volume: number;
  };
}

export type MusicEvent =
  | MusicTrackChangeEvent
  | MusicTrackStopEvent
  | MusicTrackLoadedEvent
  | PlaylistStartEvent
  | PlaylistStopEvent
  | PlaylistTrackChangeEvent
  | MusicVolumeChangeEvent;
