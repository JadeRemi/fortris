import { GAME_FONT_FAMILY, GAME_FONT_SIZE } from '../config/gameConfig'

/**
 * Load and verify game font
 */
export const loadGameFont = async (): Promise<boolean> => {
  try {
    await document.fonts.load(`${GAME_FONT_SIZE}px "${GAME_FONT_FAMILY}"`)
    return document.fonts.check(`${GAME_FONT_SIZE}px "${GAME_FONT_FAMILY}"`)
  } catch (error) {
    console.warn('Failed to load game font:', error)
    return false
  }
}

/**
 * Set up canvas text rendering with game font
 */
export const setupCanvasFont = (ctx: CanvasRenderingContext2D, size: number = GAME_FONT_SIZE) => {
  ctx.font = `${size}px "${GAME_FONT_FAMILY}", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
}

/**
 * Render text with game font
 */
export const renderText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number = GAME_FONT_SIZE
) => {
  setupCanvasFont(ctx, size)
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}
