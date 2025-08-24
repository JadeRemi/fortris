/**
 * Coin system for reward drops when enemies are defeated
 */

import { generateUUID } from './uuidUtils'
import { getCachedImage, drawImage } from './imageUtils'
import { getImagePath } from './assetUtils'
import type { Enemy } from '../types/enemies'
import { getBattlefieldCellCoords } from './enemyUtils'
import { BATTLEFIELD_CELL_SIZE } from '../config/gameConfig'

// Coin configuration
const COIN_LIFESPAN_MS = 5000 // 5 seconds
const COIN_RENDER_SIZE = 32 // Rendered size in pixels

// Coin data structure
interface Coin {
  id: string
  uuid: string
  x: number // Canvas x position (center of coin)
  y: number // Canvas y position (center of coin)
  startTime: number
  lifespan: number
  spriteScale?: number // Optional sprite scale
  isActive: boolean
}

// Active coins
let coins: Coin[] = []

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
  
  const newCoin: Coin = {
    id: `coin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uuid: generateUUID(),
    x: coinX,
    y: coinY,
    startTime: Date.now(),
    lifespan: COIN_LIFESPAN_MS,
    spriteScale: 1.0, // Default scale
    isActive: true
  }
  
  coins.push(newCoin)
}

/**
 * Update all coins - remove expired ones
 */
export const updateCoins = (): void => {
  const currentTime = Date.now()
  coins = coins.filter(coin => {
    if (currentTime - coin.startTime >= coin.lifespan) {
      coin.isActive = false
      return false
    }
    return coin.isActive
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
 * Clear all coins (for game reset)
 */
export const clearCoins = (): void => {
  coins = []
}

/**
 * Get count of active coins (for debugging/stats)
 */
export const getActiveCoinCount = (): number => {
  return coins.filter(coin => coin.isActive).length
}
