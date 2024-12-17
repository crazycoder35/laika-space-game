/**
 * Base interface for all game scenes
 */
export interface Scene {
  /**
   * Initialize the scene. This is called once when the scene is first loaded.
   */
  initialize(): Promise<void>;

  /**
   * Update the scene state. This is called every frame.
   * @param deltaTime Time elapsed since last update in seconds
   */
  update(deltaTime: number): void;

  /**
   * Clean up any resources used by the scene. This is called when the scene is unloaded.
   */
  cleanup(): void;
}
