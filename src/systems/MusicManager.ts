import { System, SystemType } from '../types/SystemTypes';
import { AudioSystem } from './AudioSystem';
import { EventBus } from '../core/EventBus';
import { MusicSystemConfig } from '../types/SystemInterfaces';
import {
  MusicTrackChangeEvent,
  MusicTrackStopEvent,
  MusicTrackLoadedEvent,
  PlaylistStartEvent,
  PlaylistStopEvent,
  PlaylistTrackChangeEvent,
  MusicVolumeChangeEvent
} from '../types/MusicEvents';

export interface MusicTrackConfig {
  key: string;
  volume?: number;
  loop?: boolean;
  crossfadeDuration?: number;
}

export class MusicManager implements System {
  public readonly priority = 8;
  public readonly dependencies = [SystemType.AUDIO];

  private readonly tracks: Map<string, MusicTrackConfig>;
  private currentTrackKey?: string;
  private nextTrackKey?: string;
  private crossfadeTimer?: number;
  private readonly audioSystem: AudioSystem;
  private readonly eventBus: EventBus;

  constructor(config: MusicSystemConfig) {
    this.audioSystem = config.audioSystem;
    this.eventBus = config.eventBus;
    this.tracks = new Map();
  }

  public async initialize(): Promise<void> {
    // Initialize music system
  }

  public update(_deltaTime: number): void {
    // Update music system state
  }

  public cleanup(): void {
    // Stop all music and clean up resources
    this.stopTrack();
    this.tracks.clear();
  }

  public async loadTrack(config: MusicTrackConfig, url: string): Promise<void> {
    await this.audioSystem.loadMusic(config.key, url);
    this.tracks.set(config.key, {
      ...config,
      volume: config.volume ?? 1,
      loop: config.loop ?? true,
      crossfadeDuration: config.crossfadeDuration ?? 2.0
    });

    const event: MusicTrackLoadedEvent = {
      type: 'MUSIC_TRACK_LOADED',
      payload: { key: config.key, url }
    };
    this.eventBus.emit(event);
  }

  public playTrack(key: string, immediate: boolean = false): void {
    const track = this.tracks.get(key);
    if (!track) {
      console.warn(`Music track not found: ${key}`);
      return;
    }

    // If no track is playing, start immediately
    if (!this.currentTrackKey) {
      this.startTrack(key);
      return;
    }

    // Handle track transition
    if (immediate) {
      this.stopCurrentTrack();
      this.startTrack(key);
    } else {
      const currentTrack = this.tracks.get(this.currentTrackKey);
      const crossfadeDuration = Math.max(
        track.crossfadeDuration!,
        currentTrack?.crossfadeDuration ?? 2.0
      );
      
      this.audioSystem.crossfadeMusic(track.key, crossfadeDuration);
      this.currentTrackKey = key;
    }

    const event: MusicTrackChangeEvent = {
      type: 'MUSIC_TRACK_CHANGE',
      payload: {
        previousTrack: this.currentTrackKey,
        newTrack: key,
        immediate
      }
    };
    this.eventBus.emit(event);
  }

  public stopTrack(fadeOutDuration?: number): void {
    if (this.currentTrackKey) {
      const track = this.tracks.get(this.currentTrackKey);
      if (track) {
        this.audioSystem.stopMusic();
        
        const event: MusicTrackStopEvent = {
          type: 'MUSIC_TRACK_STOP',
          payload: {
            track: this.currentTrackKey,
            fadeOutDuration
          }
        };
        this.eventBus.emit(event);
      }
      this.currentTrackKey = undefined;
    }
  }

  private startTrack(key: string): void {
    const track = this.tracks.get(key);
    if (!track) return;

    const options = {
      volume: track.volume,
      loop: track.loop
    };

    this.audioSystem.playMusic(track.key, options);
    this.currentTrackKey = key;
  }

  private stopCurrentTrack(): void {
    if (this.currentTrackKey) {
      this.audioSystem.stopMusic();
      this.currentTrackKey = undefined;
    }
  }

  // Playlist management
  private playlist: string[] = [];
  private playlistIndex: number = -1;
  private isPlaylistPlaying: boolean = false;

  public createPlaylist(trackKeys: string[]): void {
    this.playlist = trackKeys.filter(key => this.tracks.has(key));
    this.playlistIndex = -1;
    this.isPlaylistPlaying = false;
  }

  public startPlaylist(shuffle: boolean = false): void {
    if (this.playlist.length === 0) return;

    if (shuffle) {
      this.shufflePlaylist();
    }

    this.isPlaylistPlaying = true;
    this.playNextTrack();
    
    const event: PlaylistStartEvent = {
      type: 'PLAYLIST_START',
      payload: {
        tracks: this.playlist,
        shuffled: shuffle
      }
    };
    this.eventBus.emit(event);
  }

  public stopPlaylist(): void {
    this.isPlaylistPlaying = false;
    this.stopTrack();
    
    const event: PlaylistStopEvent = {
      type: 'PLAYLIST_STOP',
      payload: {
        currentTrack: this.currentTrackKey,
        remainingTracks: this.playlist.length - this.playlistIndex - 1,
        remainingTrackList: this.playlist.slice(this.playlistIndex + 1)
      }
    };
    this.eventBus.emit(event);
  }

  private playNextTrack(): void {
    if (!this.isPlaylistPlaying || this.playlist.length === 0) return;

    this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
    const nextTrack = this.playlist[this.playlistIndex];
    this.playTrack(nextTrack);
    
    const event: PlaylistTrackChangeEvent = {
      type: 'PLAYLIST_TRACK_CHANGE',
      payload: {
        previousTrack: this.currentTrackKey,
        nextTrack,
        remainingTracks: this.playlist.length - this.playlistIndex - 1
      }
    };
    this.eventBus.emit(event);
  }

  private shufflePlaylist(): void {
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
  }

  public setTrackVolume(key: string, volume: number): void {
    const track = this.tracks.get(key);
    if (track) {
      track.volume = Math.max(0, Math.min(1, volume));
      if (key === this.currentTrackKey) {
        this.audioSystem.setMusicVolume(track.volume);
      }

      const event: MusicVolumeChangeEvent = {
        type: 'MUSIC_VOLUME_CHANGE',
        payload: {
          track: key,
          volume: track.volume
        }
      };
      this.eventBus.emit(event);
    }
  }

  public getCurrentTrack(): string | undefined {
    return this.currentTrackKey;
  }

  public isTrackPlaying(key: string): boolean {
    return this.currentTrackKey === key;
  }
}
