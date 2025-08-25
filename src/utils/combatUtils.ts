// Combat system for turn-based gameplay

import {
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  BATTLEFIELD_Y,
  BATTLEFIELD_CELL_SIZE,
  LEFT_WALL_X,
  LEFT_WALL_Y,
  LEFT_WALL_HEIGHT,
  RIGHT_WALL_X,
  RIGHT_WALL_Y,
  RIGHT_WALL_HEIGHT,
  RIGHT_WALL_WIDTH,
  BOTTOM_WALL_X,
  BOTTOM_WALL_Y,
  BOTTOM_WALL_WIDTH,
  BOTTOM_WALL_HEIGHT,
  WALL_CELL_SIZE,
  WALL_BORDER_WIDTH,
  TURN_COOLDOWN_MS,
  UNIT_ACTION_DELAY_MS,
  ATTACK_ANIMATION_DURATION_MS,
  HIT_ANIMATION_DURATION_MS,
  PROJECTILE_LIFESPAN_MS,
  PROJECTILE_SPEED,
  PROJECTILE_SIZE_RATIO
} from '../config/gameConfig'
import { getWallCell } from './wallExtensions'
import { UNIT_TYPES, getUnitById } from '../config/unitsConfig'
import { getCachedImage, drawImage } from './imageUtils'
import { processEnemySpawn, processEnemyTurn, renderEnemies, initializeBattlefield, getEnemyAt, removeEnemy, getBattlefieldCellCoords, getEnemiesInProcessingOrder } from './enemyUtils'
import { battlefieldToCanvas } from './battlefieldUtils'
import { addLogMessage } from './logsUtils'
import { generateUUID } from './uuidUtils'
import { getImagePath } from './assetUtils'
import { addPainEffect, cleanupPainEffects } from './painEffectUtils'
import { spawnCoin, updateCoins, renderCoins, clearCoins } from './coinUtils'
import { spawnSlashEffect, updateSlashEffects, renderSlashEffects, clearSlashEffects } from './slashUtils'

// Combat state management
interface CombatState {
  isActive: boolean
  currentTurnPhase: 'waiting' | 'ally-acting' | 'enemy-turn' | 'cooldown'
  currentUnitIndex: number
  turnStartTime: number
  lastActionTime: number
  turnNumber: number
}

// Animation states
interface AttackAnimation {
  cellX: number
  cellY: number
  startTime: number
  duration: number
  isActive: boolean
}

interface HitAnimation {
  battlefieldCol: number
  battlefieldRow: number
  startTime: number
  duration: number
  isActive: boolean
}

interface Projectile {
  id: string
  uuid: string // UUID for tracking and identification
  x: number
  y: number
  directionX: number
  directionY: number
  speed: number
  startTime: number
  lifespan: number
  size: number
  spriteScale?: number // Optional sprite scale (default 1.0 = 100%)
  isActive: boolean
}

// Global combat state
let combatState: CombatState = {
  isActive: false,
  currentTurnPhase: 'waiting',
  currentUnitIndex: 0,
  turnStartTime: 0,
  lastActionTime: 0,
  turnNumber: 0
}

let attackAnimations: AttackAnimation[] = []
let hitAnimations: HitAnimation[] = []
let projectiles: Projectile[] = []

// Unit action order: left wall (top to bottom), bottom wall (left to right), right wall (bottom to top)
interface UnitPosition {
  wallType: 'left' | 'right' | 'bottom'
  cellIndex: number
}

/**
 * Get ordered list of all possible unit positions
 */
const getUnitActionOrder = (): UnitPosition[] => {
  const positions: UnitPosition[] = []
  
  // Left wall: top to bottom
  for (let i = 0; i < LEVEL_HEIGHT; i++) {
    positions.push({ wallType: 'left', cellIndex: i })
  }
  
  // Bottom wall: left to right
  for (let i = 0; i < LEVEL_WIDTH; i++) {
    positions.push({ wallType: 'bottom', cellIndex: i })
  }
  
  // Right wall: bottom to top
  for (let i = LEVEL_HEIGHT - 1; i >= 0; i--) {
    positions.push({ wallType: 'right', cellIndex: i })
  }
  
  return positions
}

const unitActionOrder = getUnitActionOrder()

/**
 * Check if any ally units are placed on the walls
 */
