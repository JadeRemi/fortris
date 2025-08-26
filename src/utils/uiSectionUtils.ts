/**
 * Reusable UI section styling utilities
 * Ensures consistent styling across all UI blocks (Army, Controls, Logs, Inventory, Challenges)
 */

import { renderText } from './fontUtils'
import { TEXT_PRIMARY } from '../config/palette'

// Standard UI section dimensions - all blocks use these constants
export const STANDARD_SECTION_WIDTH = 200
export const STANDARD_SECTION_HEIGHT = 400
export const SECTION_TITLE_Y_OFFSET = 30  // Title position from top of section
export const SECTION_DIVIDER_Y_OFFSET = 50  // Divider line position from top
export const SECTION_PADDING_HORIZONTAL = 20  // Horizontal padding for content
export const SECTION_BORDER_COLOR = '#666666'
export const SECTION_DIVIDER_COLOR = '#444444'
export const SECTION_TITLE_FONT_SIZE = 20

/**
 * Draw standard section background with border
 */
export const drawSectionBackground = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number = STANDARD_SECTION_WIDTH, height: number = STANDARD_SECTION_HEIGHT) => {
  ctx.strokeStyle = SECTION_BORDER_COLOR
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, width, height)
}

/**
 * Draw section title centered at standard position
 */
export const drawSectionTitle = (ctx: CanvasRenderingContext2D, title: string, x: number, y: number, width: number = STANDARD_SECTION_WIDTH) => {
  renderText(ctx, title, x + width / 2, y + SECTION_TITLE_Y_OFFSET, TEXT_PRIMARY, SECTION_TITLE_FONT_SIZE)
}

/**
 * Draw section divider line under title
 */
export const drawSectionDivider = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number = STANDARD_SECTION_WIDTH) => {
  ctx.strokeStyle = SECTION_DIVIDER_COLOR
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + SECTION_PADDING_HORIZONTAL, y + SECTION_DIVIDER_Y_OFFSET)
  ctx.lineTo(x + width - SECTION_PADDING_HORIZONTAL, y + SECTION_DIVIDER_Y_OFFSET)
  ctx.stroke()
}

/**
 * Draw complete section header (background + title + divider)
 * This is the standard header used by all UI sections
 */
export const drawSectionHeader = (
  ctx: CanvasRenderingContext2D, 
  title: string, 
  x: number, 
  y: number, 
  width: number = STANDARD_SECTION_WIDTH, 
  height: number = STANDARD_SECTION_HEIGHT
) => {
  drawSectionBackground(ctx, x, y, width, height)
  drawSectionTitle(ctx, title, x, y, width)
  drawSectionDivider(ctx, x, y, width)
}
