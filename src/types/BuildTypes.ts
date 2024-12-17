export interface BuildTask {
  readonly id: string;
  readonly dependencies: string[];
  execute(): Promise<BuildTaskResult>;
}

export interface BuildTaskResult {
  success: boolean;
  output?: any;
  error?: string;
}

export interface BuildResult {
  success: boolean;
  tasks: Map<string, BuildTaskResult>;
  errors: BuildError[];
}

export interface BuildError {
  taskId: string;
  error: string;
}

export interface AssetProcessingOptions {
  compression?: {
    enabled: boolean;
    quality?: number;
  };
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
  };
  format?: string;
}

export interface ImageProcessingOptions extends AssetProcessingOptions {
  format?: 'png' | 'jpg' | 'jpeg' | 'webp';
}

export interface AudioProcessingOptions extends AssetProcessingOptions {
  format?: 'mp3' | 'wav' | 'ogg';
  bitrate?: string;
  channels?: number;
  sampleRate?: number;
}

export interface ShaderProcessingOptions extends AssetProcessingOptions {
  optimize?: boolean;
  defines?: Record<string, string | number>;
  includes?: string[];
}

export interface AssetProcessingTask extends BuildTask {
  readonly type: 'image' | 'audio' | 'shader' | 'model';
  readonly inputPath: string;
  readonly outputPath: string;
  readonly options?: AssetProcessingOptions | ImageProcessingOptions | AudioProcessingOptions | ShaderProcessingOptions;
} 