import { renderText } from './fontUtils'
import { drawImage, getCachedImage } from './imageUtils'
import { 
  CONTROLS_X, CONTROLS_Y, CONTROLS_WIDTH, 
  ARMY_X, ARMY_Y, ARMY_WIDTH,
  ARMY_UNIT_CELL_SIZE,
  SWORDSMAN_CELL_X, SWORDSMAN_CELL_Y,
  BOWMAN_CELL_X, BOWMAN_CELL_Y,
  INITIAL_SWORDSMAN_COUNT, INITIAL_BOWMAN_COUNT
} from '../config/gameConfig'
import { TEXT_PRIMARY, BATTLEFIELD_CELL_BORDER, BATTLEFIELD_CELL_EMPTY } from '../config/palette'
import { UNIT_TYPES, getUnitById } from '../config/unitsConfig'
import { placeUnitOnWall } from './wallExtensions'

// Army unit selection state
interface ArmyUnitState {
  isSelected: boolean
  selectionStartTime: number
  count: number
}

// Global selection state for unit placement
interface GlobalSelectionState {
  isUnitSelected: boolean
  selectedUnitType: string | null
  cursorSprite: HTMLImageElement | null
}

export let swordsmanState: ArmyUnitState = {
  isSelected: false,
  selectionStartTime: 0,
  count: INITIAL_SWORDSMAN_COUNT
}

export let bowmanState: ArmyUnitState = {
  isSelected: false,
  selectionStartTime: 0,
  count: INITIAL_BOWMAN_COUNT
}

export let globalSelection: GlobalSelectionState = {
  isUnitSelected: false,
  selectedUnitType: null,
  cursorSprite: null
}

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
  
  // Render unit cells
  renderSwordsmanCell(ctx)
  renderBowmanCell(ctx)
}

/**
 * Render the swordsman unit cell in the army section
 */
const renderSwordsmanCell = (ctx: CanvasRenderingContext2D) => {
  ctx.save()
  
  // Draw cell background (same as battlefield cells)
  ctx.fillStyle = BATTLEFIELD_CELL_EMPTY
  ctx.fillRect(SWORDSMAN_CELL_X, SWORDSMAN_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE)
  
  // Draw cell border - darker when disabled
  ctx.strokeStyle = swordsmanState.count > 0 ? BATTLEFIELD_CELL_BORDER : '#333333'
  ctx.lineWidth = 1
  ctx.strokeRect(SWORDSMAN_CELL_X, SWORDSMAN_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE)
  
  // Draw swordsman image (centered in cell) with sprite scaling
  const spriteScale = UNIT_TYPES.SWORDSMAN.spriteScale || 1.0
  const baseImageSize = ARMY_UNIT_CELL_SIZE - 8 // Leave some padding
  const scaledImageSize = baseImageSize * spriteScale
  const imageX = SWORDSMAN_CELL_X + (ARMY_UNIT_CELL_SIZE - scaledImageSize) / 2
  const imageY = SWORDSMAN_CELL_Y + (ARMY_UNIT_CELL_SIZE - scaledImageSize) / 2
  
  // Draw image if loaded - semi-transparent when disabled
  const swordsmanImage = getCachedImage(UNIT_TYPES.SWORDSMAN.imagePath)
  if (swordsmanImage) {
    // Set opacity - semi-transparent when disabled
    ctx.globalAlpha = swordsmanState.count > 0 ? 1.0 : 0.3
    drawImage(ctx, swordsmanImage, imageX, imageY, scaledImageSize, scaledImageSize)
    ctx.globalAlpha = 1.0 // Reset opacity
  }
  
  // Draw selection animation if selected
  if (swordsmanState.isSelected) {
    drawSelectionAnimation(ctx, SWORDSMAN_CELL_X, SWORDSMAN_CELL_Y, ARMY_UNIT_CELL_SIZE)
  }
  
  // Draw numeric counter in bottom right corner (over everything else)
  drawUnitCounter(ctx, SWORDSMAN_CELL_X, SWORDSMAN_CELL_Y, ARMY_UNIT_CELL_SIZE, swordsmanState.count)
  
  ctx.restore()
}

/**
 * Render the bowman unit cell in the army section
 */
