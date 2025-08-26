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
    
    // Move to claws position 
    ctx.translate(claws.x, claws.y)
    
    if (clawsImage) {
      // Calculate reveal progress (0 to 1) - faster reveal than full animation  
      const revealProgress = Math.min(progress * 2, 1) // Reveal happens in first half of animation
      
      const halfSize = CLAWS_RENDER_SIZE / 2
      
      // Apply diagonal clipping (bottom left to top right)
      ctx.save()
      
      // Create diagonal clipping mask - always bottom left to top right
      ctx.beginPath()
      
      // Create a simple diagonal reveal using a rotated rectangle
      // Reveal progresses diagonally from bottom-left to top-right
      const diagonalLength = CLAWS_RENDER_SIZE * Math.sqrt(2) // Full diagonal length
      const currentReveal = diagonalLength * revealProgress
      
      // Create a rectangle that slides diagonally across the image
      const rectWidth = CLAWS_RENDER_SIZE * 1.5 // Wide enough to cover the full image
      const rectHeight = currentReveal // Height grows with progress
      
      // Position the rectangle to reveal from bottom-left to top-right
      // We'll rotate the clipping area 45 degrees counter-clockwise
      ctx.save()
      ctx.rotate(-Math.PI / 4) // -45 degrees
      
      // Draw the reveal rectangle (in rotated space)
      const rotatedHalfSize = (CLAWS_RENDER_SIZE * Math.sqrt(2)) / 2
      ctx.rect(-rectWidth / 2, rotatedHalfSize - rectHeight, rectWidth, rectHeight)
      
      ctx.restore() // Restore rotation before clipping
      
      ctx.clip()
      
      // Draw the claws image centered (already in translated space)
      drawImage(ctx, clawsImage, -halfSize, -halfSize, CLAWS_RENDER_SIZE, CLAWS_RENDER_SIZE)
      
      ctx.restore()
    } else {
      // Fallback: simple red X if image not loaded (with reveal effect)
      const revealProgress = Math.min(progress * 2, 1)
      
      ctx.strokeStyle = '#FF0000'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      
      const lineLength = CLAWS_RENDER_SIZE * 0.6 * revealProgress
      const halfLength = lineLength / 2
      
      // Draw X pattern with reveal
      ctx.beginPath()
      ctx.moveTo(-halfLength, -halfLength)
      ctx.lineTo(halfLength, halfLength)
      ctx.moveTo(halfLength, -halfLength)
      ctx.lineTo(-halfLength, halfLength)
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

