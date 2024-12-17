import { Component, ComponentType } from '../../core/Component';
import { AudioSystem, PlayOptions } from '../../systems/AudioSystem';

export interface AudioConfig {
  sounds: Map<string, string>; // Map of sound names to their resource keys
}

export class AudioComponent extends Component {
  private sounds: Map<string, string>;
  private activeAudioIds: Set<string>;

  constructor(
    private audioSystem: AudioSystem,
    config: AudioConfig
  ) {
    super(ComponentType.AUDIO);
    this.sounds = new Map(config.sounds);
    this.activeAudioIds = new Set();
  }

  public override cleanup(): void {
    // Stop all active sounds when component is cleaned up
    this.stopAllSounds();
    super.cleanup();
  }

  public playSound(name: string, options?: PlayOptions): string | undefined {
    const soundKey = this.sounds.get(name);
    if (!soundKey) {
      console.warn(`Sound not found: ${name}`);
      return undefined;
    }

    try {
      const audioId = this.audioSystem.playSound(soundKey, options);
      this.activeAudioIds.add(audioId);
      return audioId;
    } catch (error) {
      console.error(`Failed to play sound ${name}:`, error);
      return undefined;
    }
  }

  public stopSound(audioId: string): void {
    if (this.activeAudioIds.has(audioId)) {
      this.audioSystem.stopSound(audioId);
      this.activeAudioIds.delete(audioId);
    }
  }

  public stopAllSounds(): void {
    this.activeAudioIds.forEach(id => {
      this.audioSystem.stopSound(id);
    });
    this.activeAudioIds.clear();
  }

  public addSound(name: string, resourceKey: string): void {
    this.sounds.set(name, resourceKey);
  }

  public removeSound(name: string): void {
    this.sounds.delete(name);
  }

  public hasSound(name: string): boolean {
    return this.sounds.has(name);
  }

  public getActiveAudioIds(): string[] {
    return Array.from(this.activeAudioIds);
  }
}
