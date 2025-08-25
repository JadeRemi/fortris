/**
 * Coin system for reward drops when enemies are defeated
 */

import { generateUUID } from './uuidUtils'
import { getCachedImage, drawImage } from './imageUtils'
import { getImagePath } from './assetUtils'
import type { Enemy } from '../types/enemies'
import { getBattlefieldCellCoords } from './enemyUtils'
import { BATTLEFIELD_CELL_SIZE, COIN_GRACE_PERIOD_MS } from '../config/gameConfig'

// Coin configuration
const COIN_LIFESPAN_MS = 5000 // 5 seconds fallback (if not collected)
const COIN_RENDER_SIZE = 32 // Rendered size in pixels
const COIN_MOVEMENT_SPEED_MULTIPLIER = 1.2 // Movement speed multiplier (slower buildup)
const COIN_COLLECTION_ZONE_RADIUS = 30 // Pixels from top-left corner to consider "collected"

// Coin trajectory data
interface CoinTrajectory {
  startX: number
  startY: number
  endX: number
  endY: number
  controlX: number // Bezier curve control point
  controlY: number // Bezier curve control point
  totalDistance: number
}

// Enhanced coin data structure
interface Coin {
  id: string
  uuid: string
  x: number // Current canvas x position
  y: number // Current canvas y position
  startTime: number
  lifespan: number
  spriteScale?: number
  isActive: boolean
  isCollected: boolean // Whether this coin has been collected
  trajectory: CoinTrajectory // Curve path data
  progress: number // 0.0 to 1.0 movement progress along curve
  velocity: number // Current movement speed (builds up over time)
}

// Active coins and collection counter
let coins: Coin[] = []
let collectedCoins: number = 0 // Global counter for collected coins

/**
 * Generate a curved trajectory from start point to top-left corner
 * Creates more dramatic curves that go to the side first
 */
const generateCoinTrajectory = (startX: number, startY: number): CoinTrajectory => {
  const endX = 0 // Top-left corner x
  const endY = 0 // Top-left corner y
  
  // Create more dramatic curved paths that go sideways first
  // Instead of using midpoint, create control points that are offset significantly
  
  // Determine which side to curve towards based on coin position
  const coinQuadrant = {
    left: startX < 960,  // Left half of screen
    top: startY < 540    // Top half of screen
  }
  
  // Generate control point that creates a dramatic sideways curve
  let controlX: number, controlY: number
  
  if (coinQuadrant.left && coinQuadrant.top) {
    // Top-left quadrant: curve up and right first
    controlX = startX + Math.random() * 300 + 200 // Go right significantly
    controlY = Math.max(0, startY - Math.random() * 200 - 100) // Go up a bit
  } else if (!coinQuadrant.left && coinQuadrant.top) {
    // Top-right quadrant: curve up and left first
    controlX = Math.max(0, startX - Math.random() * 300 - 200) // Go left significantly
    controlY = Math.max(0, startY - Math.random() * 200 - 100) // Go up a bit
  } else if (coinQuadrant.left && !coinQuadrant.top) {
    // Bottom-left quadrant: curve down and right first
    controlX = startX + Math.random() * 400 + 250 // Go right significantly
    controlY = startY + Math.random() * 150 + 50 // Go down a bit more
  } else {
    // Bottom-right quadrant: curve down and left first
    controlX = Math.max(0, startX - Math.random() * 400 - 250) // Go left significantly
    controlY = startY + Math.random() * 150 + 50 // Go down a bit more
  }
  
  // Add some randomness to make each curve unique
  const randomVariation = 100
  controlX += (Math.random() - 0.5) * randomVariation
  controlY += (Math.random() - 0.5) * randomVariation
  
  // Ensure control point stays within reasonable bounds
  controlX = Math.max(-100, Math.min(2020, controlX)) // Allow slight offscreen
  controlY = Math.max(-100, Math.min(1180, controlY)) // Allow slight offscreen
  
  // Calculate approximate total distance for speed calculations
  const totalDistance = Math.sqrt(
    Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2)
  )
  
  return {
    startX,
    startY,
    endX,
    endY,
    controlX,
    controlY,
    totalDistance
  }
}

/**
 * Calculate position along bezier curve given progress (0.0 to 1.0)
 */
const calculateBezierPosition = (trajectory: CoinTrajectory, progress: number): { x: number, y: number } => {
  const t = Math.max(0, Math.min(1, progress)) // Clamp to [0, 1]
  const oneMinusT = 1 - t
  
  // Quadratic bezier curve formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
  const x = oneMinusT * oneMinusT * trajectory.startX +
            2 * oneMinusT * t * trajectory.controlX +
            t * t * trajectory.endX
            
  const y = oneMinusT * oneMinusT * trajectory.startY +
            2 * oneMinusT * t * trajectory.controlY +
            t * t * trajectory.endY
            
  return { x, y }
}

