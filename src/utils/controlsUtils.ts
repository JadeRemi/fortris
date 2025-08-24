import { renderText } from './fontUtils'
import { drawImage, getCachedImage } from './imageUtils'
import { 
  CONTROLS_X, CONTROLS_Y, CONTROLS_WIDTH, 
  ARMY_X, ARMY_Y, ARMY_WIDTH,
  ARMY_UNIT_CELL_X, ARMY_UNIT_CELL_Y, ARMY_UNIT_CELL_SIZE
} from '../config/gameConfig'
import { TEXT_PRIMARY, BATTLEFIELD_CELL_BORDER, BATTLEFIELD_CELL_EMPTY } from '../config/palette'
import { UNIT_TYPES } from '../config/unitsConfig'

// Army unit selection state
interface ArmyUnitState {
  isSelected: boolean
  selectionStartTime: number
}

let swordsmanState: ArmyUnitState = {
  isSelected: false,
  selectionStartTime: 0
}

let selectionAnimationId: number | null = null

/**
 * Render the controls section
 */
export const renderControls = (ctx: CanvasRenderingContext2D) => {
  // Draw controls section background (optional border)
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1
  ctx.strokeRect(CONTROLS_X, CONTROLS_Y, CONTROLS_WIDTH, 400) // Temporary height
  
  // Draw section title
  renderText(ctx, 'CONTROLS', CONTROLS_X + CONTROLS_WIDTH / 2, CONTROLS_Y + 30, TEXT_PRIMARY, 20)
  
  // Draw divider line
  ctx.strokeStyle = '#444444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(CONTROLS_X + 20, CONTROLS_Y + 50)
  ctx.lineTo(CONTROLS_X + CONTROLS_WIDTH - 20, CONTROLS_Y + 50)
  ctx.stroke()
}

/**
 * Render the army section
 */
export const renderArmy = (ctx: CanvasRenderingContext2D) => {
  // Draw army section background (optional border)
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1
  ctx.strokeRect(ARMY_X, ARMY_Y, ARMY_WIDTH, 400) // Temporary height
  
  // Draw section title
  renderText(ctx, 'ARMY', ARMY_X + ARMY_WIDTH / 2, ARMY_Y + 30, TEXT_PRIMARY, 20)
  
  // Draw divider line
  ctx.strokeStyle = '#444444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ARMY_X + 20, ARMY_Y + 50)
  ctx.lineTo(ARMY_X + ARMY_WIDTH - 20, ARMY_Y + 50)
  ctx.stroke()
  
  // Render swordsman unit cell
  renderSwordsmanCell(ctx)
}

/**
 * Render the swordsman unit cell in the army section
 */
const renderSwordsmanCell = (ctx: CanvasRenderingContext2D) => {
  ctx.save()
  
  // Draw cell background (same as battlefield cells)
  ctx.fillStyle = BATTLEFIELD_CELL_EMPTY
  ctx.fillRect(ARMY_UNIT_CELL_X, ARMY_UNIT_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE)
  
  // Draw cell border
  ctx.strokeStyle = BATTLEFIELD_CELL_BORDER
  ctx.lineWidth = 1
  ctx.strokeRect(ARMY_UNIT_CELL_X, ARMY_UNIT_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE)
  
  // Draw swordsman image (centered in cell)
  const imageSize = ARMY_UNIT_CELL_SIZE - 8 // Leave some padding
  const imageX = ARMY_UNIT_CELL_X + (ARMY_UNIT_CELL_SIZE - imageSize) / 2
  const imageY = ARMY_UNIT_CELL_Y + (ARMY_UNIT_CELL_SIZE - imageSize) / 2
  
  // Draw image if loaded
  const swordsmanImage = getCachedImage(UNIT_TYPES.SWORDSMAN.imagePath)
  if (swordsmanImage) {
    drawImage(ctx, swordsmanImage, imageX, imageY, imageSize, imageSize)
  }
  
  // Draw selection animation if selected
  if (swordsmanState.isSelected) {
    drawSelectionAnimation(ctx, ARMY_UNIT_CELL_X, ARMY_UNIT_CELL_Y, ARMY_UNIT_CELL_SIZE)
  }
  
  // Draw numeric counter in bottom right corner (over everything else)
  drawUnitCounter(ctx, ARMY_UNIT_CELL_X, ARMY_UNIT_CELL_Y, ARMY_UNIT_CELL_SIZE, 1)
  
  ctx.restore()
}

