export type ResourceType = 'image' | 'audio';

interface Resource {
  type: ResourceType;
  path: string;
  data: any;
}

export class ResourceManager {
  private resources: Map<string, Resource>;
  private loadingPromises: Map<string, Promise<void>>;

  constructor() {
    this.resources = new Map();
    this.loadingPromises = new Map();
  }

  public async loadImage(key: string, path: string): Promise<HTMLImageElement> {
    // Return cached image if already loaded
    const existing = this.resources.get(key);
    if (existing && existing.type === 'image') {
      return existing.data as HTMLImageElement;
    }

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(key);
    if (loadingPromise) {
      await loadingPromise;
      return this.resources.get(key)!.data as HTMLImageElement;
    }

    // Load new image
    const promise = new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.resources.set(key, { type: 'image', path, data: image });
        this.loadingPromises.delete(key);
        resolve();
      };
      image.onerror = () => {
        this.loadingPromises.delete(key);
        reject(new Error(`Failed to load image: ${path}`));
      };
      image.src = path;
    });

    this.loadingPromises.set(key, promise);
    await promise;
    return this.resources.get(key)!.data as HTMLImageElement;
  }

  public async loadAudio(key: string, path: string): Promise<AudioBuffer> {
    // Return cached audio if already loaded
    const existing = this.resources.get(key);
    if (existing && existing.type === 'audio') {
      return existing.data as AudioBuffer;
    }

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(key);
    if (loadingPromise) {
      await loadingPromise;
      return this.resources.get(key)!.data as AudioBuffer;
    }

    // Load new audio
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        this.resources.set(key, { type: 'audio', path, data: audioBuffer });
        this.loadingPromises.delete(key);
        resolve();
      } catch (error) {
        this.loadingPromises.delete(key);
        reject(new Error(`Failed to load audio: ${path}`));
      }
    });

    this.loadingPromises.set(key, promise);
    await promise;
    return this.resources.get(key)!.data as AudioBuffer;
  }

  public async loadResources(resources: { key: string; type: ResourceType; path: string }[]): Promise<void> {
    const promises = resources.map(({ key, type, path }) => {
      switch (type) {
        case 'image':
          return this.loadImage(key, path);
        case 'audio':
          return this.loadAudio(key, path);
        default:
          throw new Error(`Unsupported resource type: ${type}`);
      }
    });

    await Promise.all(promises);
  }

  public getResource(key: string): Resource | undefined {
    return this.resources.get(key);
  }

  public isLoading(key: string): boolean {
    return this.loadingPromises.has(key);
  }

  public clear(): void {
    this.resources.clear();
    this.loadingPromises.clear();
  }
}
