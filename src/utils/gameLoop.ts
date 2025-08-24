import { TICK_RATE, TARGET_FPS } from '../config/gameConfig'

/**
 * Game loop management with FPS capping
 */
export class GameLoop {
  private animationId: number | null = null
  private lastTime = 0
  private lastRenderTime = 0
  private accumulator = 0
  private readonly frameTime = 1000 / TARGET_FPS // Time between frames in ms
  
  constructor(
    private updateCallback: (deltaTime: number) => void,
    private renderCallback: () => void
  ) {}

  /**
   * Start the game loop
   */
  start = () => {
    if (this.animationId !== null) {
      return // Already running
    }
    
    const now = performance.now()
    this.lastTime = now
    this.lastRenderTime = now
    this.tick()
  }

  /**
   * Stop the game loop
   */
  stop = () => {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Main game loop tick with FPS capping
   */
  private tick = (currentTime: number = performance.now()) => {
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    
    this.accumulator += deltaTime
    
    // Fixed timestep updates
    while (this.accumulator >= TICK_RATE) {
      this.updateCallback(TICK_RATE)
      this.accumulator -= TICK_RATE
    }
    
    // FPS capped rendering - only render if enough time has passed
    const timeSinceLastRender = currentTime - this.lastRenderTime
    if (timeSinceLastRender >= this.frameTime) {
      this.renderCallback()
      this.lastRenderTime = currentTime
    }
    
    this.animationId = requestAnimationFrame(this.tick)
  }
}

/**
 * Create a new game loop instance
 */
export const createGameLoop = (updateCallback: (deltaTime: number) => void, renderCallback: () => void) => {
  return new GameLoop(updateCallback, renderCallback)
}
