// Wall extensions for unit placement
import { WallCell } from '../types/walls'
import { getCachedImage } from './imageUtils'
import { getUnitById } from '../config/allUnitsConfig'
import { renderEnemyHealthNumbers } from './enemyUtils'
import { generateUUID } from './uuidUtils'
import { ROMAN_NUMERALS, UI_FONT_SIZE_HEALTH, UI_FONT_SIZE_TIER } from '../config/gameConfig'
import {
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  WALL_CELL_SIZE,
  WALL_BORDER_WIDTH,
  LEFT_WALL_X,
  LEFT_WALL_Y,
  LEFT_WALL_HEIGHT,
  LEFT_WALL_WIDTH,
  RIGHT_WALL_X,
  RIGHT_WALL_Y,
  RIGHT_WALL_HEIGHT,
  RIGHT_WALL_WIDTH,
  BOTTOM_WALL_X,
  BOTTOM_WALL_Y,
  BOTTOM_WALL_WIDTH,
  BOTTOM_WALL_HEIGHT
} from '../config/gameConfig'

// Wall cell occupation tracking
export let leftWallCells: WallCell[] = []
export let rightWallCells: WallCell[] = []
export let bottomWallCells: WallCell[] = []

// Initialize wall cells
const initializeWallCells = () => {
  // Initialize left wall cells
  leftWallCells = Array.from({ length: LEVEL_HEIGHT }, (_, index) => ({
    wallType: 'left' as const,
    index,
    isOccupied: false,
    occupiedBy: undefined
  }))
  
  // Initialize right wall cells
  rightWallCells = Array.from({ length: LEVEL_HEIGHT }, (_, index) => ({
    wallType: 'right' as const,
    index,
    isOccupied: false,
    occupiedBy: undefined
  }))
  
  // Initialize bottom wall cells
  bottomWallCells = Array.from({ length: LEVEL_WIDTH }, (_, index) => ({
    wallType: 'bottom' as const,
    index,
    isOccupied: false,
    occupiedBy: undefined
  }))
}

// Initialize on first load
initializeWallCells()

/**
 * Place a unit on a wall cell
 */
export const placeUnitOnWall = (wallType: 'left' | 'right' | 'bottom', cellIndex: number, unitTypeId: string): boolean => {
  let cells: WallCell[]
  
  switch (wallType) {
    case 'left':
      cells = leftWallCells
      break
    case 'right':
      cells = rightWallCells
      break
    case 'bottom':
      cells = bottomWallCells
      break
  }
  
  if (cellIndex < 0 || cellIndex >= cells.length) {
    return false
  }
  
  const cell = cells[cellIndex]
  if (cell.isOccupied) {
    return false // Cell already occupied
  }
  
  cell.isOccupied = true
  cell.occupiedBy = unitTypeId
  cell.unitUuid = generateUUID()
  
  // Set initial health based on unit type
  const unitType = getUnitById(unitTypeId)
  cell.currentHealth = unitType?.maxHealth || 10
  cell.maxHealth = unitType?.maxHealth || 10
  
  return true
}

/**
 * Check if wall cell is occupied
 */
export const isWallCellOccupied = (wallType: 'left' | 'right' | 'bottom', cellIndex: number): boolean => {
  let cells: WallCell[]
  
  switch (wallType) {
    case 'left':
      cells = leftWallCells
      break
    case 'right':
      cells = rightWallCells
      break
    case 'bottom':
      cells = bottomWallCells
      break
  }
  
  if (cellIndex < 0 || cellIndex >= cells.length) {
    return false
  }
  
  return cells[cellIndex].isOccupied
}

/**
 * Get a specific wall cell
 */
export const getWallCell = (wallType: 'left' | 'right' | 'bottom', cellIndex: number): WallCell | null => {
  let cells: WallCell[]
  
  switch (wallType) {
    case 'left':
      cells = leftWallCells
      break
    case 'right':
      cells = rightWallCells
      break
    case 'bottom':
      cells = bottomWallCells
      break
  }
  
  if (cellIndex < 0 || cellIndex >= cells.length) {
    return null
  }
  
  return cells[cellIndex]
}

