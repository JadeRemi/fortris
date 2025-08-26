import { Enemy, EnemyType, BattlefieldCell } from '../types/enemies'
import { ENEMY_UNITS, getSpawnableEnemyUnits } from '../config/allUnitsConfig'
import { generateUUID } from './uuidUtils'
import { renderPainEffect } from './painEffectUtils'
import { spawnClawsEffect } from './clawsUtils'
import { getWallCell, getWallCellCoordinates } from './wallExtensions'
import { spawnDamageNumberAtPosition } from './damageNumberUtils'
// import { addLogMessage } from './logsUtils' // Not used anymore after log cleanup
import {
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  LEVEL_NEGATIVE_ROWS,
  MAX_ENEMY_SPAWNS_PER_TURN,
  LICH_SPAWN_CHANCE,

  BATTLEFIELD_X,
  BATTLEFIELD_Y,
  BATTLEFIELD_CELL_SIZE,
  BATTLEFIELD_CELL_BORDER_WIDTH,
  BATTLEFIELD_BORDER_WIDTH,
  WALL_CELL_SIZE
} from '../config/gameConfig'
import { getCachedImage } from './imageUtils'

// Global enemy state
export const enemies: Enemy[] = []
export const battlefieldCells: BattlefieldCell[][] = []

// Helper function to convert battlefield Y coordinate to array index
// Battlefield coordinates: y=-2, -1, 0, 1, 2, ... 11
// Array indices:          0,  1,  2, 3, 4, ... 13
const battlefieldYToArrayIndex = (battlefieldY: number): number => {
  return battlefieldY + LEVEL_NEGATIVE_ROWS
}

// Helper function to get battlefield cell safely
const getBattlefieldCell = (x: number, y: number): BattlefieldCell | null => {
  if (x < 0 || x >= LEVEL_WIDTH) return null
  
  const arrayIndex = battlefieldYToArrayIndex(y)
  if (arrayIndex < 0 || arrayIndex >= battlefieldCells.length) return null
  
  return battlefieldCells[arrayIndex][x]
}

// Helper function to set battlefield cell safely
const setBattlefieldCell = (x: number, y: number, enemyId: string | undefined): boolean => {
  const cell = getBattlefieldCell(x, y)
  if (!cell) return false
  
  cell.enemyId = enemyId
  return true
}

// Initialize battlefield cells grid (includes negative rows)
export const initializeBattlefield = (): void => {
  battlefieldCells.length = 0
  const totalRows = LEVEL_HEIGHT + LEVEL_NEGATIVE_ROWS // From y=-2 to y=11 = 14 total rows
  
  for (let arrayIndex = 0; arrayIndex < totalRows; arrayIndex++) {
    battlefieldCells[arrayIndex] = []
    // Convert array index back to battlefield Y coordinate
    const battlefieldY = arrayIndex - LEVEL_NEGATIVE_ROWS
    
    for (let x = 0; x < LEVEL_WIDTH; x++) {
      battlefieldCells[arrayIndex][x] = { x, y: battlefieldY }
    }
  }
  

}

// Get all available enemy types as array
export const getEnemyTypes = (): EnemyType[] => {
  return Object.values(ENEMY_UNITS)
}

// Check if top row has any enemies (even partially)
export const isTopRowBlocked = (): boolean => {
  for (const enemy of enemies) {
    // Check if enemy occupies the visible top row (y=0)
    if (enemy.y <= 0 && enemy.y + enemy.type.height > 0) {
      return true // Enemy is in or extends into the visible top row
    }
  }
  return false
}

// Roll for independent enemy spawns - each enemy type has its own chance
export const rollIndependentEnemySpawns = (): EnemyType[] => {
  // Check if top row is blocked first
  if (isTopRowBlocked()) {
    return []
  }
  
  const spawnableEnemies = getSpawnableEnemyUnits()
  const eligibleSpawns: EnemyType[] = []
  
  // Roll for each enemy type independently
  for (const enemyType of spawnableEnemies) {
    const spawnRoll = Math.random()
    if (spawnRoll <= enemyType.spawnChance) {
      eligibleSpawns.push(enemyType)
    }
  }
  
  // Limit to MAX_ENEMY_SPAWNS_PER_TURN
  const maxSpawns = Math.min(eligibleSpawns.length, MAX_ENEMY_SPAWNS_PER_TURN)
  
  // Shuffle and take up to maxSpawns (in case we have more eligible than max)
  if (eligibleSpawns.length > maxSpawns) {
    // Shuffle array
    for (let i = eligibleSpawns.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligibleSpawns[i], eligibleSpawns[j]] = [eligibleSpawns[j], eligibleSpawns[i]]
    }
    return eligibleSpawns.slice(0, maxSpawns)
  }
  
  return eligibleSpawns
}

