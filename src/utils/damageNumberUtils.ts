/**
 * Flying damage number system - shows damage values that fly upward when enemies take damage
 */

import { Enemy } from '../types/enemies'
import { generateUUID } from './uuidUtils'
import { UI_FONT_SIZE_HEALTH } from '../config/gameConfig'
import { getBattlefieldCellCoords } from './enemyUtils'

// Damage number configuration
const DAMAGE_NUMBER_DURATION_MS = 2000 // 2 seconds
const DAMAGE_NUMBER_RISE_DISTANCE = 60 // pixels to rise
const DAMAGE_NUMBER_FADE_START = 0.3 // Start fading at 30% through animation

interface DamageNumber {
  id: string
  uuid: string
  damage: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  startTime: number
  duration: number
  isActive: boolean
}

// Active damage numbers
let damageNumbers: DamageNumber[] = []

/**
 * Spawn a flying damage number above an enemy
 */
export const spawnDamageNumber = (enemy: Enemy, damage: number): void => {
  // Calculate position above the enemy's center
  const enemyCenterX = enemy.x + (enemy.type.width - 1) / 2
  const enemyCenterY = enemy.y + (enemy.type.height - 1) / 2
  
  // Get canvas coordinates for the enemy center
  const coords = getBattlefieldCellCoords(enemyCenterX, enemyCenterY)
  
  // Position slightly above the enemy's head
  const startX = coords.x + (enemy.type.width * 40) / 2 // Center of enemy
  const startY = coords.y - 10 // Above the enemy
  
  spawnDamageNumberAtPosition(startX, startY, damage)
}

/**
 * Spawn a flying damage number at specific canvas coordinates
 */
export const spawnDamageNumberAtPosition = (x: number, y: number, damage: number): void => {
  const damageNumber: DamageNumber = {
    id: `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uuid: generateUUID(),
    damage,
    startX: x,
    startY: y,
    currentX: x,
    currentY: y,
    startTime: Date.now(),
    duration: DAMAGE_NUMBER_DURATION_MS,
    isActive: true
  }
  
  damageNumbers.push(damageNumber)
}

/**
 * Update all active damage numbers
 */
export const updateDamageNumbers = (): void => {
  const currentTime = Date.now()
  
  damageNumbers = damageNumbers.filter(damageNumber => {
    if (!damageNumber.isActive) {
      return false
    }
    
    const elapsed = currentTime - damageNumber.startTime
    
    // Remove if expired
    if (elapsed >= damageNumber.duration) {
      damageNumber.isActive = false
      return false
    }
    
    // Calculate animation progress (0 to 1)
    const progress = elapsed / damageNumber.duration
    
    // Update position - rise upward with easing
    const easedProgress = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
    damageNumber.currentY = damageNumber.startY - (DAMAGE_NUMBER_RISE_DISTANCE * easedProgress)
    
    // Add slight horizontal drift for visual interest
    damageNumber.currentX = damageNumber.startX + Math.sin(progress * Math.PI * 2) * 5
    
    return true
  })
}

/**
 * Render all active damage numbers
 */
export const renderDamageNumbers = (ctx: CanvasRenderingContext2D): void => {
  const currentTime = Date.now()
  
  damageNumbers.forEach(damageNumber => {
    if (!damageNumber.isActive) return
    
    const elapsed = currentTime - damageNumber.startTime
    const progress = elapsed / damageNumber.duration
    
    // Calculate opacity with fade out
    let opacity = 1.0
    if (progress > DAMAGE_NUMBER_FADE_START) {
      const fadeProgress = (progress - DAMAGE_NUMBER_FADE_START) / (1 - DAMAGE_NUMBER_FADE_START)
      opacity = 1.0 - fadeProgress
    }
    
    // Determine if this is a healing number (positive damage means healing)
    const isHealing = damageNumber.id.includes('healing_')
    
    // Draw damage/healing number
    ctx.save()
    if (isHealing) {
      ctx.fillStyle = `rgba(0, 220, 0, ${opacity})` // Bright green for healing
      ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.8})` // Black outline
    } else {
      ctx.fillStyle = `rgba(220, 20, 20, ${opacity})` // Bright red for damage
      ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.8})` // Black outline
    }
    
    ctx.lineWidth = 2
    ctx.font = `${UI_FONT_SIZE_HEALTH}px "Pixelify Sans", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const numberText = isHealing ? `+${damageNumber.damage}` : `-${damageNumber.damage}`
    
    // Draw text with outline
    ctx.strokeText(numberText, damageNumber.currentX, damageNumber.currentY)
    ctx.fillText(numberText, damageNumber.currentX, damageNumber.currentY)
    
    ctx.restore()
  })
}

/**
 * Spawn a green healing number at specific canvas coordinates
 */
export const spawnHealingNumber = (x: number, y: number, healAmount: number): void => {
  const healingNumber: DamageNumber = {
    id: `healing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uuid: generateUUID(),
    damage: healAmount, // Use damage field for heal amount
    startX: x,
    startY: y,
    currentX: x,
    currentY: y,
    startTime: Date.now(),
    duration: DAMAGE_NUMBER_DURATION_MS,
    isActive: true
  }
  
  damageNumbers.push(healingNumber)
}

/**
 * Clear all damage numbers (for game restart)
 */
export const clearDamageNumbers = (): void => {
  damageNumbers = []
}

/**
 * Get count of active damage numbers (for debugging)
 */
export const getDamageNumberCount = (): number => {
  return damageNumbers.filter(dn => dn.isActive).length
}
