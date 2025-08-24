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
  
  ctx.restore()
}

/**
 * Draw circling selection animation around a cell
 */
const drawSelectionAnimation = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  const currentTime = Date.now()
  const elapsedTime = (currentTime - swordsmanState.selectionStartTime) % 2000 // 2 second cycle
  const progress = elapsedTime / 2000 // 0 to 1
  
  // Create spinning gradient effect
  const centerX = x + size / 2
  const centerY = y + size / 2
  const radius = size / 2 + 2 // Slightly outside the cell
  
  ctx.save()
  ctx.strokeStyle = '#4CAF50' // Same green as wall hover
  ctx.lineWidth = 3
  
  // Draw multiple arcs to create spinning effect
  const segments = 8
  const segmentLength = (Math.PI * 2) / segments
  const rotationOffset = progress * Math.PI * 2 // Full rotation per cycle
  
  for (let i = 0; i < segments; i++) {
    const startAngle = (i * segmentLength) + rotationOffset
    const endAngle = startAngle + (segmentLength * 0.7) // Gaps between segments
    
    // Vary opacity based on position in circle for gradient effect
    const opacity = 0.3 + 0.7 * Math.sin((startAngle + rotationOffset) / 2)
    ctx.globalAlpha = Math.max(0.2, opacity)
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.stroke()
  }
  
  ctx.restore()
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