// Find valid spawn position for enemy type
export const findSpawnPosition = (enemyType: EnemyType): { x: number; y: number } | null => {
  // Calculate spawn Y based on enemy height for gradual reveal
  // 1x1 enemies start at y=0 (immediately visible)
  // 2x2 enemies start at y=-1 (only bottom row visible initially)
  // 3x3 enemies start at y=-2 (only bottom row visible initially)
  const spawnY = 0 - (enemyType.height - 1)
  
  // Collect all valid positions
  const validPositions: number[] = []
  for (let x = 0; x <= LEVEL_WIDTH - enemyType.width; x++) {
    if (canPlaceEnemyAt(x, spawnY, enemyType)) {
      validPositions.push(x)
    }
  }
  
  // If no valid positions, return null
  if (validPositions.length === 0) {
    return null
  }
  
  // Randomly select one of the valid positions
  const randomIndex = Math.floor(Math.random() * validPositions.length)
  const selectedX = validPositions[randomIndex]
  

  return { x: selectedX, y: spawnY }
}

// Check if enemy can be placed at specific position
export const canPlaceEnemyAt = (x: number, y: number, enemyType: EnemyType): boolean => {
  return canPlaceEnemyAtExcluding(x, y, enemyType, null)
}

// Check if enemy can be placed at specific position, excluding a specific enemy ID
const canPlaceEnemyAtExcluding = (x: number, y: number, enemyType: EnemyType, excludeEnemyId: string | null): boolean => {
  // Check bounds - allow negative Y coordinates but ensure the enemy extends into visible area
  if (x < 0 || x + enemyType.width > LEVEL_WIDTH) {
    return false
  }
  
  // Check that enemy doesn't go too far down
  if (y + enemyType.height > LEVEL_HEIGHT) {
    return false
  }
  
  // Check that enemy doesn't go too far up (beyond available negative rows)
  if (y < -LEVEL_NEGATIVE_ROWS) {
    return false
  }
  
  // Check for collision with existing enemies (excluding the specified enemy)
  for (let dy = 0; dy < enemyType.height; dy++) {
    for (let dx = 0; dx < enemyType.width; dx++) {
      const checkX = x + dx
      const checkY = y + dy
      const cell = getBattlefieldCell(checkX, checkY)
      if (cell && cell.enemyId && cell.enemyId !== excludeEnemyId) {
        return false
      }
    }
  }
  
  return true
}

