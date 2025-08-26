/**
 * Info carousel for displaying unit information
 */

import { renderText } from './fontUtils'
import { drawImage, getCachedImage } from './imageUtils'
import { drawSectionHeader } from './uiSectionUtils'
import { showTooltip } from './tooltipUtils'
import {
  INFO_X, INFO_Y, INFO_WIDTH, INFO_HEIGHT,
  ARMY_UNIT_CELL_SIZE, INFO_ARROW_GAP, INFO_TOOLTIP_OFFSET
} from '../config/gameConfig'
import { TEXT_PRIMARY, BATTLEFIELD_CELL_BORDER, BATTLEFIELD_CELL_EMPTY } from '../config/palette'
import { getUnitById, ALLY_DESCRIPTIONS } from '../config/allUnitsConfig'

// Carousel state
interface CarouselState {
  currentSlideIndex: number
}

// Global carousel state
const carouselState: CarouselState = {
  currentSlideIndex: 0
}

// Unit slides configuration (6 slides: 3 army units + 3 upgrades)
interface UnitSlide {
  unitId: string
  name: string
  description: string
}

const UNIT_SLIDES: UnitSlide[] = [
  // Tier 1 units
  {
    unitId: 'swordsman',
    name: 'Swordsman',
    description: ALLY_DESCRIPTIONS.SWORDSMAN
  },
  {
    unitId: 'bowman',
    name: 'Bowman', 
    description: ALLY_DESCRIPTIONS.BOWMAN
  },
  {
    unitId: 'monk',
    name: 'Monk',
    description: ALLY_DESCRIPTIONS.MONK
  },
  // Tier 2 units (upgrades)
  {
    unitId: 'barbarian',
    name: 'Barbarian',
    description: ALLY_DESCRIPTIONS.BARBARIAN
  },
  {
    unitId: 'lancer',
    name: 'Lancer',
    description: ALLY_DESCRIPTIONS.LANCER
  },
  {
    unitId: 'bishop',
    name: 'Bishop',
    description: ALLY_DESCRIPTIONS.BISHOP
  }
]

// Arrow button dimensions (just text, no background)
const ARROW_BUTTON_WIDTH = 7 // 3x narrower horizontally (20 / 3 ≈ 7)
const ARROW_BUTTON_HEIGHT = 60 // Same height as before

// Arrow button positions (beside the unit cell with larger gap)
const CELL_SIZE = ARMY_UNIT_CELL_SIZE
const CELL_X = INFO_X + (INFO_WIDTH - CELL_SIZE) / 2
const LEFT_ARROW_X = CELL_X - ARROW_BUTTON_WIDTH - INFO_ARROW_GAP
const RIGHT_ARROW_X = CELL_X + CELL_SIZE + INFO_ARROW_GAP
const ARROW_BUTTON_Y = INFO_Y + 80 + (CELL_SIZE - ARROW_BUTTON_HEIGHT) / 2 // Vertically centered with cell

/**
 * Navigate to previous slide (looped)
 */
export const navigateToPreviousSlide = (): void => {
  carouselState.currentSlideIndex = (carouselState.currentSlideIndex - 1 + UNIT_SLIDES.length) % UNIT_SLIDES.length
}

/**
 * Navigate to next slide (looped)
 */
export const navigateToNextSlide = (): void => {
  carouselState.currentSlideIndex = (carouselState.currentSlideIndex + 1) % UNIT_SLIDES.length
}

/**
 * Get current slide data
 */
const getCurrentSlide = (): UnitSlide => {
  return UNIT_SLIDES[carouselState.currentSlideIndex]
}

/**
 * Render the info section with unit carousel
 */
export const renderInfo = (ctx: CanvasRenderingContext2D): void => {
  // Draw section header
  drawSectionHeader(
    ctx,
    'INFO',
    INFO_X,
    INFO_Y,
    INFO_WIDTH,
    INFO_HEIGHT
  )

  // Get current slide data
  const currentSlide = getCurrentSlide()
  const unitConfig = getUnitById(currentSlide.unitId)

  if (!unitConfig) {
    console.warn(`Unit config not found for ${currentSlide.unitId}`)
    return
  }

  // Draw navigation arrows
  drawNavigationArrows(ctx)

  // Draw unit cell in center
  const cellY = INFO_Y + 80 // Below header

  drawUnitCell(ctx, CELL_X, cellY, CELL_SIZE, unitConfig)

  // Draw unit name below cell
  const nameY = cellY + CELL_SIZE + 20
  renderText(ctx, currentSlide.name, INFO_X + INFO_WIDTH / 2, nameY, TEXT_PRIMARY, 16)

  // Draw unit description below name
  const descriptionY = nameY + 30
  drawDescription(ctx, currentSlide.description, INFO_X + 15, descriptionY)
}

/**
 * Draw navigation arrows (< and >)
 */
const drawNavigationArrows = (ctx: CanvasRenderingContext2D): void => {
  ctx.save()
  
  // Left arrow (<)
  drawArrowButton(ctx, LEFT_ARROW_X, ARROW_BUTTON_Y, ARROW_BUTTON_WIDTH, ARROW_BUTTON_HEIGHT, '<')
  
  // Right arrow (>)
  drawArrowButton(ctx, RIGHT_ARROW_X, ARROW_BUTTON_Y, ARROW_BUTTON_WIDTH, ARROW_BUTTON_HEIGHT, '>')
  
  ctx.restore()
}

/**
 * Draw individual arrow button (just the symbol, no background)
 */
