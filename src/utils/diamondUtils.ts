/**
 * Diamond collection and management utilities (similar to coinUtils)
 */

import { getImagePath } from './assetUtils'
import { getCachedImage } from './imageUtils'
import { generateUUID } from './uuidUtils'
// Remove the canvasUtils import as we'll handle coordinates differently

// Diamond configuration
const DIAMOND_SCALED_SIZE = 32 // Rendered size on canvas
const DIAMOND_LIFESPAN_MS = 8000 // 8 seconds lifespan
const DIAMOND_GRACE_PERIOD_MS = 1000 // 1 second grace period before movement
const DIAMOND_MOVEMENT_SPEED_MULTIPLIER = 1.2

// Diamond data structure
interface Diamond {
  uuid: string
  x: number // Battlefield grid X coordinate
  y: number // Battlefield grid Y coordinate
  spawnTime: number
  isCollected: boolean
  // Movement properties
  trajectory?: DiamondTrajectory
  progress: number // 0-1, progress along trajectory
  velocity: number // Current movement speed
}

// Diamond trajectory (bezier curve)
interface DiamondTrajectory {
  startX: number
  startY: number
  controlX: number
  controlY: number
  endX: number
  endY: number
}

// Active diamonds and counter
let activeDiamonds: Diamond[] = []
let collectedDiamonds = 0

/**
 * Spawn a diamond at the specified position
 */
export const spawnDiamond = (enemyOrPosition: { x: number, y: number, type?: { width: number, height: number } }): void => {
  const centerX = enemyOrPosition.x + (enemyOrPosition.type?.width || 1) / 2
  const centerY = enemyOrPosition.y + (enemyOrPosition.type?.height || 1) / 2
  
  const diamond: Diamond = {
    uuid: generateUUID(),
    x: centerX,
    y: centerY,
    spawnTime: Date.now(),
    isCollected: false,
    trajectory: generateDiamondTrajectory(centerX, centerY),
    progress: 0,
    velocity: 0
  }
  
  activeDiamonds.push(diamond)
}

/**
 * Generate a curved trajectory for diamond movement
 */
const generateDiamondTrajectory = (startX: number, startY: number): DiamondTrajectory => {
  // For now, use simple canvas coordinates (diamonds will be implemented later)
  const canvasX = 100 + startX * 50 // Simple conversion
  const canvasY = 100 + startY * 50 
  const endX = 20 // Top-left corner X
  const endY = 40 // Top-left corner Y
  
  // Create dramatic curved path - diamond flies to side first then curves to corner
  const sideDirection = Math.random() < 0.5 ? -1 : 1 // Randomly choose left or right
  const controlX = canvasX + (200 + Math.random() * 100) * sideDirection
  const controlY = canvasY - (150 + Math.random() * 100)
  
  return {
    startX: canvasX,
    startY: canvasY,
    controlX,
    controlY,
    endX,
    endY
  }
}

/**
 * Calculate position along bezier curve
 */
const calculateBezierPosition = (trajectory: DiamondTrajectory, t: number): { x: number, y: number } => {
  // Quadratic bezier curve: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
  const oneMinusT = 1 - t
  const x = oneMinusT * oneMinusT * trajectory.startX + 
            2 * oneMinusT * t * trajectory.controlX + 
            t * t * trajectory.endX
  const y = oneMinusT * oneMinusT * trajectory.startY + 
            2 * oneMinusT * t * trajectory.controlY + 
            t * t * trajectory.endY
  
  return { x, y }
}

/**
 * Update diamond positions and handle collection
 */
export const updateDiamonds = (deltaTime: number): void => {
  const currentTime = Date.now()
  
  activeDiamonds.forEach(diamond => {
    const age = currentTime - diamond.spawnTime
    
    // Check for expiration
    if (age > DIAMOND_LIFESPAN_MS) {
      diamond.isCollected = true
      return
    }
    
    // Grace period - diamond doesn't move yet
    if (age < DIAMOND_GRACE_PERIOD_MS) {
      return
    }
    
    // Build up velocity over 2 seconds after grace period
    const movementAge = age - DIAMOND_GRACE_PERIOD_MS
    const accelerationDuration = 2000 // 2 seconds
    
    if (movementAge < accelerationDuration) {
      // Cubic ease-in for smooth acceleration
      const accelerationProgress = movementAge / accelerationDuration
      diamond.velocity = accelerationProgress * accelerationProgress * accelerationProgress * DIAMOND_MOVEMENT_SPEED_MULTIPLIER
    } else {
      diamond.velocity = DIAMOND_MOVEMENT_SPEED_MULTIPLIER
    }
    
    // Move along trajectory
    diamond.progress += diamond.velocity * deltaTime / 3000 // Adjust speed
    
    // Check if reached destination (collect diamond)
    if (diamond.progress >= 1.0) {
      diamond.isCollected = true
      collectedDiamonds++
    }
  })
  
  // Remove collected diamonds
  activeDiamonds = activeDiamonds.filter(diamond => !diamond.isCollected)
}

/**
 * Render all active diamonds
 */
export const renderDiamonds = (ctx: CanvasRenderingContext2D): void => {
  const diamondImage = getCachedImage(getImagePath('diamond.png'))
  if (!diamondImage) return
  
  activeDiamonds.forEach(diamond => {
    let x, y
    
    if (diamond.trajectory && diamond.progress > 0) {
      // Moving along trajectory
      const position = calculateBezierPosition(diamond.trajectory, diamond.progress)
      x = position.x
      y = position.y
    } else {
      // Stationary at spawn position (simple conversion for now)
      x = 100 + diamond.x * 50
      y = 100 + diamond.y * 50
    }
    
    // Center the diamond sprite
    const renderX = x - DIAMOND_SCALED_SIZE / 2
    const renderY = y - DIAMOND_SCALED_SIZE / 2
    
    ctx.drawImage(
      diamondImage,
      renderX, renderY, DIAMOND_SCALED_SIZE, DIAMOND_SCALED_SIZE
    )
  })
}

/**
 * Clear all diamonds (for game restart)
 */
export const clearDiamonds = (): void => {
  activeDiamonds = []
}

/**
 * Get collected diamond count
 */
export const getCollectedDiamondCount = (): number => {
  return collectedDiamonds
}

/**
 * Reset diamond collection counter
 */
export const resetDiamondCount = (): void => {
  collectedDiamonds = 0
  clearDiamonds()
}

/**
 * Spend (subtract) one diamond from inventory
 */
export const spendDiamond = (): boolean => {
  if (collectedDiamonds > 0) {
    collectedDiamonds--
    return true
  }
  return false
}
