// FPS tracking and display utilities

class FPSTracker {
  private frameCount = 0
  private lastFPSUpdateTime = performance.now()
  private lastFrameTime = performance.now()
  private fps = 0
  private frameTime = 0

  /**
   * Update FPS calculation - call this once per frame
   */
  update(): void {
    const currentTime = performance.now()
    this.frameTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime
    this.frameCount++

    // Update FPS calculation every second
    const timeSinceLastUpdate = currentTime - this.lastFPSUpdateTime
    if (timeSinceLastUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / timeSinceLastUpdate)
      this.frameCount = 0
      this.lastFPSUpdateTime = currentTime
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps
  }

  /**
   * Get current frame time in milliseconds
   */
  getFrameTime(): number {
    return this.frameTime
  }
}

// Global FPS tracker instance
const fpsTracker = new FPSTracker()

/**
 * Update FPS tracking - call once per frame
 */
export const updateFPS = (): void => {
  fpsTracker.update()
}

/**
 * Get current FPS value
 */
export const getCurrentFPS = (): number => {
  return fpsTracker.getFPS()
}

/**
 * Get current frame time in milliseconds
 */
export const getCurrentFrameTime = (): number => {
  return fpsTracker.getFrameTime()
}

/**
 * Render FPS display on canvas
 */
export const renderFPS = (ctx: CanvasRenderingContext2D): void => {
  const fps = getCurrentFPS()
  
  ctx.save()
  
  // Position at top left corner
  const x = 20
  const y = 40
  
  // Background for better readability
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(x - 10, y - 25, 100, 35)
  
  // FPS text
  ctx.fillStyle = '#00ff00' // Green color for FPS
  ctx.font = '16px monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`FPS: ${fps}`, x, y - 20)
  
  ctx.restore()
}
