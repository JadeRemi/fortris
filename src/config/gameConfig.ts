// Game Configuration Constants

// Canvas settings
export const CANVAS_WIDTH = 1920
export const CANVAS_HEIGHT = 1080

// Game loop settings
export const TARGET_FPS = 60
export const TICK_RATE = 1000 / TARGET_FPS // ~16.67ms per frame

// Level dimensions
export const LEVEL_WIDTH = 12  // Main battlefield width in cells
export const LEVEL_HEIGHT = 12 // Main battlefield height in cells (visible)
export const LEVEL_NEGATIVE_ROWS = 4 // Number of negative rows above battlefield (for enemy spawning) - supports up to 5x5 enemies

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
export const LOGS_WIDTH = 200 // Width of logs section (same as controls)
export const LOGS_MARGIN = 20 // Gap between logs and controls section
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
export const LOGS_X = CONTROLS_X - LOGS_WIDTH - LOGS_MARGIN // Logs section between right wall and controls  
export const LOGS_Y = BATTLEFIELD_Y // Same height as other sections for consistency

// Army unit cell settings
export const ARMY_UNIT_CELL_SIZE = BATTLEFIELD_CELL_SIZE // Same size as battlefield cells
export const ARMY_UNIT_CELL_SPACING = 20 // Space between unit cells

// Swordsman cell positioning
export const SWORDSMAN_CELL_X = ARMY_X + 30 // Positioned within army section
export const SWORDSMAN_CELL_Y = ARMY_Y + 80 // Below the army title

// Bowman cell positioning (below swordsman)
export const BOWMAN_CELL_X = ARMY_X + 30 // Same X as swordsman
export const BOWMAN_CELL_Y = SWORDSMAN_CELL_Y + ARMY_UNIT_CELL_SIZE + ARMY_UNIT_CELL_SPACING

// Monk cell positioning (below bowman)
export const MONK_CELL_X = ARMY_X + 30 // Same X as others
export const MONK_CELL_Y = BOWMAN_CELL_Y + ARMY_UNIT_CELL_SIZE + ARMY_UNIT_CELL_SPACING

// Font settings
export const GAME_FONT_FAMILY = 'Pixelify Sans'
export const GAME_FONT_SIZE = 24

// Noise background settings
export const NOISE_DENSITY = 0.15 // 15% noise coverage
export const NOISE_PIXEL_SIZE = 4

// Unit configuration
export const INITIAL_SWORDSMAN_COUNT = 10
export const INITIAL_BOWMAN_COUNT = 10
export const INITIAL_MONK_COUNT = 10

// Combat system configuration
export const TURN_COOLDOWN_MS = 500 // 0.5 seconds between turns
export const UNIT_ACTION_DELAY_MS = 100 // 0.1 seconds between unit actions
export const ATTACK_ANIMATION_DURATION_MS = 1000 // 1 second golden border animation
export const HIT_ANIMATION_DURATION_MS = 800 // 0.8 seconds red hit animation (faster)
export const PROJECTILE_LIFESPAN_MS = 5000 // 5 seconds arrow lifespan
export const PROJECTILE_SPEED = 400 // pixels per second (2x faster)
export const PROJECTILE_SIZE_RATIO = 1/3 // 1/3 of cell size

// Healing configuration
export const MONK_HEALING_AMOUNT = 2 // Amount of health monks restore per heal

// Enemy spawn configuration - independent spawn system
export const MIN_ENEMY_SPAWNS_PER_TURN = 0 // Minimum enemies that can spawn per turn
export const MAX_ENEMY_SPAWNS_PER_TURN = 3 // Maximum enemies that can spawn per turn

export const ENEMY_HEALTH = 10 // Health for all enemies (for now)
export const LICH_SPAWN_CHANCE = 0.1 // 10% chance for Lich to spawn skeleton when obstructed

// Coin collection configuration
export const COIN_GRACE_PERIOD_MS = 1000 // 1 second grace period before coins start moving

// Roman numerals for unit tiers (Unicode symbols)
export const ROMAN_NUMERALS: Record<number, string> = {
  1: 'Ⅰ',   // U+2160
  2: 'Ⅱ',   // U+2161
  3: 'Ⅲ',   // U+2162
  4: 'Ⅳ',   // U+2163
  5: 'Ⅴ',   // U+2164
  6: 'Ⅵ',   // U+2165
  7: 'Ⅶ',   // U+2166
  8: 'Ⅷ',   // U+2167
  9: 'Ⅸ',   // U+2168
  10: 'Ⅹ'   // U+2169
}

// UI Font sizes
export const UI_FONT_SIZE_HEALTH = 16 // Font size for health numbers
export const UI_FONT_SIZE_TIER = 16 // Font size for tier indicators (same as health)
export const UI_FONT_SIZE_STATS = 18 // Font size for top-left stats (FPS, turns, etc.) - 2px larger than before

// Army UI configuration
export const ARMY_BUY_BUTTON_GAP = 20 // Gap between army unit cell and buy button (doubled from 10px)

// Inventory section configuration
export const INVENTORY_X = ARMY_X + ARMY_WIDTH + 20 // Position to the right of ARMY with same gap as between Controls and Logs
export const INVENTORY_Y = ARMY_Y // Same Y position as ARMY
export const INVENTORY_WIDTH = ARMY_WIDTH // Same width as ARMY
export const INVENTORY_HEIGHT = 400 // Same height as ARMY (400px)