const renderBowmanCell = (ctx: CanvasRenderingContext2D) => {
  ctx.save()
  
  // Draw cell background (same as battlefield cells)
  ctx.fillStyle = BATTLEFIELD_CELL_EMPTY
  ctx.fillRect(BOWMAN_CELL_X, BOWMAN_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE)
  
  // Draw cell border - darker when disabled
  ctx.strokeStyle = bowmanState.count > 0 ? BATTLEFIELD_CELL_BORDER : '#333333'
  ctx.lineWidth = 1
  ctx.strokeRect(BOWMAN_CELL_X, BOWMAN_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE)
  
  // Draw bowman image (centered in cell) with sprite scaling  
  const spriteScale = UNIT_TYPES.BOWMAN.spriteScale || 1.0
  const baseImageSize = ARMY_UNIT_CELL_SIZE - 8 // Leave some padding
  const scaledImageSize = baseImageSize * spriteScale
  const imageX = BOWMAN_CELL_X + (ARMY_UNIT_CELL_SIZE - scaledImageSize) / 2
  const imageY = BOWMAN_CELL_Y + (ARMY_UNIT_CELL_SIZE - scaledImageSize) / 2
  
  // Draw image if loaded - semi-transparent when disabled
  const bowmanImage = getCachedImage(UNIT_TYPES.BOWMAN.imagePath)
  if (bowmanImage) {
    // Set opacity - semi-transparent when disabled
    ctx.globalAlpha = bowmanState.count > 0 ? 1.0 : 0.3
    drawImage(ctx, bowmanImage, imageX, imageY, scaledImageSize, scaledImageSize)
    ctx.globalAlpha = 1.0 // Reset opacity
  }
  
  // Draw selection animation if selected
  if (bowmanState.isSelected) {
    drawSelectionAnimation(ctx, BOWMAN_CELL_X, BOWMAN_CELL_Y, ARMY_UNIT_CELL_SIZE)
  }
  
  // Draw numeric counter in bottom right corner (over everything else)
  drawUnitCounter(ctx, BOWMAN_CELL_X, BOWMAN_CELL_Y, ARMY_UNIT_CELL_SIZE, bowmanState.count)
  
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
  
  // Determine which unit is selected and use appropriate timing
  let selectionStartTime: number
  if (swordsmanState.isSelected) {
    selectionStartTime = swordsmanState.selectionStartTime
  } else if (bowmanState.isSelected) {
    selectionStartTime = bowmanState.selectionStartTime
  } else {
    return // No unit selected
  }
  
  const elapsedTime = (currentTime - selectionStartTime) % 6000 // 6 second cycle (3x slower)
  const progress = elapsedTime / 6000 // 0 to 1
  
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
    
    // Synchronized gradient rotation - rotates with the same speed as border scroll
    const gradientRotation = progress * Math.PI * 2 // Same rotation speed as border scroll
    const opacity = 0.3 + 0.7 * Math.sin((i / segments) * Math.PI * 2 + gradientRotation)
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
 * Render cursor sprite when unit is selected
 */
export const renderCursorSprite = (ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number) => {
  if (globalSelection.isUnitSelected && globalSelection.cursorSprite && globalSelection.selectedUnitType) {
    ctx.save()
    
    // Get unit type for sprite scaling
    const unitType = getUnitById(globalSelection.selectedUnitType)
    const spriteScale = unitType?.spriteScale || 1.0
    
    // Make sprite smaller and semi-transparent with scaling
    const baseSpriteSize = 32 // Smaller than cell size
    const scaledSpriteSize = baseSpriteSize * spriteScale
    const spriteX = mouseX - scaledSpriteSize / 2
    const spriteY = mouseY - scaledSpriteSize / 2
    
    ctx.globalAlpha = 0.7 // Semi-transparent
    drawImage(ctx, globalSelection.cursorSprite, spriteX, spriteY, scaledSpriteSize, scaledSpriteSize)
    
    ctx.restore()
  }
}

/**
 * Handle global click for deselection or unit placement
 */
export const handleGlobalClick = (_x: number, _y: number, renderCallback: () => void): boolean => {
  // If no unit is selected, nothing to do
  if (!globalSelection.isUnitSelected) {
    return false
  }
  
  // Always deselect the unit after any click
  swordsmanState.isSelected = false
  bowmanState.isSelected = false // Fix: Also deselect bowman
  globalSelection.isUnitSelected = false
  globalSelection.selectedUnitType = null
  globalSelection.cursorSprite = null
  stopSelectionAnimation()
  
  renderCallback()
  return true
}

/**
 * Attempt to place unit on wall cell
 */
export const tryPlaceUnitOnWall = (wallType: 'left' | 'right' | 'bottom', cellIndex: number): boolean => {
  // Check if unit is selected
  if (!globalSelection.isUnitSelected || !globalSelection.selectedUnitType) {
    return false
  }
  
  // Check which unit type is selected and verify count
  let unitState: ArmyUnitState
  if (globalSelection.selectedUnitType === UNIT_TYPES.SWORDSMAN.id) {
    unitState = swordsmanState
  } else if (globalSelection.selectedUnitType === UNIT_TYPES.BOWMAN.id) {
    unitState = bowmanState
  } else {
    return false // Unknown unit type
  }
  
  // Check if unit has available count
  if (unitState.count <= 0) {
    return false
  }
  
  // Try to place the unit
  const success = placeUnitOnWall(wallType, cellIndex, globalSelection.selectedUnitType)
  if (!success) {
    return false // Cell already occupied or invalid
  }
  
  // Decrease counter
  unitState.count -= 1
  
  return true
}

/**
 * Get current selection state for external components
 */
export const getSelectionState = () => ({
  isUnitSelected: globalSelection.isUnitSelected,
  selectedUnitType: globalSelection.selectedUnitType,
  swordsmanCount: swordsmanState.count,
  bowmanCount: bowmanState.count
})

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
  if (x >= SWORDSMAN_CELL_X && 
      x <= SWORDSMAN_CELL_X + ARMY_UNIT_CELL_SIZE && 
      y >= SWORDSMAN_CELL_Y && 
      y <= SWORDSMAN_CELL_Y + ARMY_UNIT_CELL_SIZE) {
    
    // Can't select if unit is disabled (count <= 0)
    if (swordsmanState.count <= 0) {
      return true // Consumed the click but didn't change state
    }
    
    // Mutual exclusion: deselect bowman if selected
    if (bowmanState.isSelected) {
      bowmanState.isSelected = false
      stopSelectionAnimation()
    }
    
    // Toggle selection state
    swordsmanState.isSelected = !swordsmanState.isSelected
    swordsmanState.selectionStartTime = Date.now()
    
    // Update global selection state
    if (swordsmanState.isSelected) {
      globalSelection.isUnitSelected = true
      globalSelection.selectedUnitType = UNIT_TYPES.SWORDSMAN.id
      globalSelection.cursorSprite = getCachedImage(UNIT_TYPES.SWORDSMAN.imagePath) || null
      startSelectionAnimation(renderCallback)
    } else {
      globalSelection.isUnitSelected = false
      globalSelection.selectedUnitType = null
      globalSelection.cursorSprite = null
      stopSelectionAnimation()
    }
    
    renderCallback()
    return true
  }
  
  return false
}