// Spawn a new enemy
export const spawnEnemy = (enemyType: EnemyType): boolean => {
  const position = findSpawnPosition(enemyType)
  if (!position) {
    return false
  }
  
  const newEnemy: Enemy = {
    id: `${enemyType.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uuid: generateUUID(),
    type: enemyType,
    x: position.x,
    y: position.y,
    health: enemyType.health, // Use the enemy type's health value
    maxHealth: enemyType.health, // Store max health for reference
    turnsSinceSpawn: 0
  }
  
  enemies.push(newEnemy)
  
  // Mark battlefield cells as occupied
  for (let dy = 0; dy < enemyType.height; dy++) {
    for (let dx = 0; dx < enemyType.width; dx++) {
      const cellX = position.x + dx
      const cellY = position.y + dy
      setBattlefieldCell(cellX, cellY, newEnemy.id)
    }
  }
  
  return true
}

// Get enemies ordered for processing (top-left to bottom-right)
export const getEnemiesInProcessingOrder = (): Enemy[] => {
  return [...enemies].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y // Top to bottom first
    return a.x - b.x // Left to right second
  })
}

// Check if enemy can move down
export const canEnemyMoveDown = (enemy: Enemy): boolean => {
  const newY = enemy.y + 1
  
  // Check if enemy would go out of bounds (into visible battlefield)
  if (newY + enemy.type.height > LEVEL_HEIGHT) {
    return false
  }
  
  // Check for collision with other enemies
  for (let dx = 0; dx < enemy.type.width; dx++) {
    const checkX = enemy.x + dx
    const checkY = newY + enemy.type.height - 1 // Check bottom row of new position
    
    const cell = getBattlefieldCell(checkX, checkY)
    if (cell && cell.enemyId && cell.enemyId !== enemy.id) {
      return false
    }
  }
  
  return true
}

// Move enemy down by one cell
export const moveEnemyDown = (enemy: Enemy): boolean => {
  if (!canEnemyMoveDown(enemy)) {
    return false
  }
  
  // Clear old position in battlefield cells
  for (let dy = 0; dy < enemy.type.height; dy++) {
    for (let dx = 0; dx < enemy.type.width; dx++) {
      setBattlefieldCell(enemy.x + dx, enemy.y + dy, undefined)
    }
  }
  
  // Move enemy
  enemy.y += 1
  
  // Mark new position in battlefield cells
  for (let dy = 0; dy < enemy.type.height; dy++) {
    for (let dx = 0; dx < enemy.type.width; dx++) {
      setBattlefieldCell(enemy.x + dx, enemy.y + dy, enemy.id)
    }
  }
  
  return true
}

// Process enemy turn (movement and attacks)
export const processEnemyTurn = (): void => {
  debugEnemyState('MOVE_START')
  
  const orderedEnemies = getEnemiesInProcessingOrder()
  
  for (const enemy of orderedEnemies) {
    // Try to move first
    const moved = moveEnemyDown(enemy)
    
    // If enemy couldn't move down, try pathfinding
    if (!moved) {
      const movedLaterally = tryPathfindingMovement(enemy)
      
      // If pathfinding didn't work either, try to attack adjacent allies
      if (!movedLaterally) {
        tryEnemyAttack(enemy)
        
        // Check if Lich couldn't move and try to spawn Skeleton (existing behavior)
        if (enemy.type.id === 'lich') {
          tryLichSkeletonSpawn(enemy)
        }
      }
    }
    
    enemy.turnsSinceSpawn += 1
  }
  
  debugEnemyState('MOVE_END')
}

/**
 * Try pathfinding movement when direct downward movement is blocked
 */
const tryPathfindingMovement = (enemy: Enemy): boolean => {
  // Check if there are any available spots in the row below
  const availableSpots = findAvailableSpotsBelow(enemy)
  
  if (availableSpots.length === 0) {
    return false // No spots available below, can't use pathfinding
  }
  
  // Find the best reachable spot
  const bestPath = findBestPath(enemy, availableSpots)
  
  if (!bestPath) {
    return false // No reachable spots
  }
  
  // Execute one step of the path (move left or right by 1 cell)
  return executeLateralMovement(enemy, bestPath.direction)
}

/**
 * Find available spots in the row below where this enemy could fit
 */
const findAvailableSpotsBelow = (enemy: Enemy): Array<{x: number, y: number}> => {
  const availableSpots: Array<{x: number, y: number}> = []
  const targetY = enemy.y + 1
  
  // Check if target row is valid
  if (targetY + enemy.type.height > LEVEL_HEIGHT) {
    return [] // Would go out of bounds
  }
  
  // Check each possible X position in the row below
  for (let x = 0; x <= LEVEL_WIDTH - enemy.type.width; x++) {
    if (canPlaceEnemyAtExcluding(x, targetY, enemy.type, enemy.id)) {
      availableSpots.push({x, y: targetY})
    }
  }
  
  return availableSpots
}

/**
 * Find the best path to reach available spots
 */
const findBestPath = (enemy: Enemy, availableSpots: Array<{x: number, y: number}>): {direction: 'left' | 'right', targetX: number, distance: number} | null => {
  let bestPath: {direction: 'left' | 'right', targetX: number, distance: number} | null = null
  let shortestDistance = Infinity
  
  for (const spot of availableSpots) {
    // Calculate distance and direction to reach this spot
    const distance = Math.abs(spot.x - enemy.x)
    const direction: 'left' | 'right' = spot.x < enemy.x ? 'left' : 'right'
    
    // Skip if spot is at current X position (shouldn't happen since we can't move down)
    if (distance === 0) continue
    
    // Check if the ENTIRE path is clear for lateral movement
    if (isLateralPathClear(enemy, direction, distance)) { // Check the full distance
      if (distance < shortestDistance) {
        shortestDistance = distance
        bestPath = {direction, targetX: spot.x, distance}
      }
    }
  }
  
  return bestPath
}

/**
 * Check if enemy can move laterally (left or right) for the full distance
 */
const isLateralPathClear = (enemy: Enemy, direction: 'left' | 'right', steps: number): boolean => {
  const deltaX = direction === 'left' ? -1 : 1
  
  // Check each step of the path
  for (let step = 1; step <= steps; step++) {
    const newX = enemy.x + (deltaX * step)
    
    // Check bounds
    if (newX < 0 || newX + enemy.type.width > LEVEL_WIDTH) {
      return false
    }
    
    // Check if this intermediate position is clear (excluding the enemy doing the checking)
    if (!canPlaceEnemyAtExcluding(newX, enemy.y, enemy.type, enemy.id)) {
      return false
    }
  }
  
  return true // All steps in the path are clear
}

/**
 * Execute one step of lateral movement
 */
const executeLateralMovement = (enemy: Enemy, direction: 'left' | 'right'): boolean => {
  const deltaX = direction === 'left' ? -1 : 1
  const newX = enemy.x + deltaX
  
  // Double-check the move is valid (excluding the enemy itself)
  if (!canPlaceEnemyAtExcluding(newX, enemy.y, enemy.type, enemy.id)) {
    return false
  }
  
  // Clear old position in battlefield cells
  for (let dy = 0; dy < enemy.type.height; dy++) {
    for (let dx = 0; dx < enemy.type.width; dx++) {
      setBattlefieldCell(enemy.x + dx, enemy.y + dy, undefined)
    }
  }
  
  // Move enemy
  enemy.x = newX
  
  // Mark new position in battlefield cells
  for (let dy = 0; dy < enemy.type.height; dy++) {
    for (let dx = 0; dx < enemy.type.width; dx++) {
      setBattlefieldCell(enemy.x + dx, enemy.y + dy, enemy.id)
    }
  }
  
  return true
}

/**
 * Try to attack adjacent allies when enemy cannot move
 */
const tryEnemyAttack = (enemy: Enemy): void => {
  // Debug: Log enemies in rightmost column who can't move
  const isInRightmostColumn = enemy.x + enemy.type.width - 1 === LEVEL_WIDTH - 1
  if (isInRightmostColumn) {
    console.log(`👹 Enemy ${enemy.type.name} at (${enemy.x},${enemy.y}) in rightmost column, checking for right wall allies`)
  }
  
  const adjacentAllies = findAdjacentAllies(enemy)
  
  if (adjacentAllies.length === 0) {
    if (isInRightmostColumn) {
      console.log(`❌ No adjacent allies found for rightmost enemy ${enemy.type.name}`)
      // Debug: dump all right wall units
      const rightWallStatus = []
      for (let i = 0; i < LEVEL_HEIGHT; i++) {
        const cell = getWallCell('right', i)
        rightWallStatus.push(`Cell ${i}: ${cell?.isOccupied ? `occupied by ${cell.occupiedBy}` : 'empty'}`)
      }
      console.log('🏰 Right wall status:', rightWallStatus.join(', '))
    }
    return // No adjacent allies to attack
  }
  
  // Pick one ally to attack (enemies attack only one ally per turn)
  const targetAlly = adjacentAllies[Math.floor(Math.random() * adjacentAllies.length)]
  
  if (isInRightmostColumn) {
    console.log(`⚔️ Rightmost enemy ${enemy.type.name} attacking ${targetAlly.wallType} wall cell ${targetAlly.cellIndex}`)
  }
  
  // Deal 1 damage to the ally (all enemies deal 1 damage)
  damageAlly(targetAlly.wallType, targetAlly.cellIndex, 1, enemy)
}

/**
 * Find all allies adjacent to an enemy in counter-clockwise order starting from top-left
 */
const findAdjacentAllies = (enemy: Enemy): Array<{wallType: 'left' | 'right' | 'bottom', cellIndex: number}> => {
  const adjacentAllies: Array<{wallType: 'left' | 'right' | 'bottom', cellIndex: number}> = []
  
  // Check if this is a rightmost column enemy for debug logging
  // (removed unused variable for now)
  
  // Generate all adjacent positions in counter-clockwise order starting from top-left
  const allAdjacentPositions: Array<{x: number, y: number}> = []
  
  // Check each cell of the enemy for adjacencies
  for (let dy = 0; dy < enemy.type.height; dy++) {
    for (let dx = 0; dx < enemy.type.width; dx++) {
      const enemyX = enemy.x + dx
      const enemyY = enemy.y + dy
      
      // Only visible enemy cells can attack (ignore negative rows)
      if (enemyY < 0) {
        continue
      }
      
      // Add adjacent positions for this cell
      const positions = [
        {x: enemyX - 1, y: enemyY}, // Left
        {x: enemyX + 1, y: enemyY}, // Right
        {x: enemyX, y: enemyY - 1}, // Up
        {x: enemyX, y: enemyY + 1}  // Down
      ]
      
      for (const pos of positions) {
        // Avoid duplicates
        if (!allAdjacentPositions.some(p => p.x === pos.x && p.y === pos.y)) {
          allAdjacentPositions.push(pos)
        }
      }
    }
  }
  
  // Sort positions counter-clockwise starting from top-left relative to enemy center
  const centerX = enemy.x + (enemy.type.width - 1) / 2
  const centerY = Math.max(enemy.y + (enemy.type.height - 1) / 2, 0)
  
  allAdjacentPositions.sort((a, b) => {
    // Calculate angle from center to each position (counter-clockwise from top)
    const angleA = Math.atan2(a.y - centerY, a.x - centerX)
    const angleB = Math.atan2(b.y - centerY, b.x - centerX)
    
    // Normalize angles to [0, 2π] and start from top (-π/2)
    const normalizedA = (angleA + Math.PI * 2.5) % (Math.PI * 2)
    const normalizedB = (angleB + Math.PI * 2.5) % (Math.PI * 2)
    
    return normalizedA - normalizedB
  })
  
  // Check positions in order and return all allies found
  for (const pos of allAdjacentPositions) {
    const wallInfo = getWallInfoForBattlefieldPosition(pos.x, pos.y)
    
    if (wallInfo) {
      // IMPORTANT: Account for right wall mapping being reversed!
      // The mapping system reverses right wall cells, but for adjacency we want direct mapping
      // So battlefield y should correspond directly to right wall cell y for logical adjacency
      let actualCellIndex = wallInfo.cellIndex
      if (wallInfo.wallType === 'right') {
        // Use pos.y directly instead of the reversed wallInfo.cellIndex
        // This makes battlefield y=0 attack right wall cell 0, y=11 attack cell 11, etc.
        actualCellIndex = pos.y
      }
      
      const isOccupied = isWallCellOccupiedByAlly(wallInfo.wallType, actualCellIndex)
      
      if (isOccupied) {
        // Add to list if not already present
        if (!adjacentAllies.some(ally => 
          ally.wallType === wallInfo.wallType && ally.cellIndex === actualCellIndex)) {
          adjacentAllies.push({wallType: wallInfo.wallType, cellIndex: actualCellIndex})
        }
      }
    }
  }
  
  return adjacentAllies
}

/**
 * Deal damage to an ally and handle death
 */
export const damageAlly = (wallType: 'left' | 'right' | 'bottom', cellIndex: number, damage: number, _attacker: Enemy | null): void => {
  const wallCell = getWallCell(wallType, cellIndex)
  if (!wallCell || !wallCell.isOccupied || !wallCell.occupiedBy) {
    return
  }
  
  // Deal damage
  const currentHealth = wallCell.currentHealth || 0
  const newHealth = Math.max(0, currentHealth - damage)
  wallCell.currentHealth = newHealth
  
  // Spawn claws effect
  spawnClawsEffect(wallType, cellIndex)
  
  // Spawn damage number above the ally
  const wallCoords = getWallCellCoordinates(wallType, cellIndex)
  if (wallCoords) {
    const centerX = wallCoords.x + WALL_CELL_SIZE / 2
    const centerY = wallCoords.y - 10 // Above the ally
    spawnDamageNumberAtPosition(centerX, centerY, damage)
  }
  
  // Check if ally died
  if (newHealth <= 0) {
    
    // Clear the wall cell
    wallCell.isOccupied = false
    wallCell.occupiedBy = undefined
    wallCell.currentHealth = undefined
    wallCell.maxHealth = undefined
    wallCell.unitUuid = undefined
  }
}

/**
 * Check if a wall cell is occupied by an ally
 */
const isWallCellOccupiedByAlly = (wallType: 'left' | 'right' | 'bottom', cellIndex: number): boolean => {
  const wallCell = getWallCell(wallType, cellIndex)
  return !!(wallCell && wallCell.isOccupied && wallCell.occupiedBy)
}

/**
 * Convert battlefield position to wall info (if it corresponds to a wall cell)
 */
const getWallInfoForBattlefieldPosition = (x: number, y: number): {wallType: 'left' | 'right' | 'bottom', cellIndex: number} | null => {
  // Left wall check (x = -1, y = 0 to LEVEL_HEIGHT-1)
  if (x === -1 && y >= 0 && y < LEVEL_HEIGHT) {
    return {wallType: 'left', cellIndex: y}
  }
  
  // Right wall check (x = LEVEL_WIDTH, y = 0 to LEVEL_HEIGHT-1)
  if (x === LEVEL_WIDTH && y >= 0 && y < LEVEL_HEIGHT) {
    const cellIndex = LEVEL_HEIGHT - 1 - y // Right wall is reversed (keep this as-is)
    return {wallType: 'right', cellIndex}
  }
  
  // Bottom wall check (y = LEVEL_HEIGHT, x = 0 to LEVEL_WIDTH-1)
  if (y === LEVEL_HEIGHT && x >= 0 && x < LEVEL_WIDTH) {
    return {wallType: 'bottom', cellIndex: x}
  }
  
  return null
}

/**
 * Try to spawn a Skeleton when Lich is obstructed
 * Lich is 1x2 (1 wide, 2 tall), so it has 6 adjacent cells
 */
const tryLichSkeletonSpawn = (lich: Enemy): void => {
  // Roll spawn chance first (now uses config constant)
  if (Math.random() > LICH_SPAWN_CHANCE) {
    return
  }
  
  // Get all adjacent cells for a 1x2 Lich
  const adjacentCells: { x: number; y: number }[] = []
  
  // Lich occupies: (lich.x, lich.y) and (lich.x, lich.y + 1)
  // Adjacent cells:
  // Left side: (x-1, y) and (x-1, y+1)
  adjacentCells.push({ x: lich.x - 1, y: lich.y })
  adjacentCells.push({ x: lich.x - 1, y: lich.y + 1 })
  
  // Right side: (x+1, y) and (x+1, y+1) 
  adjacentCells.push({ x: lich.x + 1, y: lich.y })
  adjacentCells.push({ x: lich.x + 1, y: lich.y + 1 })
  
  // Top: (x, y-1)
  adjacentCells.push({ x: lich.x, y: lich.y - 1 })
  
  // Bottom: (x, y+2)
  adjacentCells.push({ x: lich.x, y: lich.y + 2 })
  
  // Filter for valid empty cells
  const emptyCells = adjacentCells.filter(cell => {
    // Check bounds
    if (cell.x < 0 || cell.x >= LEVEL_WIDTH) return false
    if (cell.y < -LEVEL_NEGATIVE_ROWS || cell.y >= LEVEL_HEIGHT) return false
    
    // Check if cell is empty
    const battlefieldCell = getBattlefieldCell(cell.x, cell.y)
    return !battlefieldCell?.enemyId
  })
  
  // If no empty cells, nothing to do
  if (emptyCells.length === 0) {
    return
  }
  
  // Pick random empty cell
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  
  // Spawn Skeleton at the chosen location
      const skeletonType = ENEMY_UNITS.SKELETON
  if (canPlaceEnemyAt(randomCell.x, randomCell.y, skeletonType)) {
    const newSkeleton: Enemy = {
      id: `skeleton_lich_spawn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uuid: generateUUID(),
      type: skeletonType,
      x: randomCell.x,
      y: randomCell.y,
      health: skeletonType.health,
      maxHealth: skeletonType.health,
      turnsSinceSpawn: 0
    }
    
    enemies.push(newSkeleton)
    
    // Mark battlefield cell as occupied
    setBattlefieldCell(randomCell.x, randomCell.y, newSkeleton.id)
    
    // addLogMessage(`Lich summons a Skeleton at (${randomCell.x}, ${randomCell.y})!`) // Removed - not combat logs
  }
}

