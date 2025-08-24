import {
  BATTLEFIELD_ROWS,
  BATTLEFIELD_COLS,
  BATTLEFIELD_CELL_SIZE,
  BATTLEFIELD_BORDER_WIDTH,
  BATTLEFIELD_CELL_BORDER_WIDTH,
  BATTLEFIELD_X,
  BATTLEFIELD_Y
} from '../config/gameConfig'
import {
  BATTLEFIELD_BORDER
} from '../config/palette'
import { getEnemyAt } from './enemyUtils'

/**
 * Render the main battlefield grid
 */
export const renderBattlefield = (ctx: CanvasRenderingContext2D) => {
  // Draw main border frame
  ctx.fillStyle = BATTLEFIELD_BORDER
  const totalWidth = BATTLEFIELD_COLS * BATTLEFIELD_CELL_SIZE + (BATTLEFIELD_COLS - 1) * BATTLEFIELD_CELL_BORDER_WIDTH + BATTLEFIELD_BORDER_WIDTH * 2
  const totalHeight = BATTLEFIELD_ROWS * BATTLEFIELD_CELL_SIZE + (BATTLEFIELD_ROWS - 1) * BATTLEFIELD_CELL_BORDER_WIDTH + BATTLEFIELD_BORDER_WIDTH * 2
  
  // Draw outer border frame (not filled, just the border)
  ctx.fillRect(BATTLEFIELD_X, BATTLEFIELD_Y, totalWidth, BATTLEFIELD_BORDER_WIDTH) // top
  ctx.fillRect(BATTLEFIELD_X, BATTLEFIELD_Y + totalHeight - BATTLEFIELD_BORDER_WIDTH, totalWidth, BATTLEFIELD_BORDER_WIDTH) // bottom
  ctx.fillRect(BATTLEFIELD_X, BATTLEFIELD_Y, BATTLEFIELD_BORDER_WIDTH, totalHeight) // left
  ctx.fillRect(BATTLEFIELD_X + totalWidth - BATTLEFIELD_BORDER_WIDTH, BATTLEFIELD_Y, BATTLEFIELD_BORDER_WIDTH, totalHeight) // right

  // Draw internal grid lines (skip borders between cells of the same enemy)
  ctx.fillStyle = BATTLEFIELD_BORDER
  
  // Horizontal lines (between rows)
  for (let row = 1; row < BATTLEFIELD_ROWS; row++) {
    const y = BATTLEFIELD_Y + BATTLEFIELD_BORDER_WIDTH + row * BATTLEFIELD_CELL_SIZE + (row - 1) * BATTLEFIELD_CELL_BORDER_WIDTH
    
    // Draw horizontal line in segments, skipping where same enemy occupies adjacent cells
    let segmentStart = BATTLEFIELD_X + BATTLEFIELD_BORDER_WIDTH
    let segmentEnd = segmentStart
    
    for (let col = 0; col < BATTLEFIELD_COLS; col++) {
      // Check if cells above and below this horizontal line have the same enemy
      const enemyAbove = getEnemyAt(col, row - 1)
      const enemyBelow = getEnemyAt(col, row)
      const shouldSkip = enemyAbove && enemyBelow && enemyAbove.id === enemyBelow.id
      
      if (shouldSkip) {
        // Draw segment before this skipped section
        if (segmentEnd > segmentStart) {
          ctx.fillRect(segmentStart, y, segmentEnd - segmentStart, BATTLEFIELD_CELL_BORDER_WIDTH)
        }
        // Start new segment after this cell
        segmentStart = segmentEnd + BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH
        segmentEnd = segmentStart
      } else {
        // Continue current segment
        segmentEnd += BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH
      }
    }
    
    // Draw final segment
    if (segmentEnd > segmentStart) {
      ctx.fillRect(segmentStart, y, segmentEnd - segmentStart, BATTLEFIELD_CELL_BORDER_WIDTH)
    }
  }
  
  // Vertical lines (between columns)
  for (let col = 1; col < BATTLEFIELD_COLS; col++) {
    const x = BATTLEFIELD_X + BATTLEFIELD_BORDER_WIDTH + col * BATTLEFIELD_CELL_SIZE + (col - 1) * BATTLEFIELD_CELL_BORDER_WIDTH
    
    // Draw vertical line in segments, skipping where same enemy occupies adjacent cells
    let segmentStart = BATTLEFIELD_Y + BATTLEFIELD_BORDER_WIDTH
    let segmentEnd = segmentStart
    
    for (let row = 0; row < BATTLEFIELD_ROWS; row++) {
      // Check if cells left and right of this vertical line have the same enemy
      const enemyLeft = getEnemyAt(col - 1, row)
      const enemyRight = getEnemyAt(col, row)
      const shouldSkip = enemyLeft && enemyRight && enemyLeft.id === enemyRight.id
      
      if (shouldSkip) {
        // Draw segment before this skipped section
        if (segmentEnd > segmentStart) {
          ctx.fillRect(x, segmentStart, BATTLEFIELD_CELL_BORDER_WIDTH, segmentEnd - segmentStart)
        }
        // Start new segment after this cell
        segmentStart = segmentEnd + BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH
        segmentEnd = segmentStart
      } else {
        // Continue current segment
        segmentEnd += BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH
      }
    }
    
    // Draw final segment
    if (segmentEnd > segmentStart) {
      ctx.fillRect(x, segmentStart, BATTLEFIELD_CELL_BORDER_WIDTH, segmentEnd - segmentStart)
    }
  }
}

/**
 * Convert battlefield coordinates to canvas coordinates
 */
export const battlefieldToCanvas = (row: number, col: number) => {
  const x = BATTLEFIELD_X + BATTLEFIELD_BORDER_WIDTH + col * (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH)
  const y = BATTLEFIELD_Y + BATTLEFIELD_BORDER_WIDTH + row * (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH)
  return { x, y }
}

/**
 * Convert canvas coordinates to battlefield coordinates
 */
export const canvasToBattlefield = (x: number, y: number) => {
  const relativeX = x - BATTLEFIELD_X - BATTLEFIELD_BORDER_WIDTH
  const relativeY = y - BATTLEFIELD_Y - BATTLEFIELD_BORDER_WIDTH
  
  const col = Math.floor(relativeX / (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH))
  const row = Math.floor(relativeY / (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH))
  
  // Check if coordinates are within battlefield bounds
  if (col < 0 || col >= BATTLEFIELD_COLS || row < 0 || row >= BATTLEFIELD_ROWS) {
    return null
  }
  
  return { row, col }
}

/**
 * Check if coordinates are within battlefield area
 */
export const isWithinBattlefield = (x: number, y: number) => {
  return canvasToBattlefield(x, y) !== null
}