const drawArrowButton = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, arrow: string): void => {
  ctx.save()
  
  // Use same color as cell border
  ctx.fillStyle = BATTLEFIELD_CELL_BORDER
  ctx.font = `bold ${height}px "Pixelify Sans", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Scale horizontally to make narrower (3x less wide)
  ctx.scale(0.33, 1) // 1/3 horizontal scale, normal vertical scale
  
  // Adjust x position to account for scaling
  const scaledX = (x + width / 2) / 0.33
  const scaledY = y + height / 2
  
  ctx.fillText(arrow, scaledX, scaledY)
  
  ctx.restore()
}

/**
 * Draw unit cell (same style as Army block)
 */
const drawUnitCell = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, unitConfig: any): void => {
  // Draw cell background and border (same as Army block)
  ctx.fillStyle = BATTLEFIELD_CELL_EMPTY
  ctx.strokeStyle = BATTLEFIELD_CELL_BORDER
  ctx.lineWidth = 2
  ctx.fillRect(x, y, size, size)
  ctx.strokeRect(x, y, size, size)

  // Draw unit sprite (use imagePath for ally units)
  try {
    const image = getCachedImage(unitConfig.imagePath)
    if (image && image.complete && image.naturalWidth > 0) {
      const spriteScale = unitConfig.spriteScale || 1.0
      const spriteSize = size * spriteScale
      const offsetX = (size - spriteSize) / 2
      const offsetY = (size - spriteSize) / 2
      
      drawImage(ctx, image, x + offsetX, y + offsetY, spriteSize, spriteSize)
    }
  } catch (error) {
    console.warn(`Failed to load unit image for ${unitConfig.id}:`, error)
    
    // Fallback: draw unit ID text
    ctx.fillStyle = TEXT_PRIMARY
    ctx.font = '12px "Pixelify Sans", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(unitConfig.id.substring(0, 4).toUpperCase(), x + size / 2, y + size / 2)
  }

  // Draw max health inside cell (same style as wall units)
  drawHealthInsideCell(ctx, x, y, size, unitConfig.maxHealth)
}

/**
 * Draw health inside cell (same style as wall units)
 */
const drawHealthInsideCell = (ctx: CanvasRenderingContext2D, cellX: number, cellY: number, cellSize: number, maxHealth: number): void => {
  ctx.save()
  
  // Same style as wall units: white text with black outline
  ctx.fillStyle = '#FFFFFF' // White text
  ctx.strokeStyle = '#000000' // Black outline
  ctx.lineWidth = 2
  ctx.font = '16px "Pixelify Sans", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  
  // Position health number at the top center of the cell (same as wall units)
  const healthX = cellX + cellSize / 2
  const healthY = cellY + 2 // Top of the cell with small offset
  
  const healthText = maxHealth.toString()
  
  // Draw stroke first, then fill (same as wall units)
  ctx.strokeText(healthText, healthX, healthY)
  ctx.fillText(healthText, healthX, healthY)
  
  ctx.restore()
}

/**
 * Draw unit description with word wrapping
 */
const drawDescription = (ctx: CanvasRenderingContext2D, description: string, x: number, y: number): void => {
  ctx.save()
  
  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = '14px "Pixelify Sans", monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  // Calculate max width for text (leave padding on both sides)
  const maxWidth = INFO_WIDTH - 30 // 15px padding on each side
  
  // Simple word wrapping
  const words = description.split(' ')
  let currentLine = ''
  let lineY = y
  const lineHeight = 18
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const testWidth = ctx.measureText(testLine).width
    
    if (testWidth > maxWidth && currentLine) {
      // Draw current line and start new line
      ctx.fillText(currentLine, x, lineY)
      currentLine = word
      lineY += lineHeight
    } else {
      currentLine = testLine
    }
  }
  
  // Draw final line
  if (currentLine) {
    ctx.fillText(currentLine, x, lineY)
  }
  
  ctx.restore()
}

/**
 * Check if point is in left arrow button
 */
export const isPointInLeftArrow = (x: number, y: number): boolean => {
  return x >= LEFT_ARROW_X && 
         x <= LEFT_ARROW_X + ARROW_BUTTON_WIDTH &&
         y >= ARROW_BUTTON_Y && 
         y <= ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT
}

/**
 * Check if point is in right arrow button
 */
export const isPointInRightArrow = (x: number, y: number): boolean => {
  return x >= RIGHT_ARROW_X && 
         x <= RIGHT_ARROW_X + ARROW_BUTTON_WIDTH &&
         y >= ARROW_BUTTON_Y && 
         y <= ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT
}

/**
 * Handle tooltip display for navigation arrows
 */
export const handleInfoTooltips = (mouseX: number, mouseY: number): void => {
  if (isPointInLeftArrow(mouseX, mouseY)) {
    const tooltipX = LEFT_ARROW_X + ARROW_BUTTON_WIDTH / 2
    const tooltipY = ARROW_BUTTON_Y + INFO_TOOLTIP_OFFSET // Configurable distance from chevron top
    showTooltip('Previous unit', tooltipX, tooltipY)
  } else if (isPointInRightArrow(mouseX, mouseY)) {
    const tooltipX = RIGHT_ARROW_X + ARROW_BUTTON_WIDTH / 2
    const tooltipY = ARROW_BUTTON_Y + INFO_TOOLTIP_OFFSET // Configurable distance from chevron top
    showTooltip('Next unit', tooltipX, tooltipY)
  }
  // Note: hideTooltip will be handled by the main tooltip system
}

/**
 * Handle mouse clicks on navigation arrows
 */
export const handleInfoClick = (x: number, y: number): boolean => {
  if (isPointInLeftArrow(x, y)) {
    navigateToPreviousSlide()
    return true
  } else if (isPointInRightArrow(x, y)) {
    navigateToNextSlide()
    return true
  }
  return false
}