// Get battlefield cell coordinates for rendering (handles negative rows)
export const getBattlefieldCellCoords = (cellX: number, cellY: number): { x: number; y: number } => {
  // Use proper cell boundary positioning like battlefieldToCanvas
  const x = BATTLEFIELD_X + BATTLEFIELD_BORDER_WIDTH + cellX * (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH)
  const y = BATTLEFIELD_Y + BATTLEFIELD_BORDER_WIDTH + cellY * (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH)
  
  return { x, y }
}

// Render all enemies on battlefield
export const renderEnemies = (ctx: CanvasRenderingContext2D): void => {
  for (const enemy of enemies) {
    renderEnemy(ctx, enemy)
  }
}



// Render single enemy with gradual reveal effect
export const renderEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy): void => {
  // Only render enemies that are at least partially in the visible battlefield (y >= 0)
  if (enemy.y + enemy.type.height <= 0) {
    return // Enemy is completely above visible area
  }
  
  const image = getCachedImage(enemy.type.assetPath)
  if (!image) {
    return
  }
  
  // Calculate which rows of the enemy are visible
  const visibleStartY = Math.max(enemy.y, 0) // First visible row
  const visibleEndY = Math.min(enemy.y + enemy.type.height, LEVEL_HEIGHT) // Last visible row
  const visibleRows = visibleEndY - visibleStartY
  
  if (visibleRows <= 0) {
    return // Nothing to render
  }
  
    // Calculate which part of the enemy sprite to draw
  const spriteStartRow = visibleStartY - enemy.y // Row offset from top of enemy sprite
  const spriteRows = visibleRows // Number of rows to draw from sprite

  // Debug multi-cell enemy rendering - remove in production
  // console.log(`Rendering ${enemy.type.name} at y=${enemy.y}, visible=${visibleStartY}-${visibleEndY}, spriteRow=${spriteStartRow}, rows=${spriteRows}`)

  // Get battlefield position for rendering (top-left of visible area)
  // Use battlefieldToCanvas for proper cell boundary alignment
  const coords = getBattlefieldCellCoords(enemy.x, visibleStartY)
  
  // Calculate dimensions with sprite scaling
  const spriteScale = enemy.type.spriteScale || 1.0
  const baseWidth = enemy.type.width * BATTLEFIELD_CELL_SIZE
  const baseHeight = spriteRows * BATTLEFIELD_CELL_SIZE
  
  const scaledWidth = baseWidth * spriteScale
  const scaledHeight = baseHeight * spriteScale
  
  // Center the scaled sprite within the original area
  const offsetX = (baseWidth - scaledWidth) / 2
  const offsetY = (baseHeight - scaledHeight) / 2
  
  // Calculate source rectangle (what part of the sprite to draw)
  const srcY = (spriteStartRow / enemy.type.height) * enemy.type.assetHeight
  const srcHeight = (spriteRows / enemy.type.height) * enemy.type.assetHeight
  
  ctx.save()
  
  // Draw the visible portion of the enemy with scaling
  ctx.drawImage(
    image,
    0, srcY, enemy.type.assetWidth, srcHeight, // source rectangle
    coords.x + offsetX, coords.y + offsetY, scaledWidth, scaledHeight // destination rectangle with centering
  )
  
  // Apply pain effect overlay if enemy is taking damage
  renderPainEffect(ctx, enemy, image, 0, srcY, enemy.type.assetWidth, srcHeight, coords.x + offsetX, coords.y + offsetY, scaledWidth, scaledHeight)
  
  ctx.restore()
}

