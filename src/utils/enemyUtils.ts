import { Enemy, EnemyType, BattlefieldCell } from '../types/enemies'
import { ENEMY_UNITS, getSpawnableEnemyUnits } from '../config/allUnitsConfig'
import { generateUUID } from './uuidUtils'
import { renderPainEffect } from './painEffectUtils'
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
  BATTLEFIELD_BORDER_WIDTH
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
    console.log('🚫 Top row blocked, no spawns')
    return []
  }
  
  const spawnableEnemies = getSpawnableEnemyUnits()
  console.log('🎲 Spawnable enemies:', spawnableEnemies.map(e => `${e.name} (${e.spawnChance * 100}%)`))
  
  const eligibleSpawns: EnemyType[] = []
  
  // Roll for each enemy type independently
  for (const enemyType of spawnableEnemies) {
    const spawnRoll = Math.random()
    console.log(`🎯 ${enemyType.name}: rolled ${spawnRoll.toFixed(3)} vs ${enemyType.spawnChance.toFixed(3)}`)
    if (spawnRoll <= enemyType.spawnChance) {
      console.log(`✅ ${enemyType.name} eligible for spawn!`)
      eligibleSpawns.push(enemyType)
    }
  }
  
  console.log(`📊 Total eligible spawns: ${eligibleSpawns.length}, max allowed: ${MAX_ENEMY_SPAWNS_PER_TURN}`)
  
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
  
  // Check for collision with existing enemies
  for (let dy = 0; dy < enemyType.height; dy++) {
    for (let dx = 0; dx < enemyType.width; dx++) {
      const checkX = x + dx
      const checkY = y + dy
      const cell = getBattlefieldCell(checkX, checkY)
      if (cell && cell.enemyId) {
        return false
      }
    }
  }
  
  return true
}

// Spawn a new enemy
export const spawnEnemy = (enemyType: EnemyType): boolean => {
  console.log(`🐛 Attempting to spawn ${enemyType.name} (${enemyType.width}x${enemyType.height})`)
  const position = findSpawnPosition(enemyType)
  if (!position) {
    console.log(`❌ No valid position found for ${enemyType.name}`)
    return false
  }
  console.log(`✅ Spawning ${enemyType.name} at position (${position.x}, ${position.y})`)
  
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

// Process enemy turn (movement)
export const processEnemyTurn = (): void => {
  debugEnemyState('MOVE_START')
  
  const orderedEnemies = getEnemiesInProcessingOrder()
  
  for (const enemy of orderedEnemies) {
    const moved = moveEnemyDown(enemy)
    
    // Check if Lich couldn't move and try to spawn Skeleton
    if (!moved && enemy.type.id === 'lich') {
      tryLichSkeletonSpawn(enemy)
    }
    
    enemy.turnsSinceSpawn += 1
  }
  
  debugEnemyState('MOVE_END')
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
 * Remove an enemy from the battlefield
 */
export const removeEnemy = (enemyToRemove: Enemy): boolean => {
  const enemyIndex = enemies.findIndex(enemy => enemy.uuid === enemyToRemove.uuid)
  if (enemyIndex === -1) {
    return false // Enemy not found
  }
  
  // Clear battlefield cells occupied by this enemy
  for (let dy = 0; dy < enemyToRemove.type.height; dy++) {
    for (let dx = 0; dx < enemyToRemove.type.width; dx++) {
      setBattlefieldCell(enemyToRemove.x + dx, enemyToRemove.y + dy, undefined)
    }
  }
  
  // Remove enemy from array
  enemies.splice(enemyIndex, 1)
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
