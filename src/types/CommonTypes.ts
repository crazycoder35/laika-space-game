export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Sprite {
  texture: WebGLTexture;
  textureRegion: TextureRegion;
  position: Vector2D;
  scale: Vector2D;
  rotation: number;
  alpha: number;
} 