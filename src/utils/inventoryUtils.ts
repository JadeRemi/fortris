/**
 * Inventory rendering and management utilities
 */

import { getCachedImage } from './imageUtils'
import { getCollectedCoinCount } from './coinUtils'
import { getCollectedDiamondCount } from './diamondUtils'
import { getImagePath } from './assetUtils'
import { renderText } from './fontUtils'
import { getSelectionState, drawUpgradeSelectionAnimation } from './controlsUtils'
import { showTooltip } from './tooltipUtils'
import {
  INVENTORY_X, INVENTORY_Y, INVENTORY_WIDTH, INVENTORY_HEIGHT
} from '../config/gameConfig'
import { TEXT_PRIMARY, BATTLEFIELD_CELL_EMPTY, BATTLEFIELD_CELL_BORDER } from '../config/palette'

/**
 * Render the inventory section
 */
export const renderInventory = (ctx: CanvasRenderingContext2D, mouseX: number = 0, mouseY: number = 0) => {
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
  
  // Render diamond row
  renderDiamondRow(ctx)
  
  // Handle upgrade button tooltip
  handleUpgradeButtonTooltip(mouseX, mouseY)
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
  
  // Draw upgrade button if diamonds > 0
  if (diamondCount > 0) {
    renderUpgradeButton(ctx, rowY)
  }
}

/**
 * Render upgrade button at the right edge of inventory
 */
const renderUpgradeButton = (ctx: CanvasRenderingContext2D, rowY: number) => {
  const buttonSize = 32 // Increased for better rectangular button
  const gap = 8 // Small gap from right edge
  const buttonX = INVENTORY_X + INVENTORY_WIDTH - buttonSize - gap
  const buttonY = rowY + 2 // Centered better with diamond row
  
  ctx.save()
  
  // Draw rectangular background with border-radius
  const borderRadius = 4
  ctx.fillStyle = BATTLEFIELD_CELL_EMPTY
  ctx.strokeStyle = BATTLEFIELD_CELL_BORDER
  ctx.lineWidth = 2
  
  // Draw rounded rectangle background
  ctx.beginPath()
  ctx.moveTo(buttonX + borderRadius, buttonY)
  ctx.arcTo(buttonX + buttonSize, buttonY, buttonX + buttonSize, buttonY + buttonSize, borderRadius)
  ctx.arcTo(buttonX + buttonSize, buttonY + buttonSize, buttonX, buttonY + buttonSize, borderRadius)
  ctx.arcTo(buttonX, buttonY + buttonSize, buttonX, buttonY, borderRadius)
  ctx.arcTo(buttonX, buttonY, buttonX + buttonSize, buttonY, borderRadius)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  // Draw spinning selection animation if upgrade is selected (same as army units)
  const selectionState = getSelectionState()
  if (selectionState.isUpgradeSelected) {
    drawUpgradeSelectionAnimation(ctx, buttonX, buttonY, buttonSize)
  }
  
  // Draw upgrade icon (smaller to fit in button)
  const iconSize = 18 // Smaller icon to fit in rectangular button
  const iconX = buttonX + (buttonSize - iconSize) / 2
  const iconY = buttonY + (buttonSize - iconSize) / 2
  
  try {
    const upgradeImage = getCachedImage(getImagePath('upgrade.png'))
    if (upgradeImage) {
      ctx.drawImage(
        upgradeImage,
        iconX, iconY, iconSize, iconSize
      )
    }
  } catch (error) {
    // Fallback: draw a simple arrow up shape if image fails
    ctx.fillStyle = '#FFD700' // Gold color
    ctx.beginPath()
    // Draw simple up arrow
    const centerX = iconX + iconSize/2
    const centerY = iconY + iconSize/2
    ctx.moveTo(centerX, iconY + 2) // top point
    ctx.lineTo(iconX + 2, centerY) // left point
    ctx.lineTo(iconX + 6, centerY) // left base
    ctx.lineTo(iconX + 6, iconY + iconSize - 2) // left bottom
    ctx.lineTo(iconX + iconSize - 6, iconY + iconSize - 2) // right bottom
    ctx.lineTo(iconX + iconSize - 6, centerY) // right base
    ctx.lineTo(iconX + iconSize - 2, centerY) // right point
    ctx.closePath()
    ctx.fill()
  }
  
  ctx.restore()
}

/**
 * Check if a point is inside the upgrade button
 */
export const isPointInUpgradeButton = (x: number, y: number): boolean => {
  const diamondCount = getCollectedDiamondCount()
  if (diamondCount <= 0) {
    return false // Button is not visible
  }
  
  const rowY = INVENTORY_Y + 110 // Same as diamond row
  const buttonSize = 32 // Increased from 24 for better rectangular button
  const gap = 8
  const buttonX = INVENTORY_X + INVENTORY_WIDTH - buttonSize - gap
  const buttonY = rowY + 2 // Centered better with diamond row
  
  return x >= buttonX && x <= buttonX + buttonSize &&
         y >= buttonY && y <= buttonY + buttonSize
}

/**
 * Handle upgrade button tooltip - shows tooltip when hovering and no selection is active
 */
const handleUpgradeButtonTooltip = (mouseX: number, mouseY: number) => {
  const selectionState = getSelectionState()
  
  // Only show tooltip if no unit is selected and not already upgrading
  if (selectionState.isUnitSelected || selectionState.isUpgradeSelected) {
    // Don't hide tooltip here - let army tooltips handle it
    return
  }
  
  // Check if hovering over upgrade button
  if (isPointInUpgradeButton(mouseX, mouseY)) {
    const rowY = INVENTORY_Y + 110 // Same as diamond row
    const buttonSize = 32
    const gap = 8
    const buttonX = INVENTORY_X + INVENTORY_WIDTH - buttonSize - gap
    const buttonY = rowY + 2
    
    const centerX = buttonX + buttonSize / 2
    const centerY = buttonY + buttonSize / 2
    showTooltip('Upgrade unit', centerX, centerY)
    return
  }
  
  // If not hovering over upgrade button, don't hide tooltip here
  // Let the army tooltip system handle hiding when needed
}
