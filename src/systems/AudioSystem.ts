import { System, SystemType } from '../types/SystemTypes';
import { ResourceManager } from '../core/ResourceManager';
import { EventBus } from '../core/EventBus';
import { AudioSystemConfig } from '../types/SystemInterfaces';
import {
  AudioInitializedEvent,
  SoundLoadedEvent,
  MusicLoadedEvent,
  SoundPlayedEvent,
  SoundStoppedEvent,
  AllSoundsStoppedEvent,
  MusicStartedEvent,
  MusicStoppedEvent,
  VolumeChangedEvent,
  MusicCrossfadeEvent
} from '../types/AudioEvents';

export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  pitch?: number;
  pan?: number;
}

export interface AudioTrack {
  source: AudioBufferSourceNode;
  gain: GainNode;
  analyser: AnalyserNode;
  pan: StereoPannerNode;
}

export class AudioSystem implements System {
  public readonly priority = 6;
  public readonly dependencies: SystemType[] = [];

  private readonly context: AudioContext;
  private readonly sounds: Map<string, AudioBuffer>;
  private readonly music: Map<string, AudioBuffer>;
  private readonly activeSounds: Map<string, AudioTrack>;
  private readonly masterGain: GainNode;
  private readonly musicGain: GainNode;
  private readonly sfxGain: GainNode;
  private currentMusic?: AudioTrack;
  private readonly resourceManager: ResourceManager;
  private readonly eventBus: EventBus;

  constructor(config: AudioSystemConfig) {
    this.resourceManager = config.resourceManager;
    this.eventBus = config.eventBus;
    this.context = new AudioContext();
    this.sounds = new Map();
    this.music = new Map();
    this.activeSounds = new Map();

    // Create gain nodes for volume control
    this.masterGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();

    // Connect gain nodes
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    // Set default volumes
    this.masterGain.gain.value = 1.0;
    this.musicGain.gain.value = 0.7;
    this.sfxGain.gain.value = 1.0;
  }

  public async initialize(): Promise<void> {
    // Resume audio context if suspended
    if (this.context.state === 'suspended') {
      await this.context.resume();
      const event: AudioInitializedEvent = {
        type: 'AUDIO_INITIALIZED',
        payload: { state: this.context.state }
      };
      this.eventBus.emit(event);
    }
  }

  public update(_deltaTime: number): void {
    // Clean up finished sounds
    this.activeSounds.forEach((track, id) => {
      if ((track.source as any).playbackState === 'finished') {
        this.activeSounds.delete(id);
      }
    });
  }

  public cleanup(): void {
    this.stopAllSounds();
    this.stopMusic();
    this.sounds.clear();
    this.music.clear();
  }

  // Sound Management
  public async loadSound(name: string, url: string): Promise<void> {
    const buffer = await this.resourceManager.loadAudio(name, url);
    this.sounds.set(name, buffer);
    const event: SoundLoadedEvent = {
      type: 'SOUND_LOADED',
      payload: { name }
    };
    this.eventBus.emit(event);
  }

  public async loadMusic(name: string, url: string): Promise<void> {
    const buffer = await this.resourceManager.loadAudio(name, url);
    this.music.set(name, buffer);
    const event: MusicLoadedEvent = {
      type: 'MUSIC_LOADED',
      payload: { name }
    };
    this.eventBus.emit(event);
  }

  public playSound(name: string, options: PlayOptions = {}): string {
    const buffer = this.sounds.get(name);
    if (!buffer) {
      throw new Error(`Sound not found: ${name}`);
    }

    const id = `sound_${Date.now()}_${Math.random()}`;
    const track = this.createAudioTrack(buffer, options);
    track.gain.connect(this.sfxGain);
    track.source.start();
    this.activeSounds.set(id, track);

    const event: SoundPlayedEvent = {
      type: 'SOUND_PLAYED',
      payload: { name, id, options }
    };
    this.eventBus.emit(event);

    return id;
  }

  public playMusic(name: string, options: PlayOptions = {}): void {
    const buffer = this.music.get(name);
    if (!buffer) {
      throw new Error(`Music not found: ${name}`);
    }

    const track = this.createAudioTrack(buffer, { ...options, loop: true });
    track.gain.connect(this.musicGain);
    track.source.start();

    if (this.currentMusic) {
      this.fadeOut(this.currentMusic, 1.0);
    }

    this.currentMusic = track;
    this.fadeIn(track, 1.0);

    const event: MusicStartedEvent = {
      type: 'MUSIC_STARTED',
      payload: { name, options }
    };
    this.eventBus.emit(event);
  }