const hasUnitsPlaced = (): boolean => {
  // Check all wall positions for placed units
  for (let i = 0; i < unitActionOrder.length; i++) {
    const position = unitActionOrder[i]
    const wallCell = getWallCell(position.wallType, position.cellIndex)
    if (wallCell && wallCell.isOccupied && wallCell.occupiedBy) {
      return true
    }
  }
  return false
}

/**
 * Start the combat system (only if units are placed)
 */
export const startCombat = () => {
  if (!hasUnitsPlaced()) {
    return false
  }
  
  // Initialize battlefield for enemy tracking
  initializeBattlefield()
  
  combatState.isActive = true
  combatState.currentTurnPhase = 'waiting'
  combatState.currentUnitIndex = 0
  combatState.turnStartTime = Date.now()
  combatState.lastActionTime = Date.now()
  combatState.turnNumber = 1
  
  return true
}

/**
 * Stop the combat system
 */
export const stopCombat = () => {
  combatState.isActive = false
  combatState.currentTurnPhase = 'waiting'
  combatState.turnNumber = 0 // Reset turn counter
  
  // Clear all animations, projectiles, coins, and slash effects
  attackAnimations = []
  hitAnimations = []
  projectiles = []
  clearCoins()
  clearSlashEffects()
}

/**
 * Update combat system - call this in the main game loop
 */
export const updateCombat = (deltaTime: number) => {
  if (!combatState.isActive) return
  
  const currentTime = Date.now()
  
  // Update animations, projectiles, coins, and slash effects
  updateAnimations(currentTime)
  updateProjectiles(deltaTime, currentTime)
  updateCoins(deltaTime) // Pass deltaTime for coin movement
  updateSlashEffects()
  
  // Cleanup expired pain effects
  cleanupPainEffects()
  
  // Handle turn phases
  switch (combatState.currentTurnPhase) {
    case 'waiting':
      // Wait for turn cooldown before starting ally actions
      if (currentTime - combatState.turnStartTime >= TURN_COOLDOWN_MS) {
        combatState.currentTurnPhase = 'ally-acting'
        combatState.currentUnitIndex = 0
        combatState.lastActionTime = currentTime
      }
      break
      
    case 'ally-acting':
      // Process ally unit actions with delays
      if (currentTime - combatState.lastActionTime >= UNIT_ACTION_DELAY_MS) {
        const hasMoreUnits = processNextUnitAction(currentTime)
        if (!hasMoreUnits) {
          // All ally units have acted, start enemy turn
          combatState.currentTurnPhase = 'enemy-turn'
          combatState.turnStartTime = currentTime
        }
        combatState.lastActionTime = currentTime
      }
      break
      
    case 'enemy-turn':
      // Process enemy spawning and movement
      processEnemySpawn()
      processEnemyTurn()
      
      // Enemy turn is instant, go to cooldown
      combatState.currentTurnPhase = 'cooldown'
      combatState.turnStartTime = currentTime
      break
      
    case 'cooldown':
      // Wait for cooldown before starting next turn
      if (currentTime - combatState.turnStartTime >= TURN_COOLDOWN_MS) {
        combatState.currentTurnPhase = 'ally-acting'
        combatState.currentUnitIndex = 0
        combatState.lastActionTime = currentTime
        combatState.turnNumber += 1 // Increment turn number

      }
      break
  }
}

/**
 * Process the next unit's action
 * @returns true if there are more units to process, false if turn is complete
 */
const processNextUnitAction = (currentTime: number): boolean => {
  while (combatState.currentUnitIndex < unitActionOrder.length) {
    const position = unitActionOrder[combatState.currentUnitIndex]
    const wallCell = getWallCell(position.wallType, position.cellIndex)
    
    if (wallCell && wallCell.isOccupied && wallCell.occupiedBy) {
      // Unit found - perform action
      performUnitAction(position, wallCell.occupiedBy, currentTime)
      combatState.currentUnitIndex++
      return true // Action performed, wait for delay
    } else {
      // Empty cell - skip without delay
      combatState.currentUnitIndex++
    }
  }
  
  // All units processed
  return false
}

/**
 * Get pixel coordinates for a wall cell
 */
