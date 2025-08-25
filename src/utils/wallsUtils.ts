import {
  LEVEL_HEIGHT,
  LEVEL_WIDTH,
  WALL_CELL_SIZE,
  WALL_BORDER_WIDTH,
  LEFT_WALL_X,
  LEFT_WALL_Y,
  LEFT_WALL_WIDTH,
  LEFT_WALL_HEIGHT,
  RIGHT_WALL_X,
  RIGHT_WALL_Y,
  RIGHT_WALL_WIDTH,
  RIGHT_WALL_HEIGHT,
  BOTTOM_WALL_X,
  BOTTOM_WALL_Y,
  BOTTOM_WALL_WIDTH,
  BOTTOM_WALL_HEIGHT
} from '../config/gameConfig'
import {
  BATTLEFIELD_BORDER,
  BATTLEFIELD_CELL_BORDER,
  BATTLEFIELD_CELL_EMPTY
} from '../config/palette'
import { getSelectionState } from './controlsUtils'
import { isWallCellOccupied } from './wallExtensions'

// Hover state for wall cells
interface WallCellHover {
  wall: 'left' | 'right' | 'bottom'
  cellIndex: number
  isHovered: boolean
  pulsateStartTime: number // When pulsating started
}

let wallHoverStates: WallCellHover[] = []

/**
 * Draw a rounded rectangle (stroke only)
 */
const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

/**
 * Render the left wall
 */