  public stopSound(id: string): void {
    const track = this.activeSounds.get(id);
    if (track) {
      track.source.stop();
      this.activeSounds.delete(id);
      const event: SoundStoppedEvent = {
        type: 'SOUND_STOPPED',
        payload: { id }
      };
      this.eventBus.emit(event);
    }
  }

  public stopAllSounds(): void {
    this.activeSounds.forEach(track => track.source.stop());
    this.activeSounds.clear();
    const event: AllSoundsStoppedEvent = {
      type: 'ALL_SOUNDS_STOPPED',
      payload: { timestamp: Date.now() }
    };
    this.eventBus.emit(event);
  }

  public stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.source.stop();
      this.currentMusic = undefined;
      const event: MusicStoppedEvent = {
        type: 'MUSIC_STOPPED',
        payload: { timestamp: Date.now() }
      };
      this.eventBus.emit(event);
    }
  }

  // Volume Control
  public setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    const event: VolumeChangedEvent = {
      type: 'VOLUME_CHANGED',
      payload: { type: 'master', volume }
    };
    this.eventBus.emit(event);
  }

  public setMusicVolume(volume: number): void {
    this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    const event: VolumeChangedEvent = {
      type: 'VOLUME_CHANGED',
      payload: { type: 'music', volume }
    };
    this.eventBus.emit(event);
  }

  public setSFXVolume(volume: number): void {
    this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    const event: VolumeChangedEvent = {
      type: 'VOLUME_CHANGED',
      payload: { type: 'sfx', volume }
    };
    this.eventBus.emit(event);
  }

  // Music Transitions
  public crossfadeMusic(name: string, duration: number = 2.0): void {
    const buffer = this.music.get(name);
    if (!buffer) {
      throw new Error(`Music not found: ${name}`);
    }

    const nextTrack = this.createAudioTrack(buffer, { loop: true });
    nextTrack.gain.connect(this.musicGain);
    nextTrack.gain.gain.value = 0;
    nextTrack.source.start();

    if (this.currentMusic) {
      this.fadeOut(this.currentMusic, duration);
    }

    this.fadeIn(nextTrack, duration);
    this.currentMusic = nextTrack;

    const event: MusicCrossfadeEvent = {
      type: 'MUSIC_CROSSFADE',
      payload: { name, duration }
    };
    this.eventBus.emit(event);
  }

  private createAudioTrack(buffer: AudioBuffer, options: PlayOptions): AudioTrack {
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop || false;
    if (options.pitch) {
      source.playbackRate.value = options.pitch;
    }

    const gain = this.context.createGain();
    gain.gain.value = options.volume ?? 1;

    const analyser = this.context.createAnalyser();
    analyser.fftSize = 2048;

    const pan = this.context.createStereoPanner();
    pan.pan.value = options.pan || 0;

    // Connect nodes
    source.connect(gain);
    gain.connect(analyser);
    analyser.connect(pan);

    return { source, gain, analyser, pan };
  }

  private fadeIn(track: AudioTrack, duration: number): void {
    const gain = track.gain.gain;
    gain.setValueAtTime(0, this.context.currentTime);
    gain.linearRampToValueAtTime(1, this.context.currentTime + duration);
  }

  private fadeOut(track: AudioTrack, duration: number): void {
    const gain = track.gain.gain;
    gain.setValueAtTime(gain.value, this.context.currentTime);
    gain.linearRampToValueAtTime(0, this.context.currentTime + duration);
    setTimeout(() => {
      track.source.stop();
    }, duration * 1000);
  }

  // Audio Analysis
  public getFrequencyData(track: AudioTrack): Uint8Array {
    const dataArray = new Uint8Array(track.analyser.frequencyBinCount);
    track.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getWaveformData(track: AudioTrack): Uint8Array {
    const dataArray = new Uint8Array(track.analyser.frequencyBinCount);
    track.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  // State Management
  public getState(): {
    context: AudioContext;
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    activeSoundCount: number;
    loadedSoundCount: number;
    loadedMusicCount: number;
  } {
    return {
      context: this.context,
      masterVolume: this.masterGain.gain.value,
      musicVolume: this.musicGain.gain.value,
      sfxVolume: this.sfxGain.gain.value,
      activeSoundCount: this.activeSounds.size,
      loadedSoundCount: this.sounds.size,
      loadedMusicCount: this.music.size
    };
  }
}
