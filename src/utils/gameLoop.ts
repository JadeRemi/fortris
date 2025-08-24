import { TICK_RATE } from '../config/gameConfig'

/**
 * Game loop management
 */
export class GameLoop {
  private animationId: number | null = null
  private lastTime = 0
  private accumulator = 0
  
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
    
    this.lastTime = performance.now()
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
   * Main game loop tick
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
    
    // Render
    this.renderCallback()
    
    this.animationId = requestAnimationFrame(this.tick)
  }
}

/**
 * Create a new game loop instance
 */
export const createGameLoop = (updateCallback: (deltaTime: number) => void, renderCallback: () => void) => {
  return new GameLoop(updateCallback, renderCallback)
}