/**
 * Handle click on bowman unit cell
 */
export const handleBowmanClick = (x: number, y: number, renderCallback: () => void): boolean => {
  // Check if click is within bowman cell bounds
  if (x >= BOWMAN_CELL_X && 
      x <= BOWMAN_CELL_X + ARMY_UNIT_CELL_SIZE && 
      y >= BOWMAN_CELL_Y && 
      y <= BOWMAN_CELL_Y + ARMY_UNIT_CELL_SIZE) {
    
    // Can't select if unit is disabled (count <= 0)
    if (bowmanState.count <= 0) {
      return true // Consumed the click but didn't change state
    }
    
    // Mutual exclusion: deselect swordsman if selected
    if (swordsmanState.isSelected) {
      swordsmanState.isSelected = false
      stopSelectionAnimation()
    }
    
    // Toggle selection state
    bowmanState.isSelected = !bowmanState.isSelected
    bowmanState.selectionStartTime = Date.now()
    
    // Update global selection state
    if (bowmanState.isSelected) {
      globalSelection.isUnitSelected = true
      globalSelection.selectedUnitType = UNIT_TYPES.BOWMAN.id
      globalSelection.cursorSprite = getCachedImage(UNIT_TYPES.BOWMAN.imagePath) || null
      startSelectionAnimation(renderCallback)
    } else {
      globalSelection.isUnitSelected = false
      globalSelection.selectedUnitType = null
      globalSelection.cursorSprite = null
      stopSelectionAnimation()
    }
    
    renderCallback()
    return true
  }
  
  return false
}

/**
 * Start continuous selection animation (no longer creates separate animation loop)
 */
const startSelectionAnimation = (_renderCallback: () => void) => {
  // Animation is now handled by the main game loop - no separate requestAnimationFrame needed
  // Selection animation will be drawn during normal render cycle when isSelected is true
}

/**
 * Stop selection animation (no longer manages separate animation loop)
 */
const stopSelectionAnimation = () => {
  // Animation stopping is now handled by setting isSelected = false
  // No need to cancel separate requestAnimationFrame since we use the main game loop
}

/**
 * Check if a point is within the swordsman cell
 */
export const isPointInSwordsmanCell = (x: number, y: number): boolean => {
  return x >= SWORDSMAN_CELL_X && 
         x <= SWORDSMAN_CELL_X + ARMY_UNIT_CELL_SIZE && 
         y >= SWORDSMAN_CELL_Y && 
         y <= SWORDSMAN_CELL_Y + ARMY_UNIT_CELL_SIZE
}

/**
 * Check if a point is within the bowman cell
 */
export const isPointInBowmanCell = (x: number, y: number): boolean => {
  return x >= BOWMAN_CELL_X && 
         x <= BOWMAN_CELL_X + ARMY_UNIT_CELL_SIZE && 
         y >= BOWMAN_CELL_Y && 
         y <= BOWMAN_CELL_Y + ARMY_UNIT_CELL_SIZE
}

/**
 * Check if a point is within any army unit cell
 */
export const isPointInAnyUnitCell = (x: number, y: number): boolean => {
  return isPointInSwordsmanCell(x, y) || isPointInBowmanCell(x, y)
}

/**
 * Reset all army unit states to initial values (for game restart)
 */
export const resetArmyStates = (): void => {
  swordsmanState.isSelected = false
  swordsmanState.selectionStartTime = 0
  swordsmanState.count = INITIAL_SWORDSMAN_COUNT
  
  bowmanState.isSelected = false
  bowmanState.selectionStartTime = 0
  bowmanState.count = INITIAL_BOWMAN_COUNT
}