/**
 * Get wall cell coordinates
 */
export const getWallCellCoordinates = (wallType: 'left' | 'right' | 'bottom', cellIndex: number): { x: number; y: number } | null => {
  let cellX: number, cellY: number
  
  if (wallType === 'left') {
    if (cellIndex < 0 || cellIndex >= LEVEL_HEIGHT) return null
    const cellSpacing = (LEFT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
    cellX = LEFT_WALL_X + WALL_BORDER_WIDTH
    cellY = LEFT_WALL_Y + WALL_BORDER_WIDTH + cellIndex * (WALL_CELL_SIZE + cellSpacing)
  } else if (wallType === 'right') {
    if (cellIndex < 0 || cellIndex >= LEVEL_HEIGHT) return null
    const cellSpacing = (RIGHT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
    cellX = RIGHT_WALL_X + WALL_BORDER_WIDTH
    cellY = RIGHT_WALL_Y + WALL_BORDER_WIDTH + cellIndex * (WALL_CELL_SIZE + cellSpacing)
  } else { // bottom
    if (cellIndex < 0 || cellIndex >= LEVEL_WIDTH) return null
    const cellSpacing = (BOTTOM_WALL_WIDTH - WALL_BORDER_WIDTH * 2 - LEVEL_WIDTH * WALL_CELL_SIZE) / (LEVEL_WIDTH - 1)
    cellX = BOTTOM_WALL_X + WALL_BORDER_WIDTH + cellIndex * (WALL_CELL_SIZE + cellSpacing)
    cellY = BOTTOM_WALL_Y + WALL_BORDER_WIDTH
  }
  
  return { x: cellX, y: cellY }
}

/**
 * Render placed units in wall cells
 */
export const renderPlacedUnits = (ctx: CanvasRenderingContext2D) => {
  // Render left wall units
  for (let i = 0; i < leftWallCells.length; i++) {
    const cell = leftWallCells[i]
    if (cell.isOccupied && cell.occupiedBy) {
      const coords = getWallCellCoordinates('left', i)
      if (coords) {
        renderUnitInCell(ctx, coords.x, coords.y, cell.occupiedBy)
      }
    }
  }
  
  // Render right wall units
  for (let i = 0; i < rightWallCells.length; i++) {
    const cell = rightWallCells[i]
    if (cell.isOccupied && cell.occupiedBy) {
      const coords = getWallCellCoordinates('right', i)
      if (coords) {
        renderUnitInCell(ctx, coords.x, coords.y, cell.occupiedBy)
      }
    }
  }
  
  // Render bottom wall units
  for (let i = 0; i < bottomWallCells.length; i++) {
    const cell = bottomWallCells[i]
    if (cell.isOccupied && cell.occupiedBy) {
      const coords = getWallCellCoordinates('bottom', i)
      if (coords) {
        renderUnitInCell(ctx, coords.x, coords.y, cell.occupiedBy)
      }
    }
  }
}

/**
 * Render a unit in a wall cell
 */
const renderUnitInCell = (ctx: CanvasRenderingContext2D, cellX: number, cellY: number, unitTypeId: string) => {
  ctx.save()
  
  // Get unit configuration
  const unitType = getUnitById(unitTypeId)
  if (!unitType) {
    ctx.restore()
    return
  }
  
  // Get cached image
  const unitImage = getCachedImage(unitType.imagePath)
  if (!unitImage) {
    ctx.restore()
    return
  }
  
  // Calculate image size with sprite scaling
  const spriteScale = unitType.spriteScale || 1.0
  const baseImageSize = WALL_CELL_SIZE - 8 // Leave some padding
  const scaledImageSize = baseImageSize * spriteScale
  
  // Center the scaled image within the cell
  const imageX = cellX + (WALL_CELL_SIZE - scaledImageSize) / 2
  const imageY = cellY + (WALL_CELL_SIZE - scaledImageSize) / 2
  
  // Draw the unit image with scaling
  ctx.drawImage(unitImage, imageX, imageY, scaledImageSize, scaledImageSize)
  
  ctx.restore()
}

/**
 * Get cell index for left wall based on coordinates
 */
export const getLeftWallCellIndex = (x: number, y: number): number => {
  // Ensure Y coordinate is within the left wall
  if (y < LEFT_WALL_Y || y > LEFT_WALL_Y + LEFT_WALL_HEIGHT) {
    return -1
  }
  
  // Ensure X coordinate is within the wall cell area (not border)
  const cellAreaStartX = LEFT_WALL_X + WALL_BORDER_WIDTH
  const cellAreaEndX = LEFT_WALL_X + LEFT_WALL_WIDTH - WALL_BORDER_WIDTH
  
  if (x < cellAreaStartX || x > cellAreaEndX) {
    return -1
  }
  
  const cellSpacing = (LEFT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
  const cellAreaStartY = LEFT_WALL_Y + WALL_BORDER_WIDTH
  const relativeY = y - cellAreaStartY
  
  // Find which cell this Y coordinate is in
  for (let i = 0; i < LEVEL_HEIGHT; i++) {
    const cellY = i * (WALL_CELL_SIZE + cellSpacing)
    if (relativeY >= cellY && relativeY <= cellY + WALL_CELL_SIZE) {
      return i
    }
  }
  
  return -1
}

/**
 * Get cell index for right wall based on coordinates
 */
export const getRightWallCellIndex = (x: number, y: number): number => {
  // Ensure Y coordinate is within the right wall
  if (y < RIGHT_WALL_Y || y > RIGHT_WALL_Y + RIGHT_WALL_HEIGHT) {
    return -1
  }
  
  // Ensure X coordinate is within the wall cell area (not border)
  const cellAreaStartX = RIGHT_WALL_X + WALL_BORDER_WIDTH
  const cellAreaEndX = RIGHT_WALL_X + RIGHT_WALL_WIDTH - WALL_BORDER_WIDTH
  
  if (x < cellAreaStartX || x > cellAreaEndX) {
    return -1
  }
  
  const cellSpacing = (RIGHT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
  const cellAreaStartY = RIGHT_WALL_Y + WALL_BORDER_WIDTH
  const relativeY = y - cellAreaStartY
  
  // Find which cell this Y coordinate is in
  for (let i = 0; i < LEVEL_HEIGHT; i++) {
    const cellY = i * (WALL_CELL_SIZE + cellSpacing)
    if (relativeY >= cellY && relativeY <= cellY + WALL_CELL_SIZE) {
      return i
    }
  }
  
  return -1
}

/**
 * Get cell index for bottom wall based on coordinates
 */
export const getBottomWallCellIndex = (x: number, y: number): number => {
  // Ensure Y coordinate is within the bottom wall
  if (y < BOTTOM_WALL_Y || y > BOTTOM_WALL_Y + BOTTOM_WALL_HEIGHT) {
    return -1
  }
  
  // Ensure X coordinate is within the wall cell area (not border)
  const cellAreaStartX = BOTTOM_WALL_X + WALL_BORDER_WIDTH
  const cellAreaEndX = BOTTOM_WALL_X + BOTTOM_WALL_WIDTH - WALL_BORDER_WIDTH
  
  if (x < cellAreaStartX || x > cellAreaEndX) {
    return -1
  }
  
  const cellSpacing = (BOTTOM_WALL_WIDTH - WALL_BORDER_WIDTH * 2 - LEVEL_WIDTH * WALL_CELL_SIZE) / (LEVEL_WIDTH - 1)
  const relativeX = x - cellAreaStartX
  
  // Find which cell this X coordinate is in
  for (let i = 0; i < LEVEL_WIDTH; i++) {
    const cellX = i * (WALL_CELL_SIZE + cellSpacing)
    if (relativeX >= cellX && relativeX <= cellX + WALL_CELL_SIZE) {
      return i
    }
  }
  
  return -1
}

/**
 * Clear all placed units from all wall cells (for game restart)
 */
export const clearAllWallCells = (): void => {
  // Clear left wall
  for (const cell of leftWallCells) {
    cell.isOccupied = false
    cell.occupiedBy = undefined
    cell.currentHealth = undefined
    cell.maxHealth = undefined
    cell.unitUuid = undefined
  }
  
  // Clear right wall  
  for (const cell of rightWallCells) {
    cell.isOccupied = false
    cell.occupiedBy = undefined
    cell.currentHealth = undefined
    cell.maxHealth = undefined
    cell.unitUuid = undefined
  }
  
  // Clear bottom wall
  for (const cell of bottomWallCells) {
    cell.isOccupied = false
    cell.occupiedBy = undefined
    cell.currentHealth = undefined
    cell.maxHealth = undefined
    cell.unitUuid = undefined
  }
}

/**
 * Render health numbers on all placed units
 */
export const renderUnitHealthNumbers = (ctx: CanvasRenderingContext2D): void => {
  // Helper function to render health and tier for a cell
  const renderHealthAndTier = (cell: WallCell, coords: { x: number, y: number }) => {
    // Render health number
    ctx.save()
    ctx.fillStyle = '#FFFFFF' // White text
    ctx.strokeStyle = '#000000' // Black outline
    ctx.lineWidth = 2
    ctx.font = `${UI_FONT_SIZE_HEALTH}px "Pixelify Sans", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    
    // Position health number at the top center of the unit
    const healthX = coords.x + WALL_CELL_SIZE / 2
    const healthY = coords.y + 2 // Top of the cell with small offset
    
    // Draw stroke first, then fill
    ctx.strokeText(cell.currentHealth?.toString() || '?', healthX, healthY)
    ctx.fillText(cell.currentHealth?.toString() || '?', healthX, healthY)
    ctx.restore()
    
    // Render tier indicator (Roman numeral)
    const unitType = getUnitById(cell.occupiedBy!)
    if (unitType && unitType.tier && ROMAN_NUMERALS[unitType.tier]) {
      ctx.save()
      // Different colors based on tier: Tier 1 = gold, Tier 2 = orange-red
      const tierColor = unitType.tier === 2 ? '#FF8C00' : '#FFD700' // Orange-red for Tier 2, gold for Tier 1
      ctx.fillStyle = tierColor
      ctx.strokeStyle = '#8B4513' // Dark brown outline
      ctx.lineWidth = 1
      ctx.font = `${UI_FONT_SIZE_TIER}px "Pixelify Sans", monospace`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      
      // Position tier indicator at bottom-right corner of the cell
      const tierX = coords.x + WALL_CELL_SIZE - 3 // Right edge minus padding
      const tierY = coords.y + WALL_CELL_SIZE - 3 // Bottom edge minus padding
      
      // Draw stroke first, then fill
      ctx.strokeText(ROMAN_NUMERALS[unitType.tier], tierX, tierY)
      ctx.fillText(ROMAN_NUMERALS[unitType.tier], tierX, tierY)
      ctx.restore()
    }
  }
  
  // Render health and tier on left wall units
  for (let i = 0; i < leftWallCells.length; i++) {
    const cell = leftWallCells[i]
    if (cell.occupiedBy && cell.currentHealth !== undefined) {
      const coords = getWallCellCoordinates('left', i)
      if (coords) {
        renderHealthAndTier(cell, coords)
      }
    }
  }
  
  // Render health and tier on right wall units
  for (let i = 0; i < rightWallCells.length; i++) {
    const cell = rightWallCells[i]
    if (cell.occupiedBy && cell.currentHealth !== undefined) {
      const coords = getWallCellCoordinates('right', i)
      if (coords) {
        renderHealthAndTier(cell, coords)
      }
    }
  }
  
  // Render health and tier on bottom wall units
  for (let i = 0; i < bottomWallCells.length; i++) {
    const cell = bottomWallCells[i]
    if (cell.occupiedBy && cell.currentHealth !== undefined) {
      const coords = getWallCellCoordinates('bottom', i)
      if (coords) {
        renderHealthAndTier(cell, coords)
      }
    }
  }
  
  // Also render enemy health numbers
  renderEnemyHealthNumbers(ctx)
}

/**
 * Clear all ally units from wall cells
 */
export const clearAllWallUnits = (): void => {
  // Clear left wall
  leftWallCells.forEach(cell => {
    cell.isOccupied = false  // THIS WAS MISSING! This is what isWallCellOccupied checks
    cell.occupiedBy = undefined
    cell.currentHealth = undefined
    cell.maxHealth = undefined
    cell.unitUuid = undefined
  })
  
  // Clear right wall
  rightWallCells.forEach(cell => {
    cell.isOccupied = false  // THIS WAS MISSING! This is what isWallCellOccupied checks
    cell.occupiedBy = undefined
    cell.currentHealth = undefined
    cell.maxHealth = undefined
    cell.unitUuid = undefined
  })
  
  // Clear bottom wall
  bottomWallCells.forEach(cell => {
    cell.isOccupied = false  // THIS WAS MISSING! This is what isWallCellOccupied checks
    cell.occupiedBy = undefined
    cell.currentHealth = undefined
    cell.maxHealth = undefined
    cell.unitUuid = undefined
  })
}

/**
 * Upgrade unit mapping - defines which tier 1 units upgrade to which tier 2 units
 */
const UNIT_UPGRADE_MAP: Record<string, string> = {
  'bowman': 'lancer',      // Bowman → Lancer
  'swordsman': 'barbarian', // Swordsman → Barbarian
  'monk': 'bishop'         // Monk → Bishop
}

/**
 * Upgrade a unit in a wall cell
 * @param wallType - The wall type (left, right, bottom)
 * @param cellIndex - The cell index within the wall
 * @returns true if upgrade was successful, false if upgrade failed or unit not upgradeable
 */
export const upgradeWallUnit = (wallType: 'left' | 'right' | 'bottom', cellIndex: number): boolean => {
  let cells: WallCell[]
  
  switch (wallType) {
    case 'left':
      cells = leftWallCells
      break
    case 'right':
      cells = rightWallCells
      break
    case 'bottom':
      cells = bottomWallCells
      break
  }
  
  if (cellIndex < 0 || cellIndex >= cells.length) {
    return false // Invalid cell index
  }
  
  const cell = cells[cellIndex]
  if (!cell.isOccupied || !cell.occupiedBy) {
    return false // Cell is not occupied
  }
  
  // Check if current unit can be upgraded
  const currentUnitId = cell.occupiedBy
  const currentUnitType = getUnitById(currentUnitId)
  
  // Only tier 1 units can be upgraded
  if (!currentUnitType || currentUnitType.tier !== 1) {
    return false // Unit is not tier 1 or unit type not found
  }
  
  const upgradedUnitId = UNIT_UPGRADE_MAP[currentUnitId]
  
  if (!upgradedUnitId) {
    return false // Unit cannot be upgraded (not in upgrade map)
  }
  
  // Get the upgraded unit type to determine new max health
  const upgradedUnitType = getUnitById(upgradedUnitId)
  if (!upgradedUnitType) {
    return false // Upgraded unit type not found
  }
  
  // Preserve current health, but update unit type and max health
  const currentHealth = cell.currentHealth || 0
  
  // Update the cell
  cell.occupiedBy = upgradedUnitId
  cell.maxHealth = upgradedUnitType.maxHealth
  cell.currentHealth = currentHealth // Preserve current health
  
  // Add upgrade log message
  import('./logsUtils').then(({ addLogMessage }) => {
    addLogMessage(`${currentUnitType.name} is upgraded to ${upgradedUnitType.name}`)
  })
  
  console.log(`🔧 Upgraded ${currentUnitId} → ${upgradedUnitId} (health: ${currentHealth}/${upgradedUnitType.maxHealth})`)
  
  return true
}
