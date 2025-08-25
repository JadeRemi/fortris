/**
 * Tooltip system for hover information on interactive elements
 */

// Tooltip configuration
const TOOLTIP_PADDING = 8
const TOOLTIP_BORDER_RADIUS = 6
const TOOLTIP_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.8)'
const TOOLTIP_BORDER_COLOR = '#444444'
const TOOLTIP_TEXT_COLOR = '#FFFFFF'
const TOOLTIP_FONT_SIZE = 14
const TOOLTIP_TRIANGLE_SIZE = 6

// Tooltip data structure
interface TooltipData {
  text: string
  x: number // Position to point the tooltip at
  y: number // Position to point the tooltip at
  isVisible: boolean
}

// Active tooltip state
let currentTooltip: TooltipData | null = null

/**
 * Show tooltip at specified position
 */
export const showTooltip = (text: string, x: number, y: number): void => {
  currentTooltip = {
    text,
    x,
    y,
    isVisible: true
  }
}

/**
 * Hide current tooltip
 */
export const hideTooltip = (): void => {
  currentTooltip = null
}

/**
 * Check if tooltip is currently visible
 */
export const isTooltipVisible = (): boolean => {
  return currentTooltip !== null && currentTooltip.isVisible
}

/**
 * Calculate tooltip dimensions based on text content
 */
const calculateTooltipDimensions = (ctx: CanvasRenderingContext2D, text: string): { width: number, height: number } => {
  ctx.save()
  ctx.font = `${TOOLTIP_FONT_SIZE}px monospace`
  const textMetrics = ctx.measureText(text)
  ctx.restore()
  
  const width = textMetrics.width + (TOOLTIP_PADDING * 2)
  const height = TOOLTIP_FONT_SIZE + (TOOLTIP_PADDING * 2)
  
  return { width, height }
}

/**
 * Calculate optimal tooltip position to stay within canvas bounds
 */
const calculateTooltipPosition = (
  targetX: number, 
  targetY: number, 
  tooltipWidth: number, 
  tooltipHeight: number,
  canvasWidth: number = 1920,
  canvasHeight: number = 1080
): { x: number, y: number, trianglePosition: 'bottom' | 'top' | 'left' | 'right' } => {
  
  const margin = 10 // Distance from canvas edge
  let x = targetX
  let y = targetY
  let trianglePosition: 'bottom' | 'top' | 'left' | 'right' = 'bottom'
  
  // Try to position tooltip well above the target by default (more spacing to avoid obstruction)
  y = targetY - tooltipHeight - TOOLTIP_TRIANGLE_SIZE - 25 // Increased from 5 to 25 for better clearance
  trianglePosition = 'bottom'
  
  // If tooltip would go off the top, position it below
  if (y < margin) {
    y = targetY + TOOLTIP_TRIANGLE_SIZE + 5
    trianglePosition = 'top'
  }
  
  // Center horizontally on target
  x = targetX - tooltipWidth / 2
  
  // Keep within horizontal bounds
  if (x < margin) {
    x = margin
  } else if (x + tooltipWidth > canvasWidth - margin) {
    x = canvasWidth - tooltipWidth - margin
  }
  
  // If still doesn't fit vertically, try positioning to the sides
  if (y + tooltipHeight > canvasHeight - margin) {
    // Try positioning to the left
    x = targetX - tooltipWidth - TOOLTIP_TRIANGLE_SIZE - 5
    y = targetY - tooltipHeight / 2
    trianglePosition = 'right'
    
    // If doesn't fit to the left, try right
    if (x < margin) {
      x = targetX + TOOLTIP_TRIANGLE_SIZE + 5
      trianglePosition = 'left'
    }
    
    // Keep within vertical bounds when positioned to sides
    if (y < margin) {
      y = margin
    } else if (y + tooltipHeight > canvasHeight - margin) {
      y = canvasHeight - tooltipHeight - margin
    }
  }
  
  return { x, y, trianglePosition }
}

/**
 * Draw triangular pointer/beak pointing to the target
 */
