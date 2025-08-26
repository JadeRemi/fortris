/**
 * Slash effect system for visual feedback when melee allies attack
 */

import { generateUUID } from './uuidUtils'
import { getCachedImage, drawImage } from './imageUtils'
import { getImagePath } from './assetUtils'
import { getWallCellCoordinates } from './wallExtensions'
import { WALL_CELL_SIZE } from '../config/gameConfig'

// Slash effect configuration
const SLASH_EFFECT_DURATION_MS = 1000 // 1 second total duration
const SLASH_RENDER_SIZE = 48 // Rendered size in pixels

// Slash effect data structure
interface SlashEffect {
  id: string
  uuid: string
  x: number // Canvas x position (center)
  y: number // Canvas y position (center)
  rotation: number // Rotation in radians
  startTime: number
  duration: number
  isActive: boolean
}

// Active slash effects
let slashEffects: SlashEffect[] = []

/**
 * Spawn a slash effect for a melee attack
 * @param wallType - Which wall the attacker is on
 * @param cellIndex - Index of the cell in that wall
 */
export const spawnSlashEffect = (wallType: 'left' | 'right' | 'bottom', cellIndex: number): void => {
  const attackerCoords = getWallCellCoordinates(wallType, cellIndex)
  if (!attackerCoords) return
  
  let slashX: number, slashY: number, rotation: number
  
  switch (wallType) {
    case 'bottom':
      // No rotation, display above the ally (between ally and battlefield)
      slashX = attackerCoords.x + WALL_CELL_SIZE / 2
      slashY = attackerCoords.y - SLASH_RENDER_SIZE / 2 // Above the ally
      rotation = 0 // No rotation (upward-facing)
      break
      
    case 'left':
      // 90° clockwise, display to the right of ally (between ally and battlefield)
      slashX = attackerCoords.x + WALL_CELL_SIZE + SLASH_RENDER_SIZE / 2 // To the right
      slashY = attackerCoords.y + WALL_CELL_SIZE / 2
      rotation = Math.PI / 2 // 90° clockwise
      break
      
    case 'right':
      // 90° counter-clockwise, display to the left of ally (between ally and battlefield)
      slashX = attackerCoords.x - SLASH_RENDER_SIZE / 2 // To the left
      slashY = attackerCoords.y + WALL_CELL_SIZE / 2
      rotation = -Math.PI / 2 // 90° counter-clockwise
      break
  }
  
  const newSlash: SlashEffect = {
    id: `slash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uuid: generateUUID(),
    x: slashX,
    y: slashY,
    rotation: rotation,
    startTime: Date.now(),
    duration: SLASH_EFFECT_DURATION_MS,
    isActive: true
  }
  
  slashEffects.push(newSlash)
}

/**
 * Calculate fade opacity using bezier curve
 * Creates a smooth fade in/out effect over the duration
 */
const calculateSlashOpacity = (progress: number): number => {
  // Apply sine wave for smooth fade in/out with extended middle visibility
  // This creates: quick fade in → extended visibility → quick fade out
  const sineProgress = Math.sin(progress * Math.PI) // 0 → 1 → 0 over duration
  
  // Enhance the middle section to be more visible
  const enhancedProgress = Math.pow(sineProgress, 0.6) // Makes middle section more prominent
  
  return Math.max(0, Math.min(1, enhancedProgress))
}

/**
 * Update all slash effects - remove expired ones
 */
export const updateSlashEffects = (): void => {
  const currentTime = Date.now()
  slashEffects = slashEffects.filter(slash => {
    if (currentTime - slash.startTime >= slash.duration) {
      slash.isActive = false
      return false
    }
    return slash.isActive
  })
}

/**
 * Render all active slash effects with progressive reveal
 */
export const renderSlashEffects = (ctx: CanvasRenderingContext2D): void => {
  const slashImage = getCachedImage(getImagePath('slash.png'))
  const currentTime = Date.now()
  
  slashEffects.forEach(slash => {
    if (!slash.isActive) return
    
    // Calculate animation progress (0 to 1)
    const elapsed = currentTime - slash.startTime
    const progress = Math.min(elapsed / slash.duration, 1)
    
    // Calculate opacity using bezier curve
    const opacity = calculateSlashOpacity(progress)
    if (opacity <= 0) return
    
    ctx.save()
    
    // Apply opacity
    ctx.globalAlpha = opacity
    
    // Move to slash position and apply rotation
    ctx.translate(slash.x, slash.y)
    ctx.rotate(slash.rotation)
    
    if (slashImage) {
      // Calculate reveal progress (0 to 1) - faster reveal than full animation
      const revealProgress = Math.min(progress * 2, 1) // Reveal happens in first half of animation
      
      const halfSize = SLASH_RENDER_SIZE / 2
      
      // Apply clipping in the already-rotated coordinate system
      ctx.save()
      
      // Create clipping mask - these coordinates are in the rotated space
      ctx.beginPath()
      if (slash.rotation === 0) {
        // Upward slash (from bottom wall) - reveal left to right
        const revealWidth = SLASH_RENDER_SIZE * revealProgress
        ctx.rect(-halfSize, -halfSize, revealWidth, SLASH_RENDER_SIZE)
      } else if (slash.rotation === Math.PI / 2) {
        // Left wall slash (90° clockwise) - reveal top to bottom
        // In the rotated coordinate system, top-to-bottom becomes left-to-right
        const revealWidth = SLASH_RENDER_SIZE * revealProgress
        ctx.rect(-halfSize, -halfSize, revealWidth, SLASH_RENDER_SIZE)
      } else if (slash.rotation === -Math.PI / 2) {
        // Right wall slash (90° counter-clockwise) - reveal bottom to top
        // In the rotated coordinate system, bottom-to-top becomes right-to-left
        const revealWidth = SLASH_RENDER_SIZE * revealProgress
        const startX = halfSize - revealWidth
        ctx.rect(startX, -halfSize, revealWidth, SLASH_RENDER_SIZE)
      }
      ctx.clip()
      
      // Draw the slash image centered (already in rotated space)
      drawImage(ctx, slashImage, -halfSize, -halfSize, SLASH_RENDER_SIZE, SLASH_RENDER_SIZE)
      
      ctx.restore()
    } else {
      // Fallback: simple white line if image not loaded (with reveal effect)
      const revealProgress = Math.min(progress * 2, 1)
      
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      
      const lineLength = SLASH_RENDER_SIZE * 0.8
      const halfLength = lineLength / 2
      
      if (slash.rotation === 0) {
        // Upward slash - reveal left to right
        const revealLength = lineLength * revealProgress
        ctx.beginPath()
        ctx.moveTo(-halfLength, 0)
        ctx.lineTo(-halfLength + revealLength, 0)
        ctx.stroke()
      } else {
        // For rotated slashes, draw full line (fallback is simpler)
        ctx.beginPath()
        ctx.moveTo(0, -halfLength)
        ctx.lineTo(0, halfLength * revealProgress * 2 - halfLength)
        ctx.stroke()
      }
    }
    
    ctx.restore()
  })
}

/**
 * Clear all slash effects (for game reset)
 */
export const clearSlashEffects = (): void => {
  slashEffects = []
}

/**
 * Get count of active slash effects (for debugging)
 */
export const getActiveSlashCount = (): number => {
  return slashEffects.filter(slash => slash.isActive).length
}
