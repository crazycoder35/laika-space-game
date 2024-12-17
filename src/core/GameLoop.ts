export class GameLoop {
  private readonly TARGET_FPS = 60;
  private readonly FRAME_TIME = 1000 / this.TARGET_FPS;
  private lastFrameTime = 0;
  private accumulator = 0;
  private running = false;
  private currentFrameTime = 0;

  constructor(
    private readonly updateFn: (deltaTime: number) => void,
    private readonly renderFn: () => void
  ) {}

  public start(): void {
    if (this.running) return;
    
    this.running = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  public stop(): void {
    this.running = false;
  }

  private loop(timestamp: number): void {
    if (!this.running) return;

    const deltaTime = timestamp - this.lastFrameTime;
    this.currentFrameTime = deltaTime; // Store current frame time
    this.lastFrameTime = timestamp;
    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.FRAME_TIME) {
      this.updateFn(this.FRAME_TIME / 1000); // Convert to seconds
      this.accumulator -= this.FRAME_TIME;
    }

    // Render at display refresh rate
    this.renderFn();

    requestAnimationFrame(this.loop.bind(this));
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getFrameTime(): number {
    return this.currentFrameTime;
  }

  public getTargetFPS(): number {
    return this.TARGET_FPS;
  }
}
