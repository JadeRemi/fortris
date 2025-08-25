/**
 * Claws effect system for visual feedback when enemies attack allies
 */

import { generateUUID } from './uuidUtils'
import { getCachedImage, drawImage } from './imageUtils'
import { getImagePath } from './assetUtils'
import { getWallCellCoordinates } from './wallExtensions'
import { WALL_CELL_SIZE } from '../config/gameConfig'

// Claws effect configuration
const CLAWS_EFFECT_DURATION_MS = 1000 // 1 second total duration
const CLAWS_RENDER_SIZE = 48 // Rendered size in pixels

// Claws effect data structure
interface ClawsEffect {
  id: string
  uuid: string
  x: number // Canvas x position (center)
  y: number // Canvas y position (center)
  startTime: number
  duration: number
  isActive: boolean
}

// Active claws effects
let clawsEffects: ClawsEffect[] = []

/**
 * Spawn a claws effect when an ally is attacked by an enemy
 * @param wallType - Which wall the ally is on
 * @param cellIndex - Index of the cell in that wall
 */
export const spawnClawsEffect = (wallType: 'left' | 'right' | 'bottom', cellIndex: number): void => {
  const allyCoords = getWallCellCoordinates(wallType, cellIndex)
  if (!allyCoords) return
  
  // Claws effect is displayed in the center of the ally's cell
  const clawsX = allyCoords.x + WALL_CELL_SIZE / 2
  const clawsY = allyCoords.y + WALL_CELL_SIZE / 2
  
  const newClaws: ClawsEffect = {
    id: `claws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uuid: generateUUID(),
    x: clawsX,
    y: clawsY,
    startTime: Date.now(),
    duration: CLAWS_EFFECT_DURATION_MS,
    isActive: true
  }
  
  clawsEffects.push(newClaws)
}

/**
 * Calculate fade opacity using bezier curve
 * Creates a smooth fade in/out effect over the duration
 */
const calculateClawsOpacity = (progress: number): number => {
  // Apply sine wave for smooth fade in/out with extended middle visibility
  // This creates: quick fade in → extended visibility → quick fade out
  const sineProgress = Math.sin(progress * Math.PI) // 0 → 1 → 0 over duration
  
  // Enhance the middle section to be more visible
  const enhancedProgress = Math.pow(sineProgress, 0.6) // Makes middle section more prominent
  
  return Math.max(0, Math.min(1, enhancedProgress))
}

/**
 * Update all claws effects - remove expired ones
 */
export const updateClawsEffects = (): void => {
  const currentTime = Date.now()
  clawsEffects = clawsEffects.filter(claws => {
    if (currentTime - claws.startTime >= claws.duration) {
      claws.isActive = false
      return false
    }
    return claws.isActive
  })
}

/**
 * Render all active claws effects
 */
export const renderClawsEffects = (ctx: CanvasRenderingContext2D): void => {
  const clawsImage = getCachedImage(getImagePath('claws.png'))
  const currentTime = Date.now()
  
  clawsEffects.forEach(claws => {
    if (!claws.isActive) return
    
    // Calculate animation progress (0 to 1)
    const elapsed = currentTime - claws.startTime
    const progress = Math.min(elapsed / claws.duration, 1)
    
    // Calculate opacity using bezier curve
    const opacity = calculateClawsOpacity(progress)
    if (opacity <= 0) return
    
    ctx.save()
    
    // Apply opacity
    ctx.globalAlpha = opacity
    
    if (clawsImage) {
      // Draw the claws image centered
      const halfSize = CLAWS_RENDER_SIZE / 2
      drawImage(ctx, clawsImage, claws.x - halfSize, claws.y - halfSize, CLAWS_RENDER_SIZE, CLAWS_RENDER_SIZE)
    } else {
      // Fallback: simple red X if image not loaded
      ctx.strokeStyle = '#FF0000'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      
      const lineLength = CLAWS_RENDER_SIZE * 0.6
      const halfLength = lineLength / 2
      
      // Draw X pattern
      ctx.beginPath()
      ctx.moveTo(claws.x - halfLength, claws.y - halfLength)
      ctx.lineTo(claws.x + halfLength, claws.y + halfLength)
      ctx.moveTo(claws.x + halfLength, claws.y - halfLength)
      ctx.lineTo(claws.x - halfLength, claws.y + halfLength)
      ctx.stroke()
    }
    
    ctx.restore()
  })
}

/**
 * Clear all claws effects (for game reset)
 */
export const clearClawsEffects = (): void => {
  clawsEffects = []
}

/**
 * Get count of active claws effects (for debugging)
 */
export const getActiveClawsCount = (): number => {
  return clawsEffects.filter(claws => claws.isActive).length
}

