// FPS tracking and display utilities

import { enemies } from './enemyUtils'
// Removed getCollectedCoinCount import as coins are now displayed in inventory
import { UI_FONT_SIZE_STATS } from '../config/gameConfig'

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
  
  // FPS text
  ctx.fillStyle = '#00ff00' // Green color for FPS
  ctx.font = `${UI_FONT_SIZE_STATS}px monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const fpsText = `FPS: ${fps}`
  
  // Measure text width for adaptive background
  const textMetrics = ctx.measureText(fpsText)
  const textWidth = textMetrics.width
  const backgroundWidth = textWidth + 20 // 10px padding on each side
  const backgroundHeight = 35
  
  // Background for better readability (adaptive width)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(x - 10, y - 25, backgroundWidth, backgroundHeight)
  
  // Reset fill style for text
  ctx.fillStyle = '#00ff00' // Green color for FPS
  ctx.fillText(fpsText, x, y - 20)
  
  ctx.restore()
}

/**
 * Render turn counter display on canvas (next to FPS)
 */
export const renderTurnCounter = (ctx: CanvasRenderingContext2D, turnNumber: number): void => {
  ctx.save()
  
  // Position next to FPS display
  const x = 130 // Right of FPS display
  const y = 40
  
  // Turn counter text
  ctx.fillStyle = '#FFD700' // Gold color for turn counter
  ctx.font = `${UI_FONT_SIZE_STATS}px monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const turnText = `Turn: ${turnNumber}`
  
  // Measure text width for adaptive background
  const textMetrics = ctx.measureText(turnText)
  const textWidth = textMetrics.width
  const backgroundWidth = textWidth + 20 // 10px padding on each side
  const backgroundHeight = 35
  
  // Background for better readability (adaptive width)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(x - 10, y - 25, backgroundWidth, backgroundHeight)
  
  // Reset fill style for text
  ctx.fillStyle = '#FFD700' // Gold color for turn counter
  ctx.fillText(turnText, x, y - 20)
  
  ctx.restore()
}

/**
 * Render enemy counter display on canvas (next to turn counter)
 */
export const renderEnemyCounter = (ctx: CanvasRenderingContext2D): void => {
  const enemyCount = enemies.length
  
  ctx.save()
  
  // Position next to turn counter
  const x = 250 // Right of turn display
  const y = 40
  
  // Enemy counter text
  ctx.fillStyle = '#FF6B6B' // Red color for enemy counter
  ctx.font = `${UI_FONT_SIZE_STATS}px monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const enemyText = `Enemies: ${enemyCount}`
  
  // Measure text width for adaptive background
  const textMetrics = ctx.measureText(enemyText)
  const textWidth = textMetrics.width
  const backgroundWidth = textWidth + 20 // 10px padding on each side
  const backgroundHeight = 35
  
  // Background for better readability (adaptive width)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(x - 10, y - 25, backgroundWidth, backgroundHeight)
  
  // Reset fill style for text
  ctx.fillStyle = '#FF6B6B' // Red color for enemy counter
  ctx.fillText(enemyText, x, y - 20)
  
  ctx.restore()
}

// Coin counter removed - now displayed in inventory section
