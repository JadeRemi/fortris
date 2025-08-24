// Wall extensions for unit placement
import { WallCell } from '../types/walls'
import { getCachedImage } from './imageUtils'
import { UNIT_TYPES } from '../config/unitsConfig'
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
let leftWallCells: WallCell[] = []
let rightWallCells: WallCell[] = []
let bottomWallCells: WallCell[] = []

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
  const unitType = Object.values(UNIT_TYPES).find(unit => unit.id === unitTypeId)
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
  
  // Calculate image size and position (centered with padding)
  const imageSize = WALL_CELL_SIZE - 8 // Leave some padding
  const imageX = cellX + (WALL_CELL_SIZE - imageSize) / 2
  const imageY = cellY + (WALL_CELL_SIZE - imageSize) / 2
  
  // Draw the unit image
  ctx.drawImage(unitImage, imageX, imageY, imageSize, imageSize)
  
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
