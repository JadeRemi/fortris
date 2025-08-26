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
  PROJECTILE_SIZE_RATIO,
  MONK_HEALING_AMOUNT,
  BATTLEFIELD_CELL_BORDER_WIDTH,
  ICICLE_DAMAGE,
  LANCER_DAMAGE_MULTIPLIER,
  BARBARIAN_DAMAGE_MULTIPLIER,
  BARBARIAN_MAIN_TARGET_MULTIPLIER,
  BISHOP_MAX_HEALTH_BOOST
} from '../config/gameConfig'
import { getWallCell, leftWallCells, rightWallCells, bottomWallCells } from './wallExtensions'
import { getUnitById, ALLY_UNITS } from '../config/allUnitsConfig'
import { getCachedImage, drawImage } from './imageUtils'
import { processEnemySpawn, processEnemyTurn, renderEnemies, initializeBattlefield, getEnemyAt, removeEnemy, getBattlefieldCellCoords, getEnemiesInProcessingOrder, damageAlly, enemies } from './enemyUtils'
import { battlefieldToCanvas } from './battlefieldUtils'
import { addLogMessage } from './logsUtils'
import { generateUUID } from './uuidUtils'
import { getImagePath } from './assetUtils'
import { addPainEffect, cleanupPainEffects } from './painEffectUtils'
import { spawnCoin, updateCoins, renderCoins, clearCoins } from './coinUtils'
import { spawnDiamond, updateDiamonds, renderDiamonds, clearDiamonds } from './diamondUtils'
import { spawnSlashEffect, updateSlashEffects, renderSlashEffects, clearSlashEffects } from './slashUtils'
import { updateClawsEffects, renderClawsEffects, clearClawsEffects } from './clawsUtils'
import { spawnDamageNumber, spawnHealingNumber, spawnMaxHealthBoostNumber, updateDamageNumbers, renderDamageNumbers, clearDamageNumbers } from './damageNumberUtils'
import { incrementOgreKills, incrementUnitsReached200Health, incrementSpearMultikills } from './challengeSystem'
import { COMBAT_MESSAGES } from '../config/messages'
import { LICH_PASSIVE_HEALING, LICH_PASSIVE_MAX_HEALTH_BOOST } from '../config/gameConfig'

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
  enemyUuid: string     // Track enemy by UUID instead of position
  enemyWidth: number    // Width of the enemy in cells
  enemyHeight: number   // Height of the enemy in cells
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
  unitType: string // Unit type that fired this projectile (for sprite selection and damage)
  isActive: boolean
  recentlyHitCells?: Set<string> // Track recently hit cell coordinates (e.g., "3,5") to prevent multi-hit on same cell
  enemyKillCount?: number // Track number of enemies killed by this spear (for multikill challenge)
}

interface EnemyProjectile {
  id: string
  uuid: string
  x: number
  y: number
  directionX: number
  directionY: number
  speed: number
  startTime: number
  lifespan: number
  size: number
  spriteScale?: number
  projectileType: string // Type of enemy projectile (e.g., 'icicle')
  damage: number
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

// Combat freeze state
let isCombatFrozen = false

// Skip turns mode state
let isSkipTurnsActive = false

let attackAnimations: AttackAnimation[] = []
let hitAnimations: HitAnimation[] = []
let projectiles: Projectile[] = []
let enemyProjectiles: EnemyProjectile[] = []

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
  enemyProjectiles = []
  clearCoins()
  clearDiamonds()
  clearSlashEffects()
  clearClawsEffects()
  clearDamageNumbers()
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
  updateEnemyProjectiles(deltaTime, currentTime)
  updateCoins(deltaTime) // Pass deltaTime for coin movement
  updateDiamonds(deltaTime) // Pass deltaTime for diamond movement
  updateSlashEffects()
  updateClawsEffects()
  updateDamageNumbers() // Update flying damage numbers
  
  // Cleanup expired pain effects
  cleanupPainEffects()
  
  // Skip turn processing if combat is frozen (but continue animations/projectiles)
  if (isCombatFrozen) return
  