/**
 * Draw numeric counter in bottom right corner of a cell
 */
const drawUnitCounter = (ctx: CanvasRenderingContext2D, cellX: number, cellY: number, cellSize: number, count: number) => {
  ctx.save()
  
  // Position in bottom right corner - 1/3 of cell size 
  const counterWidth = Math.floor(cellSize / 3)
  const counterHeight = Math.floor(cellSize / 3)
  const counterX = cellX + cellSize - counterWidth
  const counterY = cellY + cellSize - counterHeight
  
  // Draw counter background (semi-transparent dark)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillRect(counterX, counterY, counterWidth, counterHeight)
  
  // No border (removed green border as requested)
  
  // Draw counter number - font size relative to counter size
  ctx.fillStyle = TEXT_PRIMARY
  const fontSize = Math.max(8, Math.floor(counterHeight * 0.7)) // 70% of counter height, minimum 8px
  ctx.font = `${fontSize}px "Pixelify Sans", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const textX = counterX + counterWidth / 2
  const textY = counterY + counterHeight / 2
  ctx.fillText(count.toString(), textX, textY)
  
  ctx.restore()
}

/**
 * Draw square selection animation around a cell with rounded borders
 */
const drawSelectionAnimation = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  const currentTime = Date.now()
  const elapsedTime = (currentTime - swordsmanState.selectionStartTime) % 2000 // 2 second cycle
  const progress = elapsedTime / 2000 // 0 to 1
  
  ctx.save()
  ctx.strokeStyle = '#4CAF50' // Same green as wall hover
  ctx.lineWidth = 3
  
  const borderOffset = 2 // Distance outside the cell
  const squareX = x - borderOffset
  const squareY = y - borderOffset  
  const squareSize = size + (borderOffset * 2)
  const cornerRadius = 6 // Slightly rounded corners
  
  // Create spinning gradient effect by drawing segments with varying opacity
  const segments = 8
  const segmentLength = squareSize * 4 / segments // Perimeter divided by segments
  const rotationOffset = progress * (squareSize * 4) // Full rotation around perimeter
  
  for (let i = 0; i < segments; i++) {
    const segmentStart = (i * segmentLength + rotationOffset) % (squareSize * 4)
    const segmentEnd = segmentStart + (segmentLength * 0.7) // Gaps between segments
    
    // Vary opacity based on position for gradient effect
    const opacity = 0.3 + 0.7 * Math.sin((i / segments) * Math.PI * 2 + progress * Math.PI * 2)
    ctx.globalAlpha = Math.max(0.2, opacity)
    
    // Draw rounded segment on the square perimeter
    drawRoundedSquareSegment(ctx, squareX, squareY, squareSize, cornerRadius, segmentStart, segmentEnd)
  }
  
  ctx.restore()
}

/**
 * Draw a rounded segment of the square border
 */
const drawRoundedSquareSegment = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, cornerRadius: number, start: number, end: number) => {
  const perimeter = size * 4
  
  // Clamp values to perimeter
  start = Math.max(0, Math.min(perimeter, start))
  end = Math.max(0, Math.min(perimeter, end))
  
  if (start >= end) return
  
  ctx.beginPath()
  
  // Calculate which sides the segment spans, accounting for rounded corners
  const topLength = size - cornerRadius * 2
  const rightLength = size - cornerRadius * 2  
  const bottomLength = size - cornerRadius * 2
  const leftLength = size - cornerRadius * 2
  
  const topStart = cornerRadius
  const rightStart = topStart + topLength + cornerRadius
  const bottomStart = rightStart + rightLength + cornerRadius  
  const leftStart = bottomStart + bottomLength + cornerRadius
  
  if (start < rightStart && end > topStart) {
    // Top side
    const segStart = Math.max(start - topStart, 0)
    const segEnd = Math.min(end - topStart, topLength)
    if (segEnd > segStart) {
      ctx.moveTo(x + cornerRadius + segStart, y)
      ctx.lineTo(x + cornerRadius + segEnd, y)
    }
  }
  
  if (start < bottomStart && end > rightStart) {
    // Right side  
    const segStart = Math.max(start - rightStart, 0)
    const segEnd = Math.min(end - rightStart, rightLength)
    if (segEnd > segStart) {
      ctx.moveTo(x + size, y + cornerRadius + segStart)
      ctx.lineTo(x + size, y + cornerRadius + segEnd)
    }
  }
  
  if (start < leftStart && end > bottomStart) {
    // Bottom side
    const segStart = Math.max(start - bottomStart, 0) 
    const segEnd = Math.min(end - bottomStart, bottomLength)
    if (segEnd > segStart) {
      ctx.moveTo(x + size - cornerRadius - segStart, y + size)
      ctx.lineTo(x + size - cornerRadius - segEnd, y + size)
    }
  }
  
  if (end > leftStart) {
    // Left side
    const segStart = Math.max(start - leftStart, 0)
    const segEnd = Math.min(end - leftStart, leftLength)
    if (segEnd > segStart) {
      ctx.moveTo(x, y + size - cornerRadius - segStart)
      ctx.lineTo(x, y + size - cornerRadius - segEnd)
    }
  }
  
  // Draw corner arcs if segment spans across corners
  if (start <= topStart + cornerRadius && end >= topStart) {
    // Top-right corner arc
    const startAngle = Math.max(0, (start - topStart) / cornerRadius) * Math.PI / 2 - Math.PI / 2
    const endAngle = Math.min(1, (end - topStart) / cornerRadius) * Math.PI / 2 - Math.PI / 2
    if (endAngle > startAngle) {
      ctx.arc(x + size - cornerRadius, y + cornerRadius, cornerRadius, startAngle, endAngle)
    }
  }
  
  ctx.stroke()
}

/**
 * Get controls section bounds
 */
export const getControlsBounds = () => ({
  x: CONTROLS_X,
  y: CONTROLS_Y,
  width: CONTROLS_WIDTH,
  height: 400 // Can be adjusted based on content
})

/**
 * Check if coordinates are within controls section
 */
export const isInControlsSection = (x: number, y: number): boolean => {
  const bounds = getControlsBounds()
  return x >= bounds.x && 
         x <= bounds.x + bounds.width &&
         y >= bounds.y && 
         y <= bounds.y + bounds.height
}

/**
 * Handle click on swordsman unit cell
 */
export const handleSwordsmanClick = (x: number, y: number, renderCallback: () => void): boolean => {
  // Check if click is within swordsman cell bounds
  if (x >= ARMY_UNIT_CELL_X && 
      x <= ARMY_UNIT_CELL_X + ARMY_UNIT_CELL_SIZE && 
      y >= ARMY_UNIT_CELL_Y && 
      y <= ARMY_UNIT_CELL_Y + ARMY_UNIT_CELL_SIZE) {
    
    // Toggle selection state
    swordsmanState.isSelected = !swordsmanState.isSelected
    swordsmanState.selectionStartTime = Date.now()
    
    // Start or stop selection animation
    if (swordsmanState.isSelected) {
      startSelectionAnimation(renderCallback)
    } else {
      stopSelectionAnimation()
    }
    
    renderCallback()
    return true
  }
  
  return false
}

/**
 * Start continuous selection animation
 */
const startSelectionAnimation = (renderCallback: () => void) => {
  // Only start if not already running
  if (selectionAnimationId !== null) return
  
  const animate = () => {
    if (!swordsmanState.isSelected) {
      // Stop animation if no longer selected
      selectionAnimationId = null
      return
    }
    
    // Continue animation
    renderCallback()
    selectionAnimationId = requestAnimationFrame(animate)
  }
  
  animate()
}

/**
 * Stop selection animation
 */
const stopSelectionAnimation = () => {
  if (selectionAnimationId !== null) {
    cancelAnimationFrame(selectionAnimationId)
    selectionAnimationId = null
  }
}

/**
 * Check if a point is within the swordsman cell
 */
export const isPointInSwordsmanCell = (x: number, y: number): boolean => {
  return x >= ARMY_UNIT_CELL_X && 
         x <= ARMY_UNIT_CELL_X + ARMY_UNIT_CELL_SIZE && 
         y >= ARMY_UNIT_CELL_Y && 
         y <= ARMY_UNIT_CELL_Y + ARMY_UNIT_CELL_SIZE
}
