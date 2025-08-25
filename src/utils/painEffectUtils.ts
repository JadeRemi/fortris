/**
 * Pain effect system for enemies when they take damage
 */

import type { Enemy } from '../types/enemies'

// Pain effect animation data
interface PainEffect {
  enemyUuid: string
  startTime: number
  duration: number
  isActive: boolean
}

// Active pain effects
let painEffects: PainEffect[] = []

// Pain effect configuration
const PAIN_EFFECT_DURATION_MS = 1000 // 1 second
const PAIN_COLOR_INTENSITY = 0.6 // How strong the red overlay is

/**
 * Add a pain effect for an enemy
 */
export const addPainEffect = (enemy: Enemy): void => {
  // Remove any existing pain effect for this enemy
  painEffects = painEffects.filter(effect => effect.enemyUuid !== enemy.uuid)
  
  // Add new pain effect
  painEffects.push({
    enemyUuid: enemy.uuid,
    startTime: Date.now(),
    duration: PAIN_EFFECT_DURATION_MS,
    isActive: true
  })
}

/**
 * Get pain effect intensity for an enemy (0-1, where 0 = no effect, 1 = full red overlay)
 */
export const getPainEffectIntensity = (enemy: Enemy): number => {
  const effect = painEffects.find(e => e.enemyUuid === enemy.uuid && e.isActive)
  if (!effect) {
    return 0
  }
  
  const currentTime = Date.now()
  const elapsed = currentTime - effect.startTime
  
  // If effect is expired, mark as inactive and return 0
  if (elapsed >= effect.duration) {
    effect.isActive = false
    return 0
  }
  
  // Calculate bezier curve animation (smooth in and out)
  const progress = elapsed / effect.duration // 0 to 1
  
  // Cubic bezier curve for smooth animation (0.25, 0.46, 0.45, 0.94)
  // This creates a smooth ease-in-out effect
  const t = progress
  const bezier = 3 * (1 - t) * (1 - t) * t * 0.25 + 
                 3 * (1 - t) * t * t * 0.45 + 
                 t * t * t
  
  // Apply the effect intensity curve: start at 0, peak in middle, end at 0
  const intensityCurve = Math.sin(progress * Math.PI) // Sine wave from 0 to 1 to 0
  
  return intensityCurve * PAIN_COLOR_INTENSITY * bezier
}

/**
 * Clean up expired pain effects
 */
export const cleanupPainEffects = (): void => {
  const currentTime = Date.now()
  painEffects = painEffects.filter(effect => 
    effect.isActive && (currentTime - effect.startTime) < effect.duration
  )
}

/**
 * Render pain effect overlay on an enemy sprite
 * This creates a red tint that only affects the sprite pixels, preserving transparency
 */
export const renderPainEffect = (
  ctx: CanvasRenderingContext2D, 
  enemy: Enemy, 
  image: HTMLImageElement,
  srcX: number,
  srcY: number, 
  srcWidth: number,
  srcHeight: number,
  destX: number,
  destY: number,
  destWidth: number,
  destHeight: number
): void => {
  const intensity = getPainEffectIntensity(enemy)
  if (intensity <= 0) {
    return
  }
  
  ctx.save()
  
  // Draw the sprite again with a red multiply blend mode
  // This will only affect the non-transparent pixels of the sprite
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = intensity
  
  // Create a red-tinted version by drawing with red color
  ctx.fillStyle = '#ff0000' // Pure red
  ctx.fillRect(destX, destY, destWidth, destHeight)
  
  // Restore normal blending but keep the alpha for the next draw
  ctx.globalCompositeOperation = 'source-atop'
  
  // Draw the original sprite again to restore detail while keeping red tint
  ctx.drawImage(
    image,
    srcX, srcY, srcWidth, srcHeight,
    destX, destY, destWidth, destHeight
  )
  
  ctx.restore()
}
