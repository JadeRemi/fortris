/**
 * Inventory rendering and management utilities
 */

import { getCachedImage } from './imageUtils'
import { getCollectedCoinCount } from './coinUtils'
import { getCollectedDiamondCount } from './diamondUtils'
import { getImagePath } from './assetUtils'
import { renderText } from './fontUtils'
import {
  INVENTORY_X, INVENTORY_Y, INVENTORY_WIDTH, INVENTORY_HEIGHT
} from '../config/gameConfig'
import { TEXT_PRIMARY } from '../config/palette'

/**
 * Render the inventory section
 */
export const renderInventory = (ctx: CanvasRenderingContext2D) => {
  // Draw inventory section border - matching other sections exactly
  ctx.save()
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1
  ctx.strokeRect(INVENTORY_X, INVENTORY_Y, INVENTORY_WIDTH, INVENTORY_HEIGHT)
  
  // Draw section title - matching other sections exactly
  renderText(ctx, 'INVENTORY', INVENTORY_X + INVENTORY_WIDTH / 2, INVENTORY_Y + 30, TEXT_PRIMARY, 20)
  
  // Draw divider line - matching other sections exactly
  ctx.strokeStyle = '#444444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(INVENTORY_X + 20, INVENTORY_Y + 50)
  ctx.lineTo(INVENTORY_X + INVENTORY_WIDTH - 20, INVENTORY_Y + 50)
  ctx.stroke()
  ctx.restore()
  
  // Render coin row
  renderCoinRow(ctx)
  
  // Render diamond row (placeholder for future)
  renderDiamondRow(ctx)
}

/**
 * Render the coin row in inventory
 */
const renderCoinRow = (ctx: CanvasRenderingContext2D) => {
  const rowY = INVENTORY_Y + 70 // Below title and divider (matching other sections)
  const iconSize = 32 // Scaled down coin icon
  const iconX = INVENTORY_X + 15
  const iconY = rowY + 5
  
  // Draw coin icon
  try {
    const coinImage = getCachedImage(getImagePath('coin.png'))
    if (coinImage) {
      ctx.drawImage(
        coinImage,
        iconX, iconY, iconSize, iconSize
      )
    }
  } catch (error) {
    // Fallback: draw a simple circle if image fails
    ctx.save()
    ctx.fillStyle = '#FFD700' // Gold color
    ctx.beginPath()
    ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  
  // Draw coin count
  const coinCount = getCollectedCoinCount()
  ctx.save()
  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = '16px "Pixelify Sans", monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(coinCount.toString(), iconX + iconSize + 10, iconY + iconSize/2)
  ctx.restore()
}

/**
 * Render the diamond row in inventory
 */
const renderDiamondRow = (ctx: CanvasRenderingContext2D) => {
  const rowY = INVENTORY_Y + 110 // Below coin row
  const iconSize = 32 // Scaled down diamond icon
  const iconX = INVENTORY_X + 15
  const iconY = rowY + 5
  
  // Draw diamond icon
  try {
    const diamondImage = getCachedImage(getImagePath('diamond.png'))
    if (diamondImage) {
      ctx.drawImage(
        diamondImage,
        iconX, iconY, iconSize, iconSize
      )
    }
  } catch (error) {
    // Fallback: draw a simple diamond shape if image fails
    ctx.save()
    ctx.fillStyle = '#87CEEB' // Light blue color
    ctx.beginPath()
    const centerX = iconX + iconSize/2
    const centerY = iconY + iconSize/2
    // Draw diamond shape fallback
    ctx.moveTo(centerX, iconY) // top
    ctx.lineTo(iconX + iconSize, centerY) // right
    ctx.lineTo(centerX, iconY + iconSize) // bottom
    ctx.lineTo(iconX, centerY) // left
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  
  // Draw diamond count
  const diamondCount = getCollectedDiamondCount()
  ctx.save()
  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = '16px "Pixelify Sans", monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(diamondCount.toString(), iconX + iconSize + 10, iconY + iconSize/2)
  ctx.restore()
}
