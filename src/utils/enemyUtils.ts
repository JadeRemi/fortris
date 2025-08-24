import { Enemy, EnemyType, BattlefieldCell } from '../types/enemies'
import { ENEMY_TYPES } from '../config/enemiesConfig'
import {
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  LEVEL_NEGATIVE_ROWS,
  ENEMY_SPAWN_CHANCE,
  ENEMY_HEALTH,
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
  return Object.values(ENEMY_TYPES)
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

// Roll for enemy spawn
export const rollEnemySpawn = (): EnemyType | null => {
  // First roll: should we spawn an enemy this turn?
  const spawnRoll = Math.random()
  if (spawnRoll > ENEMY_SPAWN_CHANCE) {
    return null
  }
  
  // Check if top row is blocked
  const topBlocked = isTopRowBlocked()
  if (topBlocked) {
    return null
  }
  
  // Second roll: which enemy type should spawn based on weights?
  const typeRoll = Math.random()
  let cumulativeWeight = 0
  
  for (const enemyType of Object.values(ENEMY_TYPES)) {
    cumulativeWeight += enemyType.spawnWeight
    if (typeRoll <= cumulativeWeight) {
      return enemyType
    }
  }
  
  // Fallback to skull if weights don't add up to 1.0
  return ENEMY_TYPES.SKULL
}

// Find valid spawn position for enemy type
export const findSpawnPosition = (enemyType: EnemyType): { x: number; y: number } | null => {
  // Calculate spawn Y based on enemy height for gradual reveal
  // 1x1 enemies start at y=0 (immediately visible)
  // 2x2 enemies start at y=-1 (only bottom row visible initially)
  // 3x3 enemies would start at y=-2, etc.
  const spawnY = 1 - enemyType.height
  
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
  const position = findSpawnPosition(enemyType)
  if (!position) {
    return false
  }
  
  const newEnemy: Enemy = {
    id: `${enemyType.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: enemyType,
    x: position.x,
    y: position.y,
    health: ENEMY_HEALTH,
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
    moveEnemyDown(enemy)
    enemy.turnsSinceSpawn += 1
  }
  
  debugEnemyState('MOVE_END')
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

/**
 * Render health numbers on all enemies (when stats enabled)
 */
export const renderEnemyHealthNumbers = (ctx: CanvasRenderingContext2D): void => {
  ctx.save()
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.font = '14px "Pixelify Sans", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  
  for (const enemy of enemies) {
    // Only render for visible enemies
    if (enemy.y + enemy.type.height <= 0) {
      continue // Enemy is completely above visible area
    }
    
    // Calculate center position for health text
    const coords = getBattlefieldCellCoords(enemy.x, Math.max(enemy.y, 0))
    const centerX = coords.x + (enemy.type.width * BATTLEFIELD_CELL_SIZE) / 2
    const topY = coords.y + 2 // Small offset from top
    
    // Draw stroke first, then fill
    ctx.strokeText(enemy.health.toString(), centerX, topY)
    ctx.fillText(enemy.health.toString(), centerX, topY)
  }
  
  ctx.restore()
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
  

  
  // Get battlefield position for rendering (top-left of visible area)
  // Use battlefieldToCanvas for proper cell boundary alignment
  const coords = getBattlefieldCellCoords(enemy.x, visibleStartY)
  
  // Calculate dimensions
  const visibleWidth = enemy.type.width * BATTLEFIELD_CELL_SIZE
  const visibleHeight = spriteRows * BATTLEFIELD_CELL_SIZE
  
  // Calculate source rectangle (what part of the sprite to draw)
  const srcY = (spriteStartRow / enemy.type.height) * enemy.type.assetHeight
  const srcHeight = (spriteRows / enemy.type.height) * enemy.type.assetHeight
  
  ctx.save()
  
  // Draw the visible portion of the enemy
  ctx.drawImage(
    image,
    0, srcY, enemy.type.assetWidth, srcHeight, // source rectangle
    coords.x, coords.y, visibleWidth, visibleHeight // destination rectangle
  )
  
  ctx.restore()
}

// Get enemy at battlefield position (if any)
export const getEnemyAt = (x: number, y: number): Enemy | null => {
  const cell = getBattlefieldCell(x, y)
  if (!cell || !cell.enemyId) return null
  
  return enemies.find(enemy => enemy.id === cell.enemyId) || null
}

// Debug function to log current enemy state (disabled for production)
export const debugEnemyState = (_context: string): void => {
  // Debug logging disabled
}

// Process enemy spawning for this turn
export const processEnemySpawn = (): void => {
  debugEnemyState('SPAWN_START')
  
  const enemyType = rollEnemySpawn()
  if (enemyType) {
    const spawned = spawnEnemy(enemyType)
    if (spawned) {
      debugEnemyState('SPAWN_SUCCESS')
    }
  }
}