  // Handle turn phases
  switch (combatState.currentTurnPhase) {
    case 'waiting':
      // Wait for turn cooldown before starting ally actions
      if (currentTime - combatState.turnStartTime >= TURN_COOLDOWN_MS) {
        if (isSkipTurnsActive) {
          // Auto-skip ally turns and go directly to enemy phase
          combatState.currentTurnPhase = 'enemy-turn'
          combatState.currentUnitIndex = 0
          combatState.lastActionTime = currentTime
          
          // Process enemy spawning first
          processEnemySpawn()
        } else {
          // Normal ally turn flow
          combatState.currentTurnPhase = 'ally-acting'
          combatState.currentUnitIndex = 0
          combatState.lastActionTime = currentTime
        }
      }
      break
      
    case 'ally-acting':
      // Check if skip turns mode is active - if so, skip directly to enemy phase
      if (isSkipTurnsActive) {
        combatState.currentTurnPhase = 'enemy-turn'
        combatState.currentUnitIndex = 0
        combatState.lastActionTime = currentTime
        
        // Process enemy spawning first
        processEnemySpawn()
        break
      }
      
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
 * Check if a melee unit has a valid target to attack
 */
const meleeUnitHasTarget = (position: UnitPosition): boolean => {
  let targetCol: number, targetRow: number
  
  switch (position.wallType) {
    case 'left':
      targetCol = 0
      targetRow = position.cellIndex
      break
    case 'right':
      targetCol = LEVEL_WIDTH - 1
      targetRow = position.cellIndex
      break
    case 'bottom':
      targetCol = position.cellIndex
      targetRow = LEVEL_HEIGHT - 1
      break
  }
  
  // Check if there's an enemy in the target cell
  const targetEnemy = getEnemyAt(targetCol, targetRow)
  return targetEnemy !== null
}

/**
 * Check if a bowman has enemies in their line of fire (any cell in the row/column they're facing)
 */
const bowmanHasTarget = (position: UnitPosition): boolean => {
  switch (position.wallType) {
    case 'left':
      // Check entire row (bowman shoots right across the battlefield)
      for (let col = 0; col < LEVEL_WIDTH; col++) {
        if (getEnemyAt(col, position.cellIndex) !== null) {
          return true
        }
      }
      break
    case 'right':
      // Check entire row (bowman shoots left across the battlefield)
      for (let col = 0; col < LEVEL_WIDTH; col++) {
        if (getEnemyAt(col, position.cellIndex) !== null) {
          return true
        }
      }
      break
    case 'bottom':
      // Check entire column (bowman shoots up across the battlefield)
      for (let row = 0; row < LEVEL_HEIGHT; row++) {
        if (getEnemyAt(position.cellIndex, row) !== null) {
          return true
        }
      }
      break
  }
  return false
}

/**
 * Check if a monk has injured allies to heal on the same wall (excluding itself)
 */
const monkHasHealingTarget = (position: UnitPosition): boolean => {
  // Use the same logic as actual healing to find targets (excludes the healer itself)
  const targetAlly = findClosestInjuredAlly(position, false) // Same wall only, excludes self
  return targetAlly !== null
}

/**
 * Check if bishop has any action available (healing or max health boost)
 */
const bishopHasAction = (position: UnitPosition): boolean => {
  // First check for healing targets on same wall
  let hasHealingTarget = findClosestInjuredAlly(position, false) !== null
  
  if (!hasHealingTarget) {
    // Check for healing targets on all walls
    hasHealingTarget = findClosestInjuredAlly(position, true) !== null
  }
  
  if (hasHealingTarget) {
    return true // Has healing target
  }
  
  // No healing targets, check for max health boost opportunity
  const boostTarget = findLowestHealthAllyForBoost(position)
  return boostTarget !== null
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
      // Check if this is a unit without a valid target/action
      if (wallCell.occupiedBy === ALLY_UNITS.SWORDSMAN.id || wallCell.occupiedBy === 'barbarian') {
        if (!meleeUnitHasTarget(position)) {
          // Melee unit with no target - skip without delay or animation
          combatState.currentUnitIndex++
          continue
        }
      } else if (wallCell.occupiedBy === ALLY_UNITS.BOWMAN.id || wallCell.occupiedBy === 'lancer') {
        if (!bowmanHasTarget(position)) {
          // Ranged unit with no enemies in line of fire - skip without delay or animation
          combatState.currentUnitIndex++
          continue
        }
      } else if (wallCell.occupiedBy === ALLY_UNITS.MONK.id) {
        if (!monkHasHealingTarget(position)) {
          // Monk with no healing target - skip without delay or animation
          combatState.currentUnitIndex++
          continue
        }
      } else if (wallCell.occupiedBy === 'bishop') {
        if (!bishopHasAction(position)) {
          // Bishop with no actions available - skip without delay or animation
          combatState.currentUnitIndex++
          continue
        }
      }
      
      // Unit found with valid action - perform action
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
  
  if (unitType === ALLY_UNITS.SWORDSMAN.id || unitType === 'barbarian') {
    // Melee attack: strike adjacent battlefield cell (slash effect spawns only if enemy present)
    performMeleeAttack(position, currentTime)
  } else if (unitType === ALLY_UNITS.BOWMAN.id || unitType === 'lancer') {
    // Ranged attack: spawn projectile
    performRangedAttack(position, unitType, currentTime)
  } else if (unitType === ALLY_UNITS.MONK.id || unitType === 'bishop') {
    // Healing: find and heal injured allies on the same wall
    performMonkHealing(position, currentTime)
  }
}

/**
 * Apply lich passive ability when an enemy dies adjacent to a lich
 */
const applyLichPassiveAbility = (dyingEnemy: any) => {
  // Skip lich passive ability if a skeleton dies (lich shouldn't benefit from its own minions)
  if (dyingEnemy.type.id === 'skeleton') {
    return
  }
  
  // Find all lich enemies adjacent to the dying enemy
  const adjacentLiches = findAdjacentLiches(dyingEnemy)
  
  // Apply healing and max health boost to each adjacent lich
  for (const lich of adjacentLiches) {
    // Initialize maxHealth if it doesn't exist
    if (!lich.maxHealth) {
      lich.maxHealth = lich.type.health
    }
    
    // Increase max health first
    lich.maxHealth += LICH_PASSIVE_MAX_HEALTH_BOOST
    
    // Heal the lich (up to new max health)
    const oldHealth = lich.health
    lich.health = Math.min(lich.health + LICH_PASSIVE_HEALING, lich.maxHealth)
    const actualHealing = lich.health - oldHealth
    
    // Calculate lich's center position for visual effects
    const lichCenterX = lich.x + (lich.type.width - 1) / 2
    const lichCenterY = lich.y + (lich.type.height - 1) / 2
    const coords = getBattlefieldCellCoords(lichCenterX, lichCenterY)
    const visualX = coords.x + (lich.type.width * 40) / 2 // Center of lich
    const visualY = coords.y - 10 // Above the lich
    
    // Show visual indicators if the lich gained health or max health
    if (actualHealing > 0) {
      // Show healing number
      spawnHealingNumber(visualX, visualY, actualHealing)
    }
    
    // Always show max health boost number (slightly offset to avoid overlap)
    spawnMaxHealthBoostNumber(visualX + 15, visualY, LICH_PASSIVE_MAX_HEALTH_BOOST)
  }
}

/**
 * Find all lich enemies adjacent to the given enemy
 */
const findAdjacentLiches = (targetEnemy: any): any[] => {
  const adjacentLiches: any[] = []
  
  // Check all possible adjacent positions around the dying enemy
  for (let dy = -1; dy <= targetEnemy.type.height; dy++) {
    for (let dx = -1; dx <= targetEnemy.type.width; dx++) {
      // Skip the cells occupied by the dying enemy itself
      if (dy >= 0 && dy < targetEnemy.type.height && dx >= 0 && dx < targetEnemy.type.width) {
        continue
      }
      
      const checkX = targetEnemy.x + dx
      const checkY = targetEnemy.y + dy
      
      // Find enemy at this position
      const potentialLich = getEnemyAt(checkX, checkY)
      
      // Check if it's a lich and not already in our list
      if (potentialLich && potentialLich.type.id === 'lich' && !adjacentLiches.some(l => l.uuid === potentialLich.uuid)) {
        adjacentLiches.push(potentialLich)
      }
    }
  }
  
  return adjacentLiches
}

/**
 * Deal damage to an enemy and handle all associated effects
 */
const dealDamageToEnemy = (enemy: any, damage: number, currentTime: number) => {
  enemy.health -= damage
  
  // Add pain effect for visual feedback
  addPainEffect(enemy)
  
  // Spawn flying damage number
  spawnDamageNumber(enemy, damage)
  
  // Add hit animation scaled to enemy size
  hitAnimations.push({
    enemyUuid: enemy.uuid,
    enemyWidth: enemy.type.width,
    enemyHeight: enemy.type.height, // Use full enemy height
    startTime: currentTime,
    duration: HIT_ANIMATION_DURATION_MS,
    isActive: true
  })
  
  // Add combat log
  addLogMessage(COMBAT_MESSAGES.enemyHit(enemy.type.name, damage))
  
  // Check if enemy should be removed (health <= 0)
  if (enemy.health <= 0) {
    // Apply lich passive ability before removing the enemy
    applyLichPassiveAbility(enemy)
    
    // Track ogre kills for challenge system
    if (enemy.type.id === 'ogre') {
      incrementOgreKills()
    }
    
    // Check if enemy drops loot based on their lootChance
    if (Math.random() <= enemy.type.lootChance) {
      // 95% chance for gold, 5% chance for diamond
      if (Math.random() <= 0.95) {
        spawnCoin(enemy) // Spawn gold coin
      } else {
        spawnDiamond(enemy) // Spawn diamond
      }
    }
    
    // Spawn icicle projectiles if this is an Ice Golem dying
    spawnIcicleProjectiles(enemy, currentTime)
    
    removeEnemy(enemy)
    // addLogMessage(`${enemy.type.name} is defeated!`) // Removed - not very useful
  }
}

/**
 * Deal barbarian area damage to cells adjacent to the main target
 */
const dealBarbarianAreaDamage = (mainCol: number, mainRow: number, damage: number, currentTime: number) => {
  // Adjacent cells: left, right, top (relative to the main target cell)
  const adjacentCells = [
    { col: mainCol - 1, row: mainRow }, // Left
    { col: mainCol + 1, row: mainRow }, // Right  
    { col: mainCol, row: mainRow - 1 }, // Top
  ]
  
  for (const cell of adjacentCells) {
    // Check bounds
    if (cell.col < 0 || cell.col >= LEVEL_WIDTH || cell.row < 0 || cell.row >= LEVEL_HEIGHT) {
      continue
    }
    
    // Check if there's an enemy in this cell
    const enemy = getEnemyAt(cell.col, cell.row)
    if (enemy) {
      dealDamageToEnemy(enemy, damage, currentTime)
    }
  }
}

/**
 * Perform melee attack on adjacent battlefield cell
 * Only attacks if there's an enemy in the target cell
 * Barbarians deal area damage to main target and adjacent cells
 */
const performMeleeAttack = (position: UnitPosition, currentTime: number) => {
  const unit = getWallCell(position.wallType, position.cellIndex)
  const attackerUnitType = unit?.occupiedBy || ''
  const isBarbarian = attackerUnitType === 'barbarian'
  
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
  
  // Calculate damage based on unit type
  const wallCell = getWallCell(position.wallType, position.cellIndex)
  const unitConfig = getUnitById(wallCell?.occupiedBy!)
  let baseDamage = unitConfig?.damage || 1 // Use unit's damage, fallback to 1
  
  if (isBarbarian) {
    // Barbarian deals upgraded damage
    baseDamage = ALLY_UNITS.SWORDSMAN.damage * BARBARIAN_DAMAGE_MULTIPLIER
    
    // Main target gets 2x barbarian damage (4x swordsman total)
    const mainTargetDamage = baseDamage * BARBARIAN_MAIN_TARGET_MULTIPLIER
    dealDamageToEnemy(targetEnemy, mainTargetDamage, currentTime)
    
    // Deal area damage to adjacent cells
    dealBarbarianAreaDamage(targetCol, targetRow, baseDamage, currentTime)
  } else {
    // Regular melee attack
    dealDamageToEnemy(targetEnemy, baseDamage, currentTime)
  }
}

/**
 * Perform monk/bishop healing on injured allies
 * Monks heal on same wall only, Bishops heal across all walls and can boost max health
 */
const performMonkHealing = (position: UnitPosition, _currentTime: number) => {
  const unit = getWallCell(position.wallType, position.cellIndex)
  const healerUnitType = unit?.occupiedBy || ''
  const isBishop = healerUnitType === 'bishop'
  
  // Find injured allies - bishops search all walls if needed
  let targetAlly = findClosestInjuredAlly(position, false) // Same wall first
  
  if (!targetAlly && isBishop) {
    // Bishop searches other walls if no targets on same wall
    targetAlly = findClosestInjuredAlly(position, true) // All walls
  }
  
  if (targetAlly) {
    // Heal the ally
    const currentHealth = targetAlly.wallCell.currentHealth || 0
    const maxHealth = targetAlly.wallCell.maxHealth || 0
    const healAmount = Math.min(MONK_HEALING_AMOUNT, maxHealth - currentHealth)
    
    if (healAmount > 0) {
      const newHealth = currentHealth + healAmount
      targetAlly.wallCell.currentHealth = newHealth
      
      // Check if unit reached 200 health for challenge tracking
      if (newHealth >= 200) {
        incrementUnitsReached200Health()
      }
      
      // Spawn green healing number
      const wallCoords = getWallCellCoords(targetAlly.wallType, targetAlly.cellIndex)
      const centerX = wallCoords.x + WALL_CELL_SIZE / 2
      const centerY = wallCoords.y - 10 // Above the ally
      spawnHealingNumber(centerX, centerY, healAmount)
      
      return
    }
  }
  
  // Bishop special ability: boost max health if no one needs healing
  if (isBishop && !targetAlly) {
    const boostTarget = findLowestHealthAllyForBoost(position)
    if (boostTarget) {
      const newMaxHealth = (boostTarget.wallCell.maxHealth || 0) + BISHOP_MAX_HEALTH_BOOST
      boostTarget.wallCell.maxHealth = newMaxHealth
      
      // Check if unit reached 200 health for challenge tracking
      if (newMaxHealth >= 200) {
        incrementUnitsReached200Health()
      }
      
      // Spawn blue boost number
      const wallCoords = getWallCellCoords(boostTarget.wallType, boostTarget.cellIndex)
      const centerX = wallCoords.x + WALL_CELL_SIZE / 2
      const centerY = wallCoords.y - 10 // Above the ally
      spawnMaxHealthBoostNumber(centerX, centerY, BISHOP_MAX_HEALTH_BOOST)
    }
  }
}

/**
 * Find the closest injured ally to a monk/bishop, prioritizing by range
 */
const findClosestInjuredAlly = (healerPosition: UnitPosition, searchAllWalls: boolean = false) => {
  if (!searchAllWalls) {
    // Original behavior - search same wall only
    for (let range = 1; range <= 12; range++) { // Max 12 cells (full wall length)
      const injuredAtRange = findInjuredAlliesAtRange(healerPosition, range)
      if (injuredAtRange.length > 0) {
        return getMostInjuredAlly(injuredAtRange)
      }
    }
  } else {
    // Bishop behavior - search all walls
    const allInjuredAllies = findAllInjuredAllies(healerPosition)
    if (allInjuredAllies.length > 0) {
      return getMostInjuredAlly(allInjuredAllies)
    }
  }
  return null // No injured allies found
}

/**
 * Get the most injured ally from a list (lowest health percentage)
 */
const getMostInjuredAlly = (allies: any[]) => {
  let mostInjuredAlly = allies[0]
  let lowestHealthPercent = (mostInjuredAlly.currentHealth || 0) / (mostInjuredAlly.maxHealth || 1)
  
  for (const ally of allies) {
    const healthPercent = (ally.currentHealth || 0) / (ally.maxHealth || 1)
    if (healthPercent < lowestHealthPercent) {
      mostInjuredAlly = ally
      lowestHealthPercent = healthPercent
    }
  }
  return mostInjuredAlly
}

/**
 * Find all injured allies on all walls (for bishop) - excludes the bishop itself
 */
const findAllInjuredAllies = (bishopPosition: UnitPosition) => {
  const allInjured: any[] = []
  const walls = [
    { wallType: 'left' as const, cells: leftWallCells },
    { wallType: 'right' as const, cells: rightWallCells },
    { wallType: 'bottom' as const, cells: bottomWallCells }
  ]
  
  for (const wall of walls) {
    for (let i = 0; i < wall.cells.length; i++) {
      const cell = wall.cells[i]
      if (cell && cell.isOccupied && cell.currentHealth !== undefined && cell.maxHealth !== undefined) {
        // Exclude the bishop itself
        if (wall.wallType === bishopPosition.wallType && i === bishopPosition.cellIndex) {
          continue
        }
        
        if (cell.currentHealth < cell.maxHealth) {
          allInjured.push({
            wallType: wall.wallType,
            cellIndex: i,
            wallCell: cell,
            currentHealth: cell.currentHealth,
            maxHealth: cell.maxHealth
          })
        }
      }
    }
  }
  
  return allInjured
}

/**
 * Find ally with lowest current health percentage for max health boost
 */
const findLowestHealthAllyForBoost = (bishopPosition: UnitPosition) => {
  const allAllies: any[] = []
  const walls = [
    { wallType: 'left' as const, cells: leftWallCells },
    { wallType: 'right' as const, cells: rightWallCells },
    { wallType: 'bottom' as const, cells: bottomWallCells }
  ]
  
  for (const wall of walls) {
    for (let i = 0; i < wall.cells.length; i++) {
      const cell = wall.cells[i]
      if (cell && cell.isOccupied && cell.currentHealth !== undefined && cell.maxHealth !== undefined) {
        // Exclude the bishop itself
        if (wall.wallType === bishopPosition.wallType && i === bishopPosition.cellIndex) {
          continue
        }
        
        allAllies.push({
          wallType: wall.wallType,
          cellIndex: i,
          wallCell: cell,
          currentHealth: cell.currentHealth,
          maxHealth: cell.maxHealth
        })
      }
    }
  }
  
  if (allAllies.length === 0) return null
  
  // Find ally with lowest current health
  let lowestHealthAlly = allAllies[0]
  let lowestHealth = lowestHealthAlly.currentHealth
  
  for (const ally of allAllies) {
    if (ally.currentHealth < lowestHealth) {
      lowestHealthAlly = ally
      lowestHealth = ally.currentHealth
    }
  }
  
  return lowestHealthAlly
}

/**
 * Find all injured allies at a specific range from the monk/bishop - excludes the healer itself
 */
const findInjuredAlliesAtRange = (healerPosition: UnitPosition, range: number) => {
  const injuredAtRange: Array<{
    wallType: 'left' | 'right' | 'bottom',
    cellIndex: number,
    wallCell: any,
    currentHealth: number,
    maxHealth: number
  }> = []
  
  // Get the appropriate wall cells based on wall type
  let wallCells: any[]
  let maxCells: number
  
  if (healerPosition.wallType === 'left') {
    wallCells = leftWallCells
    maxCells = leftWallCells.length
  } else if (healerPosition.wallType === 'right') {
    wallCells = rightWallCells
    maxCells = rightWallCells.length
  } else {
    wallCells = bottomWallCells
    maxCells = bottomWallCells.length
  }
  
  // Check cells at exactly this range
  const checkIndexes = [
    healerPosition.cellIndex - range, // Left/above
    healerPosition.cellIndex + range  // Right/below
  ]
  
  for (const i of checkIndexes) {
    if (i >= 0 && i < maxCells) {
      const cell = wallCells[i]
      if (cell && cell.isOccupied && cell.currentHealth !== undefined && cell.maxHealth !== undefined) {
        // Exclude the healer itself
        if (i === healerPosition.cellIndex) {
          continue
        }
        
        if (cell.currentHealth < cell.maxHealth) {
          injuredAtRange.push({
            wallType: healerPosition.wallType,
            cellIndex: i,
            wallCell: cell,
            currentHealth: cell.currentHealth,
            maxHealth: cell.maxHealth
          })
        }
      }
    }
  }
  
  return injuredAtRange
}

/**
 * Perform ranged attack by spawning projectile
 */
const performRangedAttack = (position: UnitPosition, unitType: string, currentTime: number) => {
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
  
  // Determine projectile type and sprite based on unit
  const projectileType = unitType === 'lancer' ? 'spear' : 'arrow'
  
  // Adjust projectile size for spears (make them bigger)
  const adjustedSize = unitType === 'lancer' ? projectileSize * 2.0 : projectileSize
  
  // Create projectile
  const projectile: Projectile = {
    id: `${projectileType}_${currentTime}_${Math.random()}`,
    uuid: generateUUID(),
    x: startX,
    y: startY,
    directionX,
    directionY,
    speed: PROJECTILE_SPEED,
    startTime: currentTime,
    lifespan: PROJECTILE_LIFESPAN_MS,
    size: adjustedSize,
    unitType, // Store which unit type fired this projectile
    isActive: true,
    recentlyHitCells: unitType === 'lancer' ? new Set<string>() : undefined, // Track hit cells for penetrating spears
    enemyKillCount: unitType === 'lancer' ? 0 : undefined // Track enemy kills for lancer spears
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
    const collisionResult = checkProjectileEnemyCollision(projectile)
    if (collisionResult) {
      const { enemy: hitEnemy, hitCells } = collisionResult
      
      // Filter out cells that have already been hit by this projectile
      const newlyHitCells = projectile.unitType === 'lancer' && projectile.recentlyHitCells 
        ? hitCells.filter(cell => !projectile.recentlyHitCells!.has(cell))
        : hitCells
      
      if (newlyHitCells.length > 0) {
        // Calculate damage per cell based on unit type
        let damagePerCell = ALLY_UNITS.BOWMAN.damage // Default to bowman damage
        if (projectile.unitType === 'lancer') {
          damagePerCell = ALLY_UNITS.BOWMAN.damage * LANCER_DAMAGE_MULTIPLIER // 2x bowman damage
        } else if (projectile.unitType === ALLY_UNITS.BOWMAN.id) {
          damagePerCell = ALLY_UNITS.BOWMAN.damage
        }
        
        // Deal damage for each newly hit cell
        const totalDamage = newlyHitCells.length * damagePerCell
        hitEnemy.health -= totalDamage
        
        // Track newly hit cells for penetrating projectiles
        if (projectile.unitType === 'lancer' && projectile.recentlyHitCells) {
          newlyHitCells.forEach(cell => projectile.recentlyHitCells!.add(cell))
        }
        
        // Add pain effect for visual feedback
        addPainEffect(hitEnemy)
        
        // Spawn flying damage number showing total damage
        spawnDamageNumber(hitEnemy, totalDamage)
        
        // Add hit animation scaled to enemy size
        hitAnimations.push({
          enemyUuid: hitEnemy.uuid,
          enemyWidth: hitEnemy.type.width,
          enemyHeight: hitEnemy.type.height, // Use full enemy height
          startTime: currentTime,
          duration: HIT_ANIMATION_DURATION_MS,
          isActive: true
        })
        
        // Add combat log
        addLogMessage(COMBAT_MESSAGES.enemyHit(hitEnemy.type.name, totalDamage))
        
        // Check if enemy should be removed
        if (hitEnemy.health <= 0) {
          // Apply lich passive ability before removing the enemy
          applyLichPassiveAbility(hitEnemy)
          
          // Track enemy kill for lancer spear multikill challenge
          if (projectile.unitType === 'lancer' && projectile.enemyKillCount !== undefined) {
            projectile.enemyKillCount++
            
            // Check if this spear has killed 5 enemies
            if (projectile.enemyKillCount >= 5) {
              incrementSpearMultikills()
            }
          }
          
          // Track ogre kills for challenge system
          if (hitEnemy.type.id === 'ogre') {
            incrementOgreKills()
          }
          
          // Check if enemy drops loot based on their lootChance
          if (Math.random() <= hitEnemy.type.lootChance) {
            // 95% chance for gold, 5% chance for diamond
            if (Math.random() <= 0.95) {
              spawnCoin(hitEnemy) // Spawn gold coin
            } else {
              spawnDiamond(hitEnemy) // Spawn diamond
            }
          }
          
          // Spawn icicle projectiles if this is an Ice Golem dying
          spawnIcicleProjectiles(hitEnemy, currentTime)
          
          removeEnemy(hitEnemy)
          // addLogMessage(`${hitEnemy.type.name} is defeated!`) // Removed - not very useful
        }
        
        // Lancer spears penetrate through enemies, arrows stop on first hit
        if (projectile.unitType !== 'lancer') {
          projectile.isActive = false
          return false
        }
      }
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
 * Check if projectile collides with any enemy and return collision details
 */
const checkProjectileEnemyCollision = (projectile: Projectile): {enemy: any, hitCells: string[]} | null => {
  const enemies = getEnemiesInProcessingOrder() // Get all active enemies
  
  for (const enemy of enemies) {
    const hitCells = getProjectileEnemyCellOverlaps(projectile, enemy)
    if (hitCells.length > 0) {
      return { enemy, hitCells }
    }
  }
  
  return null // No collision
}

/**
 * Get which specific cells of an enemy the projectile overlaps with
 */
const getProjectileEnemyCellOverlaps = (projectile: Projectile, enemy: any): string[] => {
  const hitCells: string[] = []
  
  // Check each cell of the enemy
  for (let dy = 0; dy < enemy.type.height; dy++) {
    for (let dx = 0; dx < enemy.type.width; dx++) {
      const cellX = enemy.x + dx
      const cellY = enemy.y + dy
      
      // Skip cells that are above the visible battlefield
      if (cellY < 0) continue
      
      // Get canvas coordinates for this cell
      const cellCoords = getBattlefieldCellCoords(cellX, cellY)
      const cellLeft = cellCoords.x
      const cellRight = cellCoords.x + BATTLEFIELD_CELL_SIZE
      const cellTop = cellCoords.y
      const cellBottom = cellCoords.y + BATTLEFIELD_CELL_SIZE
      
      // Check projectile collision with this specific cell
      const projectileLeft = projectile.x - projectile.size / 2
      const projectileRight = projectile.x + projectile.size / 2
      const projectileTop = projectile.y - projectile.size / 2
      const projectileBottom = projectile.y + projectile.size / 2
      
      // AABB collision detection with this cell
      if (projectileLeft < cellRight && 
          projectileRight > cellLeft && 
          projectileTop < cellBottom && 
          projectileBottom > cellTop) {
        hitCells.push(`${cellX},${cellY}`)
      }
    }
  }
  
  return hitCells
}

/**
 * Update enemy projectiles (icicles from Ice Golem death)
 */
const updateEnemyProjectiles = (deltaTime: number, currentTime: number) => {
  enemyProjectiles = enemyProjectiles.filter(projectile => {
    if (currentTime - projectile.startTime >= projectile.lifespan) {
      projectile.isActive = false
      return false
    }
    
    // Move projectile
    projectile.x += projectile.directionX * projectile.speed * (deltaTime / 1000)
    projectile.y += projectile.directionY * projectile.speed * (deltaTime / 1000)
    
    // Check for collision with wall units
    const hitWallUnit = checkEnemyProjectileWallCollision(projectile)
    if (hitWallUnit) {
      // Deal damage to wall unit
      damageAlly(hitWallUnit.wallType, hitWallUnit.cellIndex, projectile.damage, null)
      
      // Remove projectile after hit
      projectile.isActive = false
      return false
    }
    
    // Check if projectile has left extended bounds
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
 * Check if enemy projectile collides with any wall unit
 */
const checkEnemyProjectileWallCollision = (projectile: EnemyProjectile): {wallType: 'left' | 'right' | 'bottom', cellIndex: number} | null => {
  const projectileRadius = projectile.size / 2
  
  // Check left wall
  for (let i = 0; i < leftWallCells.length; i++) {
    const cell = leftWallCells[i]
    if (!cell.isOccupied) continue
    
    const cellX = LEFT_WALL_X + WALL_BORDER_WIDTH
    const cellY = LEFT_WALL_Y + i * WALL_CELL_SIZE
    const cellCenterX = cellX + WALL_CELL_SIZE / 2
    const cellCenterY = cellY + WALL_CELL_SIZE / 2
    
    const distance = Math.sqrt(
      Math.pow(projectile.x - cellCenterX, 2) + 
      Math.pow(projectile.y - cellCenterY, 2)
    )
    
    if (distance < projectileRadius + WALL_CELL_SIZE / 2) {
      return {wallType: 'left', cellIndex: i}
    }
  }
  
  // Check right wall
  for (let i = 0; i < rightWallCells.length; i++) {
    const cell = rightWallCells[i]
    if (!cell.isOccupied) continue
    
    const cellX = RIGHT_WALL_X + WALL_BORDER_WIDTH
    const cellY = RIGHT_WALL_Y + i * WALL_CELL_SIZE
    const cellCenterX = cellX + WALL_CELL_SIZE / 2
    const cellCenterY = cellY + WALL_CELL_SIZE / 2
    
    const distance = Math.sqrt(
      Math.pow(projectile.x - cellCenterX, 2) + 
      Math.pow(projectile.y - cellCenterY, 2)
    )
    
    if (distance < projectileRadius + WALL_CELL_SIZE / 2) {
      return {wallType: 'right', cellIndex: i}
    }
  }
  
  // Check bottom wall
  for (let i = 0; i < bottomWallCells.length; i++) {
    const cell = bottomWallCells[i]
    if (!cell.isOccupied) continue
    
    const cellX = BOTTOM_WALL_X + i * WALL_CELL_SIZE
    const cellY = BOTTOM_WALL_Y + WALL_BORDER_WIDTH
    const cellCenterX = cellX + WALL_CELL_SIZE / 2
    const cellCenterY = cellY + WALL_CELL_SIZE / 2
    
    const distance = Math.sqrt(
      Math.pow(projectile.x - cellCenterX, 2) + 
      Math.pow(projectile.y - cellCenterY, 2)
    )
    
    if (distance < projectileRadius + WALL_CELL_SIZE / 2) {
      return {wallType: 'bottom', cellIndex: i}
    }
  }
  
  return null // No collision
}

/**
 * Render enemy projectiles (icicles)
 */
const renderEnemyProjectiles = (ctx: CanvasRenderingContext2D) => {
  enemyProjectiles.forEach(projectile => {
    if (!projectile.isActive) return
    
    ctx.save()
    
    // Use icicle sprite
    const projectileImage = getCachedImage(getImagePath('icicle.png'))
    if (projectileImage) {
      // Calculate scaling and size
      const spriteScale = projectile.spriteScale || 1.0
      const scaledSize = projectile.size * spriteScale
      
      // Calculate rotation based on direction and sprite orientation
      let rotation = 0
      if (projectile.directionX === 1) rotation = Math.PI / 2 // Flying right: 90° clockwise
      else if (projectile.directionX === -1) rotation = -Math.PI / 2 // Flying left: 90° counter-clockwise
      else if (projectile.directionY === -1) rotation = 0 // Flying up: no rotation
      else if (projectile.directionY === 1) rotation = Math.PI // Flying down: 180°
      
      // Rotate and draw icicle image with scaling
      ctx.translate(projectile.x, projectile.y)
      ctx.rotate(rotation)
      
      drawImage(ctx, projectileImage, 
        -scaledSize / 2, 
        -scaledSize / 2,
        scaledSize, 
        scaledSize
      )
    } else {
      // Fallback: simple rectangle if image not loaded
      const spriteScale = projectile.spriteScale || 1.0
      const scaledSize = projectile.size * spriteScale
      
      // Light blue color for ice
      ctx.fillStyle = '#87CEEB'
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
 * Spawn icicle projectiles from Ice Golem death
 */
export const spawnIcicleProjectiles = (enemy: any, currentTime: number) => {
  // Only spawn if this is an Ice Golem
  if (enemy.type.id !== 'icegolem') return
  
  const projectileSize = BATTLEFIELD_CELL_SIZE * PROJECTILE_SIZE_RATIO * 1.5 // Slightly larger than arrows
  
  // Get battlefield coordinates for the Ice Golem
  const battlefieldCoords = getBattlefieldCellCoords(enemy.x, enemy.y)
  
  // Ice Golem is 2x3, so it has:
  // Left side: 3 cells (top, middle, bottom)
  // Right side: 3 cells (top, middle, bottom) 
  // Bottom: 2 cells (left, right)
  
  // Choose random cells for projectile launch points
  const leftSide = Math.floor(Math.random() * 3) // 0, 1, or 2 (top, middle, bottom)
  const rightSide = Math.floor(Math.random() * 3) // 0, 1, or 2 (top, middle, bottom)
  const bottomSide = Math.floor(Math.random() * 2) // 0 or 1 (left or right)
  
  // Left projectile (shoots left)
  const leftStartY = battlefieldCoords.y + leftSide * BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_SIZE / 2
  const leftProjectile: EnemyProjectile = {
    id: `icicle_left_${currentTime}_${Math.random()}`,
    uuid: generateUUID(),
    x: battlefieldCoords.x, // Left edge of enemy
    y: leftStartY,
    directionX: -1, // Shoot left
    directionY: 0,
    speed: PROJECTILE_SPEED * 0.8, // Slightly slower than ally projectiles
    startTime: currentTime,
    lifespan: PROJECTILE_LIFESPAN_MS,
    size: projectileSize,
    projectileType: 'icicle',
    damage: ICICLE_DAMAGE,
    isActive: true
  }
  
  // Right projectile (shoots right)  
  const rightStartY = battlefieldCoords.y + rightSide * BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_SIZE / 2
  const rightProjectile: EnemyProjectile = {
    id: `icicle_right_${currentTime}_${Math.random()}`,
    uuid: generateUUID(),
    x: battlefieldCoords.x + enemy.type.width * BATTLEFIELD_CELL_SIZE, // Right edge of enemy
    y: rightStartY,
    directionX: 1, // Shoot right
    directionY: 0,
    speed: PROJECTILE_SPEED * 0.8,
    startTime: currentTime,
    lifespan: PROJECTILE_LIFESPAN_MS,
    size: projectileSize,
    projectileType: 'icicle',
    damage: ICICLE_DAMAGE,
    isActive: true
  }
  
  // Bottom projectile (shoots down)
  const bottomStartX = battlefieldCoords.x + bottomSide * BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_SIZE / 2
  const bottomProjectile: EnemyProjectile = {
    id: `icicle_bottom_${currentTime}_${Math.random()}`,
    uuid: generateUUID(),
    x: bottomStartX,
    y: battlefieldCoords.y + enemy.type.height * BATTLEFIELD_CELL_SIZE, // Bottom edge of enemy
    directionX: 0,
    directionY: 1, // Shoot down
    speed: PROJECTILE_SPEED * 0.8,
    startTime: currentTime,
    lifespan: PROJECTILE_LIFESPAN_MS,
    size: projectileSize,
    projectileType: 'icicle',
    damage: ICICLE_DAMAGE,
    isActive: true
  }
  
  // Add all projectiles
  enemyProjectiles.push(leftProjectile, rightProjectile, bottomProjectile)
  

}

/**
 * Render all combat effects
 */
export const renderCombatEffects = (ctx: CanvasRenderingContext2D) => {
  renderEnemies(ctx)
  renderSlashEffects(ctx) // Render slash effects above enemies but below other effects
  renderClawsEffects(ctx) // Render claws effects above enemies but below other effects
  renderAttackAnimations(ctx)
  renderHitAnimations(ctx)
  renderProjectiles(ctx)
  renderEnemyProjectiles(ctx)
  renderCoins(ctx)
  renderDiamonds(ctx)
  // Render flying damage numbers last so they appear on top of everything
  renderDamageNumbers(ctx)
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
 * Render hit animations (red borders on struck enemies - scaled to enemy size)
 */
const renderHitAnimations = (ctx: CanvasRenderingContext2D) => {
  const currentTime = Date.now()
  
  hitAnimations.forEach(anim => {
    if (!anim.isActive) return
    
    // Find the enemy this animation is tracking
    const enemy = enemies.find(e => e.uuid === anim.enemyUuid)
    if (!enemy) {
      // Enemy was destroyed, mark animation as inactive
      anim.isActive = false
      return
    }
    
    const progress = (currentTime - anim.startTime) / anim.duration
    let intensity: number
    
    if (progress < 0.2) {
      // First 20% - fade in
      intensity = progress / 0.2
    } else {
      // Remaining 80% - fade out
      intensity = 1.0 - ((progress - 0.2) / 0.8)
    }
    
    // Red color interpolation - stay closer to red, don't go as dark
    const r = Math.floor(255 * Math.max(intensity, 0.6)) // Don't go below 60% red intensity
    const g = Math.floor(80 * Math.max(intensity, 0.3))  // Less green for more red color
    const b = Math.floor(0 * intensity)   // No blue
    
    // Get current enemy position (follows moving enemies)
    const visibleStartY = Math.max(enemy.y, 0)
    const coords = battlefieldToCanvas(visibleStartY, enemy.x)
    
    // Calculate visible portion for partially hidden enemies
    const visibleEndY = Math.min(enemy.y + enemy.type.height, LEVEL_HEIGHT)
    const visibleHeight = Math.max(0, visibleEndY - visibleStartY)
    
    if (visibleHeight <= 0) {
      // Enemy is completely above visible area
      return
    }
    
    ctx.save()
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`
    const lineWidth = 6 // Thick red border
    ctx.lineWidth = lineWidth
    
    // Calculate multi-cell dimensions (including borders between cells) for visible portion
    const totalWidth = enemy.type.width * BATTLEFIELD_CELL_SIZE + (enemy.type.width - 1) * BATTLEFIELD_CELL_BORDER_WIDTH
    const totalHeight = visibleHeight * BATTLEFIELD_CELL_SIZE + (visibleHeight - 1) * BATTLEFIELD_CELL_BORDER_WIDTH
    
    // Draw inner rounded rectangle for hit animation scaled to visible enemy size
    // Adjust coordinates and size to draw inside the enemy's visible area
    const inset = lineWidth / 2 // Move inward by half the line width
    const innerX = coords.x + inset
    const innerY = coords.y + inset
    const innerWidth = totalWidth - lineWidth
    const innerHeight = totalHeight - lineWidth
    
    const radius = 4
    ctx.beginPath()
    ctx.moveTo(innerX + radius, innerY)
    ctx.arcTo(innerX + innerWidth, innerY, innerX + innerWidth, innerY + innerHeight, radius)
    ctx.arcTo(innerX + innerWidth, innerY + innerHeight, innerX, innerY + innerHeight, radius)
    ctx.arcTo(innerX, innerY + innerHeight, innerX, innerY, radius)
    ctx.arcTo(innerX, innerY, innerX + innerWidth, innerY, radius)
    ctx.closePath()
    ctx.stroke()
    
    ctx.restore()
  })
}

/**
 * Render projectiles (arrows and spears)
 */
const renderProjectiles = (ctx: CanvasRenderingContext2D) => {
  projectiles.forEach(projectile => {
    if (!projectile.isActive) return
    
    ctx.save()
    
    // Determine sprite based on unit type that fired the projectile
    const spriteName = projectile.unitType === 'lancer' ? 'spear.png' : 'arrow.png'
    const projectileImage = getCachedImage(getImagePath(spriteName))
    if (projectileImage) {
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
      
      drawImage(ctx, projectileImage, 
        -scaledSize / 2, 
        -scaledSize / 2,
        scaledSize, 
        scaledSize
      )
    } else {
      // Fallback: simple rectangle if image not loaded
      const spriteScale = projectile.spriteScale || 1.0
      const scaledSize = projectile.size * spriteScale
      
      // Fallback colors: brown for arrows, grey for spears
      ctx.fillStyle = projectile.unitType === 'lancer' ? '#708090' : '#8B4513'
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
 * Toggle freeze state for combat turns (doesn't affect animations/projectiles)
 */
export const toggleFreeze = (): void => {
  isCombatFrozen = !isCombatFrozen
}

/**
 * Check if combat is currently frozen
 */
export const isFrozen = (): boolean => {
  return isCombatFrozen
}

/**
 * Toggle skip turns mode
 */
export const toggleSkipTurns = (): void => {
  isSkipTurnsActive = !isSkipTurnsActive
}

/**
 * Check if skip turns mode is active
 */
export const isSkipTurnsActive_export = (): boolean => {
  return isSkipTurnsActive
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