/**
 * Spawn a coin at the center of a defeated enemy's area
 */
export const spawnCoin = (defeatedEnemy: Enemy): void => {
  // Calculate the center position of the enemy's occupied area
  const enemyCoords = getBattlefieldCellCoords(defeatedEnemy.x, Math.max(defeatedEnemy.y, 0))
  const enemyWidth = defeatedEnemy.type.width * BATTLEFIELD_CELL_SIZE
  const enemyHeight = Math.min(defeatedEnemy.type.height, 
                               defeatedEnemy.y + defeatedEnemy.type.height) * BATTLEFIELD_CELL_SIZE
  
  // Center the coin in the enemy's area
  const coinX = enemyCoords.x + enemyWidth / 2
  const coinY = enemyCoords.y + enemyHeight / 2
  
  // Generate trajectory for this coin
  const trajectory = generateCoinTrajectory(coinX, coinY)
  
  const newCoin: Coin = {
    id: `coin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uuid: generateUUID(),
    x: coinX,
    y: coinY,
    startTime: Date.now(),
    lifespan: COIN_LIFESPAN_MS,
    spriteScale: 1.0,
    isActive: true,
    isCollected: false,
    trajectory,
    progress: 0.0, // Start at beginning of curve
    velocity: 0.1 // Start with slow movement, will build up
  }
  
  coins.push(newCoin)
}

/**
 * Update all coins - move them along their trajectories and handle collection
 */
export const updateCoins = (deltaTime: number = 16.67): void => {
  const currentTime = Date.now()
  
  coins = coins.filter(coin => {
    if (!coin.isActive || coin.isCollected) {
      return false // Remove inactive or collected coins
    }
    
    // Check if coin has expired
    if (currentTime - coin.startTime >= coin.lifespan) {
      coin.isActive = false
      return false
    }
    
    // Handle grace period and velocity buildup
    const timeSinceSpawn = currentTime - coin.startTime
    
    // During grace period, coin doesn't move
    if (timeSinceSpawn < COIN_GRACE_PERIOD_MS) {
      return true // Keep coin active but don't move it
    }
    
    // After grace period, build up velocity more gradually
    const timeAfterGrace = timeSinceSpawn - COIN_GRACE_PERIOD_MS
    const timeFactor = Math.min(1.0, timeAfterGrace / 2000) // Build over 2 seconds instead of 1
    coin.velocity = 0.05 + (timeFactor * COIN_MOVEMENT_SPEED_MULTIPLIER) // Start even slower
    
    // Update progress along trajectory
    const progressIncrement = coin.velocity * (deltaTime / 1000) // Convert deltaTime to seconds
    coin.progress = Math.min(1.0, coin.progress + progressIncrement)
    
    // Calculate new position along bezier curve
    const newPosition = calculateBezierPosition(coin.trajectory, coin.progress)
    coin.x = newPosition.x
    coin.y = newPosition.y
    
    // Check if coin reached collection zone (near top-left corner)
    const distanceToTarget = Math.sqrt(coin.x * coin.x + coin.y * coin.y)
    if (distanceToTarget <= COIN_COLLECTION_ZONE_RADIUS || coin.progress >= 1.0) {
      // Coin collected!
      coin.isCollected = true
      collectedCoins++
      return false // Remove from active coins
    }
    
    return true // Keep coin active
  })
}

/**
 * Render all active coins
 */
export const renderCoins = (ctx: CanvasRenderingContext2D): void => {
  const coinImage = getCachedImage(getImagePath('coin.png'))
  
  coins.forEach(coin => {
    if (!coin.isActive) return
    
    ctx.save()
    
    if (coinImage) {
      // Calculate scale
      const scale = coin.spriteScale || 1.0
      const renderSize = COIN_RENDER_SIZE * scale
      
      // Center the scaled sprite
      const renderX = coin.x - renderSize / 2
      const renderY = coin.y - renderSize / 2
      
      // Draw the coin image
      drawImage(ctx, coinImage, renderX, renderY, renderSize, renderSize)
    } else {
      // Fallback: simple circle if image not loaded
      const scale = coin.spriteScale || 1.0
      const radius = (COIN_RENDER_SIZE / 2) * scale
      
      ctx.fillStyle = '#FFD700' // Gold color
      ctx.strokeStyle = '#B8860B' // Dark gold border
      ctx.lineWidth = 2
      
      ctx.beginPath()
      ctx.arc(coin.x, coin.y, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
    
    ctx.restore()
  })
}

/**
 * Clear all coins and reset collection counter (for game reset)
 */
export const clearCoins = (): void => {
  coins = []
  collectedCoins = 0
}

/**
 * Get count of active coins (for debugging/stats)
 */
export const getActiveCoinCount = (): number => {
  return coins.filter(coin => coin.isActive && !coin.isCollected).length
}

/**
 * Get total collected coins count
 */
export const getCollectedCoinCount = (): number => {
  return collectedCoins
}
