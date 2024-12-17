import { Sprite } from '../types/CommonTypes';

export interface BatchGroup {
  texture: WebGLTexture;
  vertices: Float32Array;
  indices: Uint16Array;
  count: number;
  dirty: boolean;
}

const MAX_BATCH_SIZE = 1000; // Maximum sprites per batch
const VERTICES_PER_SPRITE = 4;
const INDICES_PER_SPRITE = 6;
const VERTEX_SIZE = 9; // x, y, u, v, r, g, b, a, textureId

export class BatchRenderer {
  private gl: WebGL2RenderingContext;
  private batches: Map<string, BatchGroup> = new Map();
  private shader: WebGLProgram;
  private vertexBuffer: WebGLBuffer;
  private indexBuffer: WebGLBuffer;
  private currentTextureSlot: number = 0;
  private boundTextures: Map<string, number> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }
    this.gl = gl;
    this.initializeWebGL();
  }

  private initializeWebGL(): void {
    const gl = this.gl;

    // Create shader program
    const vertexShader = this.createShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      attribute float a_textureId;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      varying float v_textureId;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_color;
        v_textureId = a_textureId;
      }
    `);

    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      varying float v_textureId;
      
      uniform sampler2D u_textures[8];
      
      void main() {
        int textureIndex = int(v_textureId);
        vec4 texColor;
        
        // WebGL2 requires texture lookup with dynamic index to be constant
        if (textureIndex == 0) texColor = texture2D(u_textures[0], v_texCoord);
        else if (textureIndex == 1) texColor = texture2D(u_textures[1], v_texCoord);
        else if (textureIndex == 2) texColor = texture2D(u_textures[2], v_texCoord);
        else if (textureIndex == 3) texColor = texture2D(u_textures[3], v_texCoord);
        else if (textureIndex == 4) texColor = texture2D(u_textures[4], v_texCoord);
        else if (textureIndex == 5) texColor = texture2D(u_textures[5], v_texCoord);
        else if (textureIndex == 6) texColor = texture2D(u_textures[6], v_texCoord);
        else texColor = texture2D(u_textures[7], v_texCoord);
        
        gl_FragColor = texColor * v_color;
      }
    `);

    this.shader = this.createProgram(vertexShader, fragmentShader);

    // Create buffers
    this.vertexBuffer = gl.createBuffer()!;
    this.indexBuffer = gl.createBuffer()!;

    // Set up vertex array
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    const stride = VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT;
    gl.enableVertexAttribArray(0); // position
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1); // texCoord
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(2); // color
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 16);
    gl.enableVertexAttribArray(3); // textureId
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 32);
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      throw new Error(`Could not compile WebGL shader. \n\n${info}`);
    }

    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      throw new Error(`Could not compile WebGL program. \n\n${info}`);
    }

    return program;
  }

  public addToBatch(sprite: Sprite): void {
    const textureId = sprite.texture.toString();
    let batch = this.batches.get(textureId);

    if (!batch) {
      batch = this.createBatch(sprite.texture);
      this.batches.set(textureId, batch);
    }

    if (batch.count >= MAX_BATCH_SIZE) {
      this.flush();
      batch = this.createBatch(sprite.texture);
      this.batches.set(textureId, batch);
    }

    this.addSpriteToBatch(sprite, batch);
    batch.dirty = true;
  }

  public flush(): void {
    this.render();
    this.clear();
  }

  private createBatch(texture: WebGLTexture): BatchGroup {
    return {
      texture,
      vertices: new Float32Array(MAX_BATCH_SIZE * VERTICES_PER_SPRITE * VERTEX_SIZE),
      indices: new Uint16Array(MAX_BATCH_SIZE * INDICES_PER_SPRITE),
      count: 0,
      dirty: false
    };
  }

  private addSpriteToBatch(sprite: Sprite, batch: BatchGroup): void {
    const textureSlot = this.getTextureSlot(sprite.texture);
    const index = batch.count * VERTICES_PER_SPRITE * VERTEX_SIZE;
    const { position, scale, rotation, textureRegion, alpha } = sprite;

    // Calculate vertices
    const x = position.x;
    const y = position.y;
    const w = textureRegion.width * scale.x;
    const h = textureRegion.height * scale.y;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Add vertices to batch
    this.addVertex(batch.vertices, index, x, y, textureRegion.x, textureRegion.y, alpha, textureSlot);
    this.addVertex(batch.vertices, index + VERTEX_SIZE, x + w * cos, y + w * sin, 
                  textureRegion.x + textureRegion.width, textureRegion.y, alpha, textureSlot);
    this.addVertex(batch.vertices, index + VERTEX_SIZE * 2, x + w * cos - h * sin, 
                  y + w * sin + h * cos, textureRegion.x + textureRegion.width, 
                  textureRegion.y + textureRegion.height, alpha, textureSlot);
    this.addVertex(batch.vertices, index + VERTEX_SIZE * 3, x - h * sin, y + h * cos, 
                  textureRegion.x, textureRegion.y + textureRegion.height, alpha, textureSlot);

    // Add indices
    const vertexOffset = batch.count * VERTICES_PER_SPRITE;
    const indexOffset = batch.count * INDICES_PER_SPRITE;
    batch.indices[indexOffset] = vertexOffset;
    batch.indices[indexOffset + 1] = vertexOffset + 1;
    batch.indices[indexOffset + 2] = vertexOffset + 2;
    batch.indices[indexOffset + 3] = vertexOffset;
    batch.indices[indexOffset + 4] = vertexOffset + 2;
    batch.indices[indexOffset + 5] = vertexOffset + 3;

    batch.count++;
  }

  private addVertex(vertices: Float32Array, offset: number, x: number, y: number, 
                   u: number, v: number, alpha: number, textureSlot: number): void {
    vertices[offset] = x;
    vertices[offset + 1] = y;
    vertices[offset + 2] = u;
    vertices[offset + 3] = v;
    vertices[offset + 4] = 1; // r
    vertices[offset + 5] = 1; // g
    vertices[offset + 6] = 1; // b
    vertices[offset + 7] = alpha;
    vertices[offset + 8] = textureSlot;
  }

  private getTextureSlot(texture: WebGLTexture): number {
    const textureId = texture.toString();
    let slot = this.boundTextures.get(textureId);

    if (slot === undefined) {
      slot = this.currentTextureSlot;
      this.boundTextures.set(textureId, slot);
      this.currentTextureSlot = (this.currentTextureSlot + 1) % 8; // WebGL2 typically supports 8 texture units
    }

    return slot;
  }

  public render(): void {
    const gl = this.gl;
    gl.useProgram(this.shader);

    // Set up uniforms
    const textureLocations = [];
    for (let i = 0; i < 8; i++) {
      textureLocations[i] = gl.getUniformLocation(this.shader, `u_textures[${i}]`);
      gl.uniform1i(textureLocations[i], i);
    }

    // Render each batch
    for (const [_, batch] of this.batches) {
      if (batch.count === 0) continue;

      if (batch.dirty) {
        // Update vertex and index buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, batch.vertices, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, batch.indices, gl.DYNAMIC_DRAW);

        batch.dirty = false;
      }

      // Bind texture
      gl.activeTexture(gl.TEXTURE0 + this.boundTextures.get(batch.texture.toString())!);
      gl.bindTexture(gl.TEXTURE_2D, batch.texture);

      // Draw
      gl.drawElements(gl.TRIANGLES, batch.count * INDICES_PER_SPRITE, gl.UNSIGNED_SHORT, 0);
    }
  }

  public clear(): void {
    this.batches.clear();
    this.boundTextures.clear();
    this.currentTextureSlot = 0;
  }

  public cleanup(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteProgram(this.shader);
    this.clear();
  }
} 