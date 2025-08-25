import { renderText } from './fontUtils'
import { CONTROLS_X, CONTROLS_Y } from '../config/gameConfig'
import { TEXT_PRIMARY, BATTLEFIELD_CELL_EMPTY, BATTLEFIELD_CELL_BORDER } from '../config/palette'

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
  
  // Use same colors as Walls cells
  const borderColor = BATTLEFIELD_CELL_BORDER // Same as wall cell border
  const bgColor = isPressed ? '#1f1810' : (isHovered ? '#3a2d20' : BATTLEFIELD_CELL_EMPTY) // Wall cell background with pressed/hover variants
  const shadowColor = '#1a1209' // Darker shadow
  const highlightColor = isHovered ? '#5a4635' : BATTLEFIELD_CELL_BORDER // Subtle highlight
  
  // Save context
  ctx.save()
  
  // Draw simple rounded corners
  const cornerSize = 6 // Small border-radius
  
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
 * Draw a simple rounded rectangle
 */
const drawIndentedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, cornerSize: number) => {
  const radius = Math.min(cornerSize, width / 2, height / 2)
  
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
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