// Get enemy at battlefield position (if any)
export const getEnemyAt = (x: number, y: number): Enemy | null => {
  const cell = getBattlefieldCell(x, y)
  if (!cell || !cell.enemyId) return null
  
  return enemies.find(enemy => enemy.id === cell.enemyId) || null
}

/**
 * Spawn small spiders when a Large Spider dies
 */
const spawnSmallSpiders = (largeSpider: Enemy): void => {
  console.log(`🕷️ Large Spider death: spawning small spiders at (${largeSpider.x}, ${largeSpider.y})`)
  const spawnArea: { x: number, y: number }[] = []
  
  // Collect all cells that were occupied by the large spider
  for (let dy = 0; dy < largeSpider.type.height; dy++) {
    for (let dx = 0; dx < largeSpider.type.width; dx++) {
      spawnArea.push({ x: largeSpider.x + dx, y: largeSpider.y + dy })
    }
  }
  console.log(`📍 Large Spider occupied ${spawnArea.length} cells:`, spawnArea)
  
  // Shuffle spawn area to randomize positions
  for (let i = spawnArea.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spawnArea[i], spawnArea[j]] = [spawnArea[j], spawnArea[i]]
  }
  
  // Weighted random for number of spiders (more spiders = less likely)
  // 1 spider = weight 16, 2 spiders = weight 15, ..., 16 spiders = weight 1
  const weights = Array.from({ length: 16 }, (_, i) => 16 - i)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let randomWeight = Math.random() * totalWeight
  let numSpidersToSpawn = 1
  
  for (let i = 0; i < weights.length; i++) {
    randomWeight -= weights[i]
    if (randomWeight <= 0) {
      numSpidersToSpawn = i + 1
      break
    }
  }
  
  console.log(`🎲 Rolled ${numSpidersToSpawn} small spiders to spawn`)
  
  const smallSpiderType = ENEMY_UNITS.SPIDER_SMALL
  console.log(`🔍 Small spider type:`, smallSpiderType ? 'found' : 'NOT FOUND')
  
  let spawnedCount = 0
  
  // Try to spawn small spiders in the available positions
  for (let i = 0; i < numSpidersToSpawn && i < spawnArea.length; i++) {
    const { x, y } = spawnArea[i]
    
    console.log(`🎯 Trying to spawn small spider #${i + 1} at (${x}, ${y})`)
    
    // Check if the position is valid and not already occupied by another enemy
    if (canPlaceEnemyAt(x, y, smallSpiderType)) {
      const newSmallSpider: Enemy = {
        id: `spider_small_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uuid: generateUUID(),
        type: smallSpiderType,
        x: x,
        y: y,
        health: smallSpiderType.health,
        maxHealth: smallSpiderType.health,
        turnsSinceSpawn: 0
      }
      
      enemies.push(newSmallSpider)
      setBattlefieldCell(x, y, newSmallSpider.id)
      spawnedCount++
      console.log(`✅ Successfully spawned small spider at (${x}, ${y})`)
    } else {
      console.log(`❌ Cannot spawn small spider at (${x}, ${y}) - position blocked`)
    }
  }
  
  console.log(`📊 Spawned ${spawnedCount}/${numSpidersToSpawn} small spiders`)
}

/**
 * Remove an enemy from the battlefield
 */
export const removeEnemy = (enemyToRemove: Enemy): boolean => {
  const enemyIndex = enemies.findIndex(enemy => enemy.uuid === enemyToRemove.uuid)
  if (enemyIndex === -1) {
    return false // Enemy not found
  }
  
  // Clear battlefield cells occupied by this enemy FIRST
  for (let dy = 0; dy < enemyToRemove.type.height; dy++) {
    for (let dx = 0; dx < enemyToRemove.type.width; dx++) {
      setBattlefieldCell(enemyToRemove.x + dx, enemyToRemove.y + dy, undefined)
    }
  }
  
  // Remove enemy from array
  enemies.splice(enemyIndex, 1)
  
  // AFTER clearing battlefield, check if this is a Large Spider - spawn small spiders
  if (enemyToRemove.type.id === 'spider_large') {
    spawnSmallSpiders(enemyToRemove)
  }
  return true
}

/**
 * Render health numbers on all enemies
 */
export const renderEnemyHealthNumbers = (ctx: CanvasRenderingContext2D): void => {
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.font = '14px "Pixelify Sans", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  
  enemies.forEach(enemy => {
    // Only render health numbers for visible enemies (y >= 0)
    if (enemy.y >= 0) {
      const coords = getBattlefieldCellCoords(enemy.x, enemy.y)
      
      // Calculate center position for multi-cell enemies
      const enemyCenterX = coords.x + (enemy.type.width * (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH)) / 2
      const enemyTopY = coords.y + 2 // Small offset from top
      
      // Draw stroke first, then fill
      ctx.strokeText(enemy.health.toString(), enemyCenterX, enemyTopY)
      ctx.fillText(enemy.health.toString(), enemyCenterX, enemyTopY)
    }
  })
  
  ctx.restore()
}

// Debug function to log current enemy state (disabled for production)
export const debugEnemyState = (_context: string): void => {
  // Debug logging disabled
}

// Process enemy spawning for this turn - independent spawn system
export const processEnemySpawn = (): void => {
  debugEnemyState('SPAWN_START')
  
  const enemyTypesToSpawn = rollIndependentEnemySpawns()
  let successfulSpawns = 0
  
  // Try to spawn each selected enemy type
  for (const enemyType of enemyTypesToSpawn) {
    const spawned = spawnEnemy(enemyType)
    if (spawned) {
      successfulSpawns++
    }
  }
  
  if (successfulSpawns > 0) {
    debugEnemyState(`SPAWN_SUCCESS: ${successfulSpawns} enemies spawned`)
  }
}
