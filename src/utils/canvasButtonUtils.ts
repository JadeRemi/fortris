import { renderText } from './fontUtils'
import { CONTROLS_X, CONTROLS_Y } from '../config/gameConfig'
import { TEXT_PRIMARY } from '../config/palette'

export interface CanvasButton {
  x: number
  y: number
  width: number
  height: number
  text: string
  isPressed: boolean
  isHovered: boolean
}

/**
 * Draw a pixel-style button with indented corners on canvas
 */
export const drawPixelButton = (ctx: CanvasRenderingContext2D, button: CanvasButton) => {
  const { x: relativeX, y: relativeY, width, height, text, isPressed, isHovered } = button
  
  // Convert relative coordinates to absolute coordinates within controls section
  const x = CONTROLS_X + relativeX
  const y = CONTROLS_Y + relativeY
  
  // Choose colors based on state (darker button, lighter border)
  const borderColor = '#a0a0a0' // Light grey border
  const bgColor = isPressed ? '#1a1a1a' : (isHovered ? '#4a4a4a' : '#333333') // More noticeable hover
  const shadowColor = '#0a0a0a' // Very dark shadow
  const highlightColor = isHovered ? '#f0f0f0' : '#d0d0d0' // Brighter highlight on hover
  
  // Save context
  ctx.save()
  
  // Draw more pronounced indented corner effect
  const cornerSize = 12 // Larger corners for more pronounced effect
  
  // Draw outer border/highlight
  ctx.fillStyle = highlightColor
  drawIndentedRect(ctx, x, y, width, height, cornerSize)
  
  // Draw main border
  ctx.fillStyle = borderColor
  drawIndentedRect(ctx, x + 1, y + 1, width - 2, height - 2, cornerSize - 1)
  
  // Draw main button background
  const inset = isPressed ? 3 : 2
  ctx.fillStyle = bgColor
  drawIndentedRect(ctx, x + inset, y + inset, width - inset * 2, height - inset * 2, cornerSize - inset)
  
  // Draw inner shadow for depth
  if (!isPressed) {
    ctx.fillStyle = shadowColor
    drawIndentedRect(ctx, x + 5, y + 5, width - 10, height - 10, Math.max(2, cornerSize - 5))
  }
  
  // Draw text
  const textX = x + width / 2 + (isPressed ? 1 : 0)
  const textY = y + height / 2 + (isPressed ? 1 : 0)
  renderText(ctx, text, textX, textY, TEXT_PRIMARY, 16)
  
  ctx.restore()
}

/**
 * Draw a rectangle with sharp indented corners (square cutouts)
 */
const drawIndentedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, cornerSize: number) => {
  ctx.beginPath()
  
  // Create path with sharp indented corners (like square cutouts)
  // Start at top-left corner (after the indent)
  ctx.moveTo(x + cornerSize, y + cornerSize)
  
  // Top edge (with indented corners)
  ctx.lineTo(x + cornerSize, y)
  ctx.lineTo(x + width - cornerSize, y)
  ctx.lineTo(x + width - cornerSize, y + cornerSize)
  
  // Right edge (with indented corners)
  ctx.lineTo(x + width, y + cornerSize)
  ctx.lineTo(x + width, y + height - cornerSize)
  ctx.lineTo(x + width - cornerSize, y + height - cornerSize)
  
  // Bottom edge (with indented corners)
  ctx.lineTo(x + width - cornerSize, y + height)
  ctx.lineTo(x + cornerSize, y + height)
  ctx.lineTo(x + cornerSize, y + height - cornerSize)
  
  // Left edge (with indented corners)
  ctx.lineTo(x, y + height - cornerSize)
  ctx.lineTo(x, y + cornerSize)
  ctx.lineTo(x + cornerSize, y + cornerSize)
  
  ctx.closePath()
  ctx.fill()
}

/**
 * Check if a point is inside a button's bounds
 */
export const isPointInButton = (x: number, y: number, button: CanvasButton): boolean => {
  // Convert relative coordinates to absolute coordinates within controls section
  const absoluteX = CONTROLS_X + button.x
  const absoluteY = CONTROLS_Y + button.y
  
  return x >= absoluteX && 
         x <= absoluteX + button.width && 
         y >= absoluteY && 
         y <= absoluteY + button.height
}

/**
 * Create a button object
 */
export const createButton = (x: number, y: number, width: number, height: number, text: string): CanvasButton => ({
  x,
  y, 
  width,
  height,
  text,
  isPressed: false,
  isHovered: false
})