export const renderLeftWall = (ctx: CanvasRenderingContext2D) => {
  // Draw outer border
  ctx.fillStyle = BATTLEFIELD_BORDER
  ctx.fillRect(LEFT_WALL_X, LEFT_WALL_Y, LEFT_WALL_WIDTH, LEFT_WALL_HEIGHT)
  
  // Fill with battlefield background
  ctx.fillStyle = BATTLEFIELD_CELL_EMPTY
  ctx.fillRect(LEFT_WALL_X + WALL_BORDER_WIDTH, LEFT_WALL_Y + WALL_BORDER_WIDTH, 
               LEFT_WALL_WIDTH - WALL_BORDER_WIDTH * 2, LEFT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2)
  
  // Draw individual cells
  const cellSpacing = (LEFT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
  for (let i = 0; i < LEVEL_HEIGHT; i++) {
    const cellY = LEFT_WALL_Y + WALL_BORDER_WIDTH + i * (WALL_CELL_SIZE + cellSpacing)
    const cellX = LEFT_WALL_X + WALL_BORDER_WIDTH
    
    // Check for hover state
    const hoverState = wallHoverStates.find(h => h.wall === 'left' && h.cellIndex === i)
    let borderColor = BATTLEFIELD_CELL_BORDER
    let lineWidth = 1
    
    if (hoverState?.isHovered) {
      // Calculate pulsating effect - seamless loop starting from brightest and darkening
      const currentTime = Date.now()
      const elapsedTime = (currentTime - hoverState.pulsateStartTime) % 2000 // 2 second cycle
      const rawProgress = elapsedTime / 2000
      
      // Create seamless sine wave oscillation starting from bright then going to dim
      const pulsateProgress = (Math.sin(rawProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2
      
      // Interpolate between bright and dim green (100% to 40% intensity) - starts bright!
      const intensity = 1.0 - (pulsateProgress * 0.6) // 100% to 40% intensity (starts bright, gets dim)
      const r = Math.floor(76 * intensity)  // #4CAF50 red component
      const g = Math.floor(175 * intensity) // #4CAF50 green component  
      const b = Math.floor(80 * intensity)  // #4CAF50 blue component
      
      borderColor = `rgb(${r}, ${g}, ${b})`
      lineWidth = 3
    }
    
    // Draw cell border (thicker when hovered, with small border-radius when hovered)
    ctx.strokeStyle = borderColor
    ctx.lineWidth = lineWidth
    
    if (hoverState?.isHovered) {
      // Draw rounded rectangle for hover state
      drawRoundedRect(ctx, cellX, cellY, WALL_CELL_SIZE, WALL_CELL_SIZE, 3) // 3px radius
      ctx.stroke()
    } else {
      // Draw sharp rectangle for normal state
      ctx.strokeRect(cellX, cellY, WALL_CELL_SIZE, WALL_CELL_SIZE)
    }
    
    // Glint animation removed - only pulsating border remains
  }
}

/**
 * Render the right wall
 */
export const renderRightWall = (ctx: CanvasRenderingContext2D) => {
  // Draw outer border
  ctx.fillStyle = BATTLEFIELD_BORDER
  ctx.fillRect(RIGHT_WALL_X, RIGHT_WALL_Y, RIGHT_WALL_WIDTH, RIGHT_WALL_HEIGHT)
  
  // Fill with battlefield background
  ctx.fillStyle = BATTLEFIELD_CELL_EMPTY
  ctx.fillRect(RIGHT_WALL_X + WALL_BORDER_WIDTH, RIGHT_WALL_Y + WALL_BORDER_WIDTH,
               RIGHT_WALL_WIDTH - WALL_BORDER_WIDTH * 2, RIGHT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2)
  
  // Draw individual cells
  const cellSpacing = (RIGHT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
  for (let i = 0; i < LEVEL_HEIGHT; i++) {
    const cellY = RIGHT_WALL_Y + WALL_BORDER_WIDTH + i * (WALL_CELL_SIZE + cellSpacing)
    const cellX = RIGHT_WALL_X + WALL_BORDER_WIDTH
    
    // Check for hover state
    const hoverState = wallHoverStates.find(h => h.wall === 'right' && h.cellIndex === i)
    let borderColor = BATTLEFIELD_CELL_BORDER
    let lineWidth = 1
    
    if (hoverState?.isHovered) {
      // Calculate pulsating effect - seamless loop starting from brightest and darkening
      const currentTime = Date.now()
      const elapsedTime = (currentTime - hoverState.pulsateStartTime) % 2000 // 2 second cycle
      const rawProgress = elapsedTime / 2000
      
      // Create seamless sine wave oscillation starting from bright then going to dim
      const pulsateProgress = (Math.sin(rawProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2
      
      // Interpolate between bright and dim green (100% to 40% intensity) - starts bright!
      const intensity = 1.0 - (pulsateProgress * 0.6) // 100% to 40% intensity (starts bright, gets dim)
      const r = Math.floor(76 * intensity)  // #4CAF50 red component
      const g = Math.floor(175 * intensity) // #4CAF50 green component  
      const b = Math.floor(80 * intensity)  // #4CAF50 blue component
      
      borderColor = `rgb(${r}, ${g}, ${b})`
      lineWidth = 3
    }
    
    // Draw cell border (thicker when hovered, with small border-radius when hovered)
    ctx.strokeStyle = borderColor
    ctx.lineWidth = lineWidth
    
    if (hoverState?.isHovered) {
      // Draw rounded rectangle for hover state
      drawRoundedRect(ctx, cellX, cellY, WALL_CELL_SIZE, WALL_CELL_SIZE, 3) // 3px radius
      ctx.stroke()
    } else {
      // Draw sharp rectangle for normal state
      ctx.strokeRect(cellX, cellY, WALL_CELL_SIZE, WALL_CELL_SIZE)
    }
    
    // Glint animation removed - only pulsating border remains
  }
}

/**
 * Render the bottom wall
 */
export const renderBottomWall = (ctx: CanvasRenderingContext2D) => {
  // Draw outer border
  ctx.fillStyle = BATTLEFIELD_BORDER
  ctx.fillRect(BOTTOM_WALL_X, BOTTOM_WALL_Y, BOTTOM_WALL_WIDTH, BOTTOM_WALL_HEIGHT)
  
  // Fill with battlefield background
  ctx.fillStyle = BATTLEFIELD_CELL_EMPTY
  ctx.fillRect(BOTTOM_WALL_X + WALL_BORDER_WIDTH, BOTTOM_WALL_Y + WALL_BORDER_WIDTH,
               BOTTOM_WALL_WIDTH - WALL_BORDER_WIDTH * 2, BOTTOM_WALL_HEIGHT - WALL_BORDER_WIDTH * 2)
  
  // Draw individual cells (same number as battlefield columns)
  const cellsCount = LEVEL_WIDTH
  const cellSpacing = (BOTTOM_WALL_WIDTH - WALL_BORDER_WIDTH * 2 - cellsCount * WALL_CELL_SIZE) / (cellsCount - 1)
  
  for (let i = 0; i < cellsCount; i++) {
    const cellX = BOTTOM_WALL_X + WALL_BORDER_WIDTH + i * (WALL_CELL_SIZE + cellSpacing)
    const cellY = BOTTOM_WALL_Y + WALL_BORDER_WIDTH
    
    // Check for hover state
    const hoverState = wallHoverStates.find(h => h.wall === 'bottom' && h.cellIndex === i)
    let borderColor = BATTLEFIELD_CELL_BORDER
    let lineWidth = 1
    
    if (hoverState?.isHovered) {
      // Calculate pulsating effect - seamless loop starting from brightest and darkening
      const currentTime = Date.now()
      const elapsedTime = (currentTime - hoverState.pulsateStartTime) % 2000 // 2 second cycle
      const rawProgress = elapsedTime / 2000
      
      // Create seamless sine wave oscillation starting from bright then going to dim
      const pulsateProgress = (Math.sin(rawProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2
      
      // Interpolate between bright and dim green (100% to 40% intensity) - starts bright!
      const intensity = 1.0 - (pulsateProgress * 0.6) // 100% to 40% intensity (starts bright, gets dim)
      const r = Math.floor(76 * intensity)  // #4CAF50 red component
      const g = Math.floor(175 * intensity) // #4CAF50 green component  
      const b = Math.floor(80 * intensity)  // #4CAF50 blue component
      
      borderColor = `rgb(${r}, ${g}, ${b})`
      lineWidth = 3
    }
    
    // Draw cell border (thicker when hovered, with small border-radius when hovered)
    ctx.strokeStyle = borderColor
    ctx.lineWidth = lineWidth
    
    if (hoverState?.isHovered) {
      // Draw rounded rectangle for hover state
      drawRoundedRect(ctx, cellX, cellY, WALL_CELL_SIZE, WALL_CELL_SIZE, 3) // 3px radius
      ctx.stroke()
    } else {
      // Draw sharp rectangle for normal state
      ctx.strokeRect(cellX, cellY, WALL_CELL_SIZE, WALL_CELL_SIZE)
    }
    
    // Glint animation removed - only pulsating border remains
  }
}

// Glint animation function removed - was causing performance issues

/**
 * Render all walls
 */
export const renderWalls = (ctx: CanvasRenderingContext2D) => {
  renderLeftWall(ctx)
  renderRightWall(ctx)
  renderBottomWall(ctx)
}

/**
 * Handle wall cell hover - shows effects when unit is selected (unoccupied cells) or upgrade is selected (occupied cells)
 */
export const handleWallHover = (x: number, y: number, _renderCallback: () => void) => {
  
  // Clear all current hover states
  wallHoverStates.forEach(state => state.isHovered = false)
  
  // Show hover effects when a unit is selected from ARMY or when upgrade is selected
  const selectionState = getSelectionState()
  if (!selectionState.isUnitSelected && !selectionState.isUpgradeSelected) {
    return
  }
  
  // Check left wall
  if (isInLeftWall(x, y)) {
    const cellIndex = getLeftWallCellIndex(x, y)
    if (cellIndex !== -1) {
      // Show hover effect based on selection type:
      // - Unit selected: only unoccupied cells
      // - Upgrade selected: only occupied cells
      const isOccupied = isWallCellOccupied('left', cellIndex)
      const shouldShowHover = selectionState.isUnitSelected ? !isOccupied : isOccupied
      if (shouldShowHover) {
        let hoverState = wallHoverStates.find(h => h.wall === 'left' && h.cellIndex === cellIndex)
        if (!hoverState) {
          hoverState = { 
            wall: 'left', 
            cellIndex, 
            isHovered: true, 
            pulsateStartTime: Date.now()
          }
          wallHoverStates.push(hoverState)
          // Glint and pulsate animations now handled in main render loop
        } else if (!hoverState.isHovered) {
          // Only start animation if this is a new hover (wasn't hovered before)
          hoverState.isHovered = true
          hoverState.pulsateStartTime = Date.now()
          // Pulsate animation handled in main render loop
        } else {
          hoverState.isHovered = true
        }
      }
    }
  }
  
  // Check right wall
  if (isInRightWall(x, y)) {
    const cellIndex = getRightWallCellIndex(x, y)
    if (cellIndex !== -1) {
      // Show hover effect based on selection type:
      // - Unit selected: only unoccupied cells
      // - Upgrade selected: only occupied cells
      const isOccupied = isWallCellOccupied('right', cellIndex)
      const shouldShowHover = selectionState.isUnitSelected ? !isOccupied : isOccupied
      if (shouldShowHover) {
        let hoverState = wallHoverStates.find(h => h.wall === 'right' && h.cellIndex === cellIndex)
        if (!hoverState) {
          hoverState = { 
            wall: 'right', 
            cellIndex, 
            isHovered: true, 
            pulsateStartTime: Date.now()
          }
          wallHoverStates.push(hoverState)
          // Glint and pulsate animations now handled in main render loop
        } else if (!hoverState.isHovered) {
          // Only start animation if this is a new hover (wasn't hovered before)
          hoverState.isHovered = true
          hoverState.pulsateStartTime = Date.now()
          // Pulsate animation handled in main render loop
        } else {
          hoverState.isHovered = true
        }
      }
    }
  }
  
  // Check bottom wall
  if (isInBottomWall(x, y)) {
    const cellIndex = getBottomWallCellIndex(x, y)
    if (cellIndex !== -1) {
      // Show hover effect based on selection type:
      // - Unit selected: only unoccupied cells
      // - Upgrade selected: only occupied cells
      const isOccupied = isWallCellOccupied('bottom', cellIndex)
      const shouldShowHover = selectionState.isUnitSelected ? !isOccupied : isOccupied
      if (shouldShowHover) {
        let hoverState = wallHoverStates.find(h => h.wall === 'bottom' && h.cellIndex === cellIndex)
        if (!hoverState) {
          hoverState = { 
            wall: 'bottom', 
            cellIndex, 
            isHovered: true, 
            pulsateStartTime: Date.now()
          }
          wallHoverStates.push(hoverState)
          // Glint and pulsate animations now handled in main render loop
        } else if (!hoverState.isHovered) {
          // Only start animation if this is a new hover (wasn't hovered before)
          hoverState.isHovered = true
          hoverState.pulsateStartTime = Date.now()
          // Pulsate animation handled in main render loop
        } else {
          hoverState.isHovered = true
        }
      }
    }
  }
  
  // Hover state updated - main render loop will handle animation updates
}

// Animation functions removed - all animations now handled by main render loop
// Glint and pulsate effects are calculated during normal rendering cycle

/**
 * Check if coordinates are within left wall
 */
export const isInLeftWall = (x: number, y: number): boolean => {
  return x >= LEFT_WALL_X && 
         x <= LEFT_WALL_X + LEFT_WALL_WIDTH &&
         y >= LEFT_WALL_Y && 
         y <= LEFT_WALL_Y + LEFT_WALL_HEIGHT
}

/**
 * Check if coordinates are within right wall
 */
export const isInRightWall = (x: number, y: number): boolean => {
  return x >= RIGHT_WALL_X && 
         x <= RIGHT_WALL_X + RIGHT_WALL_WIDTH &&
         y >= RIGHT_WALL_Y && 
         y <= RIGHT_WALL_Y + RIGHT_WALL_HEIGHT
}

/**
 * Check if coordinates are within bottom wall
 */
export const isInBottomWall = (x: number, y: number): boolean => {
  return x >= BOTTOM_WALL_X && 
         x <= BOTTOM_WALL_X + BOTTOM_WALL_WIDTH &&
         y >= BOTTOM_WALL_Y && 
         y <= BOTTOM_WALL_Y + BOTTOM_WALL_HEIGHT
}

/**
 * Check if coordinates are within any wall
 */
export const isInWall = (x: number, y: number): boolean => {
  return isInLeftWall(x, y) || isInRightWall(x, y) || isInBottomWall(x, y)
}

/**
 * Get cell index for left wall
 */
const getLeftWallCellIndex = (x: number, y: number): number => {
  if (!isInLeftWall(x, y)) return -1
  
  // Check if within the cell area (excluding outer border)
  const cellAreaStartX = LEFT_WALL_X + WALL_BORDER_WIDTH
  const cellAreaStartY = LEFT_WALL_Y + WALL_BORDER_WIDTH
  const cellAreaEndX = LEFT_WALL_X + LEFT_WALL_WIDTH - WALL_BORDER_WIDTH
  const cellAreaEndY = LEFT_WALL_Y + LEFT_WALL_HEIGHT - WALL_BORDER_WIDTH
  
  if (x < cellAreaStartX || x > cellAreaEndX || y < cellAreaStartY || y > cellAreaEndY) {
    return -1
  }
  
  const cellSpacing = (LEFT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
  const relativeY = y - cellAreaStartY
  
  // Find which cell this Y coordinate is in
  for (let i = 0; i < LEVEL_HEIGHT; i++) {
    const cellY = i * (WALL_CELL_SIZE + cellSpacing)
    if (relativeY >= cellY && relativeY <= cellY + WALL_CELL_SIZE) {
      return i
    }
  }
  
  return -1
}

/**
 * Get cell index for right wall
 */
const getRightWallCellIndex = (x: number, y: number): number => {
  if (!isInRightWall(x, y)) return -1
  
  // Check if within the cell area (excluding outer border)
  const cellAreaStartX = RIGHT_WALL_X + WALL_BORDER_WIDTH
  const cellAreaStartY = RIGHT_WALL_Y + WALL_BORDER_WIDTH
  const cellAreaEndX = RIGHT_WALL_X + RIGHT_WALL_WIDTH - WALL_BORDER_WIDTH
  const cellAreaEndY = RIGHT_WALL_Y + RIGHT_WALL_HEIGHT - WALL_BORDER_WIDTH
  
  if (x < cellAreaStartX || x > cellAreaEndX || y < cellAreaStartY || y > cellAreaEndY) {
    return -1
  }
  
  const cellSpacing = (RIGHT_WALL_HEIGHT - WALL_BORDER_WIDTH * 2 - LEVEL_HEIGHT * WALL_CELL_SIZE) / (LEVEL_HEIGHT - 1)
  const relativeY = y - cellAreaStartY
  
  // Find which cell this Y coordinate is in
  for (let i = 0; i < LEVEL_HEIGHT; i++) {
    const cellY = i * (WALL_CELL_SIZE + cellSpacing)
    if (relativeY >= cellY && relativeY <= cellY + WALL_CELL_SIZE) {
      return i
    }
  }
  
  return -1
}

/**
 * Get cell index for bottom wall
 */
const getBottomWallCellIndex = (x: number, y: number): number => {
  if (!isInBottomWall(x, y)) return -1
  
  // Check if within the cell area (excluding outer border)
  const cellAreaStartX = BOTTOM_WALL_X + WALL_BORDER_WIDTH
  const cellAreaStartY = BOTTOM_WALL_Y + WALL_BORDER_WIDTH
  const cellAreaEndX = BOTTOM_WALL_X + BOTTOM_WALL_WIDTH - WALL_BORDER_WIDTH
  const cellAreaEndY = BOTTOM_WALL_Y + BOTTOM_WALL_HEIGHT - WALL_BORDER_WIDTH
  
  if (x < cellAreaStartX || x > cellAreaEndX || y < cellAreaStartY || y > cellAreaEndY) {
    return -1
  }
  
  const cellSpacing = (BOTTOM_WALL_WIDTH - WALL_BORDER_WIDTH * 2 - LEVEL_WIDTH * WALL_CELL_SIZE) / (LEVEL_WIDTH - 1)
  const relativeX = x - cellAreaStartX
  
  // Find which cell this X coordinate is in
  for (let i = 0; i < LEVEL_WIDTH; i++) {
    const cellX = i * (WALL_CELL_SIZE + cellSpacing)
    if (relativeX >= cellX && relativeX <= cellX + WALL_CELL_SIZE) {
      return i
    }
  }
  
  return -1
}
