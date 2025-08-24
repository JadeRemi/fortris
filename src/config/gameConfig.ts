// Game Configuration Constants

// Canvas settings
export const CANVAS_WIDTH = 1920
export const CANVAS_HEIGHT = 1080

// Game loop settings
export const TARGET_FPS = 60
export const TICK_RATE = 1000 / TARGET_FPS // ~16.67ms per frame

// Level dimensions
export const LEVEL_WIDTH = 12  // Main battlefield width in cells
export const LEVEL_HEIGHT = 12 // Main battlefield height in cells

// Battlefield settings
export const BATTLEFIELD_ROWS = LEVEL_HEIGHT
export const BATTLEFIELD_COLS = LEVEL_WIDTH
export const BATTLEFIELD_CELL_SIZE = 56
export const BATTLEFIELD_BORDER_WIDTH = 4
export const BATTLEFIELD_CELL_BORDER_WIDTH = 1

// Walls settings (formerly interactive zones)
export const WALL_CELL_SIZE = BATTLEFIELD_CELL_SIZE
export const WALL_GAP = 20 // Gap between battlefield and walls
export const WALL_BORDER_WIDTH = 2

// UI sections settings
export const CONTROLS_WIDTH = 200 // Width of controls section on right side
export const CONTROLS_MARGIN = 30 // Gap between controls and canvas edge
export const ARMY_WIDTH = 200 // Width of army section on left side (symmetrical)
export const ARMY_MARGIN = 30 // Gap between army section and canvas edge

// Calculated battlefield dimensions
export const BATTLEFIELD_TOTAL_WIDTH = 
  BATTLEFIELD_COLS * BATTLEFIELD_CELL_SIZE + 
  (BATTLEFIELD_COLS - 1) * BATTLEFIELD_CELL_BORDER_WIDTH + 
  BATTLEFIELD_BORDER_WIDTH * 2

export const BATTLEFIELD_TOTAL_HEIGHT = 
  BATTLEFIELD_ROWS * BATTLEFIELD_CELL_SIZE + 
  (BATTLEFIELD_ROWS - 1) * BATTLEFIELD_CELL_BORDER_WIDTH + 
  BATTLEFIELD_BORDER_WIDTH * 2

// Wall dimensions
export const LEFT_WALL_WIDTH = WALL_CELL_SIZE + WALL_BORDER_WIDTH * 2
export const LEFT_WALL_HEIGHT = BATTLEFIELD_TOTAL_HEIGHT
export const RIGHT_WALL_WIDTH = LEFT_WALL_WIDTH
export const RIGHT_WALL_HEIGHT = LEFT_WALL_HEIGHT
export const BOTTOM_WALL_WIDTH = BATTLEFIELD_TOTAL_WIDTH
export const BOTTOM_WALL_HEIGHT = WALL_CELL_SIZE + WALL_BORDER_WIDTH * 2

// Total game area width (battlefield + walls only)
export const TOTAL_GAME_WIDTH = LEFT_WALL_WIDTH + WALL_GAP + BATTLEFIELD_TOTAL_WIDTH + WALL_GAP + RIGHT_WALL_WIDTH

// Positioning (centered - battlefield and walls)
export const GAME_AREA_START_X = (CANVAS_WIDTH - TOTAL_GAME_WIDTH) / 2
export const BATTLEFIELD_X = GAME_AREA_START_X + LEFT_WALL_WIDTH + WALL_GAP
export const BATTLEFIELD_Y = (CANVAS_HEIGHT - BATTLEFIELD_TOTAL_HEIGHT - BOTTOM_WALL_HEIGHT - WALL_GAP) / 2

// Wall positioning
export const LEFT_WALL_X = GAME_AREA_START_X
export const LEFT_WALL_Y = BATTLEFIELD_Y
export const RIGHT_WALL_X = BATTLEFIELD_X + BATTLEFIELD_TOTAL_WIDTH + WALL_GAP
export const RIGHT_WALL_Y = BATTLEFIELD_Y
export const BOTTOM_WALL_X = BATTLEFIELD_X
export const BOTTOM_WALL_Y = BATTLEFIELD_Y + BATTLEFIELD_TOTAL_HEIGHT + WALL_GAP

// UI sections positioning
export const ARMY_X = ARMY_MARGIN // Army section from left edge
export const ARMY_Y = BATTLEFIELD_Y
export const CONTROLS_X = CANVAS_WIDTH - CONTROLS_WIDTH - CONTROLS_MARGIN // Controls section from right edge
export const CONTROLS_Y = BATTLEFIELD_Y

// Army unit cell settings
export const ARMY_UNIT_CELL_SIZE = BATTLEFIELD_CELL_SIZE // Same size as battlefield cells
export const ARMY_UNIT_CELL_X = ARMY_X + 30 // Positioned within army section
export const ARMY_UNIT_CELL_Y = ARMY_Y + 80 // Below the army title

// Font settings
export const GAME_FONT_FAMILY = 'Pixelify Sans'
export const GAME_FONT_SIZE = 24

// Noise background settings
export const NOISE_DENSITY = 0.15 // 15% noise coverage
export const NOISE_PIXEL_SIZE = 4