const getWallCellCoords = (wallType: 'left' | 'right' | 'bottom', cellIndex: number) => {
  let cellX: number, cellY: number
  
  switch (wallType) {
    case 'left': {
      const cellSpacing = (LEFT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
      cellX = LEFT_WALL_X + WALL_BORDER_WIDTH
      cellY = LEFT_WALL_Y + WALL_BORDER_WIDTH + cellIndex * (WALL_CELL_SIZE + cellSpacing)
      break
    }
    case 'right': {
      const cellSpacing = (RIGHT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
      cellX = RIGHT_WALL_X + WALL_BORDER_WIDTH
      cellY = RIGHT_WALL_Y + WALL_BORDER_WIDTH + cellIndex * (WALL_CELL_SIZE + cellSpacing)
      break
    }
    case 'bottom': {
      const cellSpacing = (BOTTOM_WALL_WIDTH - WALL_BORDER_WIDTH * 2 - LEVEL_WIDTH * WALL_CELL_SIZE) / (LEVEL_WIDTH - 1)
      cellX = BOTTOM_WALL_X + WALL_BORDER_WIDTH + cellIndex * (WALL_CELL_SIZE + cellSpacing)
      cellY = BOTTOM_WALL_Y + WALL_BORDER_WIDTH
      break
    }
  }
  
  return { x: cellX, y: cellY }
}



/**
 * Perform unit action based on unit type and position
 */
const performUnitAction = (position: UnitPosition, unitType: string, currentTime: number) => {
  const wallCoords = getWallCellCoords(position.wallType, position.cellIndex)
  
  // Start attack animation for the unit
  attackAnimations.push({
    cellX: wallCoords.x,
    cellY: wallCoords.y,
    startTime: currentTime,
    duration: ATTACK_ANIMATION_DURATION_MS,
    isActive: true
  })
  
  if (unitType === UNIT_TYPES.SWORDSMAN.id) {
    // Melee attack: strike adjacent battlefield cell (slash effect spawns only if enemy present)
    performMeleeAttack(position, currentTime)
  } else if (unitType === UNIT_TYPES.BOWMAN.id) {
    // Ranged attack: spawn projectile
    performRangedAttack(position, currentTime)
  }
}

/**
 * Perform melee attack on adjacent battlefield cell
 * Only attacks if there's an enemy in the target cell
 */
const performMeleeAttack = (position: UnitPosition, currentTime: number) => {
  let targetCol: number, targetRow: number
  
  switch (position.wallType) {
    case 'left':
      // Strike leftmost column of battlefield
      targetCol = 0
      targetRow = position.cellIndex
      break
    case 'right':
      // Strike rightmost column of battlefield
      targetCol = LEVEL_WIDTH - 1
      targetRow = position.cellIndex
      break
    case 'bottom':
      // Strike bottom row of battlefield
      targetCol = position.cellIndex
      targetRow = LEVEL_HEIGHT - 1
      break
  }
  
  // Check if there's an enemy in the target cell
  const targetEnemy = getEnemyAt(targetCol, targetRow)
  
  // Only perform attack if there's an enemy to hit
  if (!targetEnemy) {
    return // Skip this attack - no target
  }
  
  // Spawn slash effect since we have a valid target
  spawnSlashEffect(position.wallType, position.cellIndex)
  
  // Deal damage to the enemy using unit's damage value
  const wallCell = getWallCell(position.wallType, position.cellIndex)
  const unitType = getUnitById(wallCell?.occupiedBy!)
  const damage = unitType?.damage || 1 // Use unit's damage, fallback to 1
  targetEnemy.health -= damage
  
  // Add pain effect for visual feedback
  addPainEffect(targetEnemy)
  
  // Add hit animation
  hitAnimations.push({
    battlefieldCol: targetCol,
    battlefieldRow: targetRow,
    startTime: currentTime,
    duration: HIT_ANIMATION_DURATION_MS,
    isActive: true
  })
  
  // Add combat log
  const attackerName = 'Swordsman' // Currently only swordsmen do melee attacks
  addLogMessage(`${targetEnemy.type.name} is hit by ${attackerName} for ${damage} damage`)
  
  // Check if enemy should be removed (health <= 0)
  if (targetEnemy.health <= 0) {
    spawnCoin(targetEnemy) // Spawn coin before removing enemy
    removeEnemy(targetEnemy)
    addLogMessage(`${targetEnemy.type.name} is defeated!`)
  }
}

/**
 * Perform ranged attack by spawning projectile
 */
const performRangedAttack = (position: UnitPosition, currentTime: number) => {
  const wallCoords = getWallCellCoords(position.wallType, position.cellIndex)
  const projectileSize = WALL_CELL_SIZE * PROJECTILE_SIZE_RATIO
  
  // Start projectile at center of unit cell
  const startX = wallCoords.x + WALL_CELL_SIZE / 2
  const startY = wallCoords.y + WALL_CELL_SIZE / 2
  
  let directionX: number, directionY: number
  
  switch (position.wallType) {
    case 'left':
      // Shoot right (towards battlefield)
      directionX = 1
      directionY = 0
      break
    case 'right':
      // Shoot left (towards battlefield)
      directionX = -1
      directionY = 0
      break
    case 'bottom':
      // Shoot up (towards battlefield)
      directionX = 0
      directionY = -1
      break
  }
  
  // Create projectile
  const projectile: Projectile = {
    id: `arrow_${currentTime}_${Math.random()}`,
    uuid: generateUUID(),
    x: startX,
    y: startY,
    directionX,
    directionY,
    speed: PROJECTILE_SPEED,
    startTime: currentTime,
    lifespan: PROJECTILE_LIFESPAN_MS,
    size: projectileSize,
    isActive: true
  }
  
  projectiles.push(projectile)
}

/**
 * Update all animations
 */
const updateAnimations = (currentTime: number) => {
  // Update attack animations
  attackAnimations = attackAnimations.filter(anim => {
    if (currentTime - anim.startTime >= anim.duration) {
      anim.isActive = false
      return false
    }
    return true
  })
  
  // Update hit animations
  hitAnimations = hitAnimations.filter(anim => {
    if (currentTime - anim.startTime >= anim.duration) {
      anim.isActive = false
      return false
    }
    return true
  })
}

/**
 * Update all projectiles
 */
const updateProjectiles = (deltaTime: number, currentTime: number) => {
  projectiles = projectiles.filter(projectile => {
    if (currentTime - projectile.startTime >= projectile.lifespan) {
      projectile.isActive = false
      return false
    }
    
    // Move projectile
    projectile.x += projectile.directionX * projectile.speed * (deltaTime / 1000)
    projectile.y += projectile.directionY * projectile.speed * (deltaTime / 1000)
    
    // Check for collision with enemies
    const hitEnemy = checkProjectileEnemyCollision(projectile)
    if (hitEnemy) {
      // Deal damage based on unit type (bowman damage)
      const damage = UNIT_TYPES.BOWMAN.damage
      hitEnemy.health -= damage
      
      // Add pain effect for visual feedback
      addPainEffect(hitEnemy)
      
      // Add hit animation at enemy position
      hitAnimations.push({
        battlefieldCol: hitEnemy.x,
        battlefieldRow: Math.max(hitEnemy.y, 0),
        startTime: currentTime,
        duration: HIT_ANIMATION_DURATION_MS,
        isActive: true
      })
      
      // Add combat log
      addLogMessage(`${hitEnemy.type.name} is hit by Arrow for ${damage} damage`)
      
      // Check if enemy should be removed
      if (hitEnemy.health <= 0) {
        spawnCoin(hitEnemy) // Spawn coin before removing enemy
        removeEnemy(hitEnemy)
        addLogMessage(`${hitEnemy.type.name} is defeated!`)
      }
      
      // Remove projectile after hit
      projectile.isActive = false
      return false
    }
    
    // Check if projectile has left extended bounds (includes walls and beyond battlefield)
    const leftBound = LEFT_WALL_X - projectile.size
    const rightBound = RIGHT_WALL_X + RIGHT_WALL_WIDTH + projectile.size
    const topBound = BATTLEFIELD_Y - projectile.size - 100 // Extra space above battlefield
    const bottomBound = BOTTOM_WALL_Y + BOTTOM_WALL_HEIGHT + projectile.size
    
    if (projectile.x < leftBound || projectile.x > rightBound || 
        projectile.y < topBound || projectile.y > bottomBound) {
      projectile.isActive = false
      return false
    }
    
    return true
  })
}

/**
 * Check if projectile collides with any enemy
 */
const checkProjectileEnemyCollision = (projectile: Projectile): any => {
  const enemies = getEnemiesInProcessingOrder() // Get all active enemies
  
  for (const enemy of enemies) {
    // Calculate enemy bounds in canvas coordinates
    const enemyCoords = getBattlefieldCellCoords(enemy.x, Math.max(enemy.y, 0))
    const enemyWidth = enemy.type.width * BATTLEFIELD_CELL_SIZE
    const enemyHeight = Math.min(enemy.type.height, enemy.y + enemy.type.height) * BATTLEFIELD_CELL_SIZE // Only visible part
    
    // Check collision using simple AABB (axis-aligned bounding box)
    const projectileLeft = projectile.x - projectile.size / 2
    const projectileRight = projectile.x + projectile.size / 2
    const projectileTop = projectile.y - projectile.size / 2
    const projectileBottom = projectile.y + projectile.size / 2
    
    const enemyLeft = enemyCoords.x
    const enemyRight = enemyCoords.x + enemyWidth
    const enemyTop = enemyCoords.y
    const enemyBottom = enemyCoords.y + enemyHeight
    
    // AABB collision detection
    if (projectileLeft < enemyRight && 
        projectileRight > enemyLeft && 
        projectileTop < enemyBottom && 
        projectileBottom > enemyTop) {
      return enemy // Collision detected
    }
  }
  
  return null // No collision
}

/**
 * Render all combat effects
 */
export const renderCombatEffects = (ctx: CanvasRenderingContext2D) => {
  renderEnemies(ctx)
  renderSlashEffects(ctx) // Render slash effects above enemies but below other effects
  renderAttackAnimations(ctx)
  renderHitAnimations(ctx)
  renderProjectiles(ctx)
  renderCoins(ctx)
}

/**
 * Render attack animations (golden borders on attacking units)
 */
const renderAttackAnimations = (ctx: CanvasRenderingContext2D) => {
  const currentTime = Date.now()
  
  attackAnimations.forEach(anim => {
    if (!anim.isActive) return
    
    const progress = (currentTime - anim.startTime) / anim.duration
    const intensity = 1.0 - progress * 0.7 // Start bright, end at dark brown (not black)
    
    // Golden color interpolation - ends at dark brown instead of black
    const r = Math.floor(255 * Math.max(intensity, 0.3)) // Don't go below dark brown red
    const g = Math.floor(215 * Math.max(intensity, 0.2)) // Don't go below dark brown green
    const b = Math.floor(0 * intensity)   // No blue
    
    ctx.save()
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`
    ctx.lineWidth = 4
    
    // Draw rounded rectangle
    const radius = 6
    ctx.beginPath()
    ctx.moveTo(anim.cellX + radius, anim.cellY)
    ctx.arcTo(anim.cellX + WALL_CELL_SIZE, anim.cellY, anim.cellX + WALL_CELL_SIZE, anim.cellY + WALL_CELL_SIZE, radius)
    ctx.arcTo(anim.cellX + WALL_CELL_SIZE, anim.cellY + WALL_CELL_SIZE, anim.cellX, anim.cellY + WALL_CELL_SIZE, radius)
    ctx.arcTo(anim.cellX, anim.cellY + WALL_CELL_SIZE, anim.cellX, anim.cellY, radius)
    ctx.arcTo(anim.cellX, anim.cellY, anim.cellX + WALL_CELL_SIZE, anim.cellY, radius)
    ctx.closePath()
    ctx.stroke()
    
    ctx.restore()
  })
}

/**
 * Render hit animations (red borders on struck battlefield cells)
 */
const renderHitAnimations = (ctx: CanvasRenderingContext2D) => {
  const currentTime = Date.now()
  
  hitAnimations.forEach(anim => {
    if (!anim.isActive) return
    
    const progress = (currentTime - anim.startTime) / anim.duration
    let intensity: number
    
    if (progress < 0.2) {
      // First 20% - fade in
      intensity = progress / 0.2
    } else {
      // Remaining 80% - fade out
      intensity = 1.0 - ((progress - 0.2) / 0.8)
    }
    
    // Red color interpolation - ends at dark brown instead of black
    const r = Math.floor(255 * Math.max(intensity, 0.3)) // Don't go below dark brown red
    const g = Math.floor(50 * Math.max(intensity, 0.2)) // Add some green for brown tint
    const b = Math.floor(0 * intensity)   // No blue
    
    // Use battlefieldToCanvas for precise cell boundary alignment
    const coords = battlefieldToCanvas(anim.battlefieldRow, anim.battlefieldCol)
    
    ctx.save()
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`
    const lineWidth = 6 // Thick red border
    ctx.lineWidth = lineWidth
    
    // Draw inner rounded rectangle for hit animation 
    // Adjust coordinates and size to draw inside the cell
    const inset = lineWidth / 2 // Move inward by half the line width
    const innerX = coords.x + inset
    const innerY = coords.y + inset
    const innerSize = BATTLEFIELD_CELL_SIZE - lineWidth
    
    const radius = 4
    ctx.beginPath()
    ctx.moveTo(innerX + radius, innerY)
    ctx.arcTo(innerX + innerSize, innerY, innerX + innerSize, innerY + innerSize, radius)
    ctx.arcTo(innerX + innerSize, innerY + innerSize, innerX, innerY + innerSize, radius)
    ctx.arcTo(innerX, innerY + innerSize, innerX, innerY, radius)
    ctx.arcTo(innerX, innerY, innerX + innerSize, innerY, radius)
    ctx.closePath()
    ctx.stroke()
    
    ctx.restore()
  })
}

/**
 * Render projectiles (arrows)
 */
const renderProjectiles = (ctx: CanvasRenderingContext2D) => {
  projectiles.forEach(projectile => {
    if (!projectile.isActive) return
    
    ctx.save()
    
    // Try to get the arrow image
    const arrowImage = getCachedImage(getImagePath('arrow.png'))
    if (arrowImage) {
      // Calculate scaling and size
      const spriteScale = projectile.spriteScale || 1.0
      const scaledSize = projectile.size * spriteScale
      
      // Calculate rotation based on direction and sprite orientation
      let rotation = 0
      if (projectile.directionX === 1) rotation = Math.PI / 2 // Left wall: 90° clockwise
      else if (projectile.directionX === -1) rotation = -Math.PI / 2 // Right wall: 90° counter-clockwise
      else if (projectile.directionY === -1) rotation = 0 // Bottom wall: no rotation
      
      // Rotate and draw arrow image with scaling
      ctx.translate(projectile.x, projectile.y)
      ctx.rotate(rotation)
      
      drawImage(ctx, arrowImage, 
        -scaledSize / 2, 
        -scaledSize / 2,
        scaledSize, 
        scaledSize
      )
    } else {
      // Fallback: simple rectangle if image not loaded
      const spriteScale = projectile.spriteScale || 1.0
      const scaledSize = projectile.size * spriteScale
      
      ctx.fillStyle = '#8B4513' // Brown color for arrow
      ctx.fillRect(
        projectile.x - scaledSize / 2,
        projectile.y - scaledSize / 2,
        scaledSize,
        scaledSize
      )
    }
    
    ctx.restore()
  })
}

/**
 * Check if combat system is active
 */
export const isCombatActive = (): boolean => {
  return combatState.isActive
}

/**
 * Get current turn number
 */
export const getCurrentTurn = (): number => {
  return combatState.turnNumber
}

/**
 * Check if combat should auto-start (when units are placed and combat is not active)
 */
export const shouldAutoStartCombat = (): boolean => {
  return !combatState.isActive && hasUnitsPlaced()
}

/**
 * Skip current ally turn and proceed directly to enemy phase
 */
export const skipTurn = (): void => {
  if (!combatState.isActive) return
  
  // Only allow skipping during ally phases (waiting or ally-acting)
  if (combatState.currentTurnPhase !== 'waiting' && combatState.currentTurnPhase !== 'ally-acting') {
    return
  }
  
  // Skip directly to enemy phase
  combatState.currentTurnPhase = 'enemy-turn'
  combatState.lastActionTime = Date.now()
  combatState.currentUnitIndex = 0
  
  // Process enemy spawning first
  processEnemySpawn()
  
  // Then process enemy movement
  processEnemyTurn()
  
  // Move to cooldown phase
  combatState.currentTurnPhase = 'cooldown'
  combatState.turnStartTime = Date.now()
}

/**
 * Get current combat phase for debugging
 */
export const getCombatState = () => {
  return {
    isActive: combatState.isActive,
    phase: combatState.currentTurnPhase,
    unitIndex: combatState.currentUnitIndex,
    totalUnits: unitActionOrder.length,
    turnNumber: combatState.turnNumber
  }
}
