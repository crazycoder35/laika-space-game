import { Component, ComponentType } from '../Component';

export interface Vector2D {
  x: number;
  y: number;
}

export class TransformComponent extends Component {
  private _position: Vector2D;
  private _rotation: number;
  private _scale: Vector2D;

  constructor(
    position: Vector2D = { x: 0, y: 0 },
    rotation: number = 0,
    scale: Vector2D = { x: 1, y: 1 }
  ) {
    super(ComponentType.TRANSFORM);
    this._position = { ...position };
    this._rotation = rotation;
    this._scale = { ...scale };
  }

  public get position(): Vector2D {
    return { ...this._position };
  }

  public set position(value: Vector2D) {
    this._position = { ...value };
  }

  public get rotation(): number {
    return this._rotation;
  }

  public set rotation(value: number) {
    this._rotation = value;
  }

  public get scale(): Vector2D {
    return { ...this._scale };
  }

  public set scale(value: Vector2D) {
    this._scale = { ...value };
  }

  public translate(delta: Vector2D): void {
    this._position.x += delta.x;
    this._position.y += delta.y;
  }

  public rotate(angle: number): void {
    this._rotation += angle;
    // Normalize rotation to [0, 2π]
    this._rotation = this._rotation % (Math.PI * 2);
  }

  public setScale(scale: Vector2D): void {
    this._scale = { ...scale };
  }

  // Helper methods for common transformations
  public setPosition(x: number, y: number): void {
    this._position.x = x;
    this._position.y = y;
  }

  public moveForward(distance: number): void {
    this._position.x += Math.cos(this._rotation) * distance;
    this._position.y += Math.sin(this._rotation) * distance;
  }

  public moveRight(distance: number): void {
    this._position.x += Math.cos(this._rotation + Math.PI / 2) * distance;
    this._position.y += Math.sin(this._rotation + Math.PI / 2) * distance;
  }

  // Matrix transformation methods (useful for rendering)
  public getTransformMatrix(): DOMMatrix {
    const matrix = new DOMMatrix();
    matrix.translateSelf(this._position.x, this._position.y);
    matrix.rotateSelf(this._rotation * (180 / Math.PI));
    matrix.scaleSelf(this._scale.x, this._scale.y);
    return matrix;
  }
}