const drawTooltipTriangle = (
  ctx: CanvasRenderingContext2D, 
  tooltipX: number, 
  tooltipY: number, 
  tooltipWidth: number, 
  tooltipHeight: number,
  trianglePosition: 'bottom' | 'top' | 'left' | 'right',
  targetX: number,
  targetY: number
): void => {
  
  ctx.save()
  ctx.fillStyle = TOOLTIP_BACKGROUND_COLOR
  ctx.strokeStyle = TOOLTIP_BORDER_COLOR
  ctx.lineWidth = 1
  
  ctx.beginPath()
  
  switch (trianglePosition) {
    case 'bottom':
      // Triangle pointing down from bottom of tooltip
      const bottomCenterX = Math.max(tooltipX + 10, Math.min(tooltipX + tooltipWidth - 10, targetX))
      ctx.moveTo(bottomCenterX - TOOLTIP_TRIANGLE_SIZE, tooltipY + tooltipHeight)
      ctx.lineTo(bottomCenterX, tooltipY + tooltipHeight + TOOLTIP_TRIANGLE_SIZE)
      ctx.lineTo(bottomCenterX + TOOLTIP_TRIANGLE_SIZE, tooltipY + tooltipHeight)
      break
      
    case 'top':
      // Triangle pointing up from top of tooltip
      const topCenterX = Math.max(tooltipX + 10, Math.min(tooltipX + tooltipWidth - 10, targetX))
      ctx.moveTo(topCenterX - TOOLTIP_TRIANGLE_SIZE, tooltipY)
      ctx.lineTo(topCenterX, tooltipY - TOOLTIP_TRIANGLE_SIZE)
      ctx.lineTo(topCenterX + TOOLTIP_TRIANGLE_SIZE, tooltipY)
      break
      
    case 'right':
      // Triangle pointing right from right side of tooltip
      const rightCenterY = Math.max(tooltipY + 10, Math.min(tooltipY + tooltipHeight - 10, targetY))
      ctx.moveTo(tooltipX + tooltipWidth, rightCenterY - TOOLTIP_TRIANGLE_SIZE)
      ctx.lineTo(tooltipX + tooltipWidth + TOOLTIP_TRIANGLE_SIZE, rightCenterY)
      ctx.lineTo(tooltipX + tooltipWidth, rightCenterY + TOOLTIP_TRIANGLE_SIZE)
      break
      
    case 'left':
      // Triangle pointing left from left side of tooltip
      const leftCenterY = Math.max(tooltipY + 10, Math.min(tooltipY + tooltipHeight - 10, targetY))
      ctx.moveTo(tooltipX, leftCenterY - TOOLTIP_TRIANGLE_SIZE)
      ctx.lineTo(tooltipX - TOOLTIP_TRIANGLE_SIZE, leftCenterY)
      ctx.lineTo(tooltipX, leftCenterY + TOOLTIP_TRIANGLE_SIZE)
      break
  }
  
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

/**
 * Draw rounded rectangle for tooltip background
 */
const drawTooltipBackground = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): void => {
  
  ctx.save()
  ctx.fillStyle = TOOLTIP_BACKGROUND_COLOR
  ctx.strokeStyle = TOOLTIP_BORDER_COLOR
  ctx.lineWidth = 1
  
  // Draw rounded rectangle
  ctx.beginPath()
  ctx.moveTo(x + TOOLTIP_BORDER_RADIUS, y)
  ctx.arcTo(x + width, y, x + width, y + height, TOOLTIP_BORDER_RADIUS)
  ctx.arcTo(x + width, y + height, x, y + height, TOOLTIP_BORDER_RADIUS)
  ctx.arcTo(x, y + height, x, y, TOOLTIP_BORDER_RADIUS)
  ctx.arcTo(x, y, x + width, y, TOOLTIP_BORDER_RADIUS)
  ctx.closePath()
  
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

/**
 * Render the current tooltip if visible
 */
export const renderTooltip = (ctx: CanvasRenderingContext2D, canvasWidth: number = 1920, canvasHeight: number = 1080): void => {
  if (!currentTooltip || !currentTooltip.isVisible) {
    return
  }
  
  const { text, x: targetX, y: targetY } = currentTooltip
  
  // Calculate tooltip dimensions
  const { width: tooltipWidth, height: tooltipHeight } = calculateTooltipDimensions(ctx, text)
  
  // Calculate optimal position
  const { x: tooltipX, y: tooltipY, trianglePosition } = calculateTooltipPosition(
    targetX, 
    targetY, 
    tooltipWidth, 
    tooltipHeight,
    canvasWidth,
    canvasHeight
  )
  
  // Draw tooltip background
  drawTooltipBackground(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight)
  
  // Draw triangular pointer
  drawTooltipTriangle(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, trianglePosition, targetX, targetY)
  
  // Draw tooltip text
  ctx.save()
  ctx.fillStyle = TOOLTIP_TEXT_COLOR
  ctx.font = `${TOOLTIP_FONT_SIZE}px monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  
  const textX = tooltipX + TOOLTIP_PADDING
  const textY = tooltipY + tooltipHeight / 2
  ctx.fillText(text, textX, textY)
  
  ctx.restore()
}

/**
 * Check if a point is within a rectangular area (for hover detection)
 */
export const isPointInRect = (pointX: number, pointY: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean => {
  return pointX >= rectX && pointX <= rectX + rectWidth && pointY >= rectY && pointY <= rectY + rectHeight
}
