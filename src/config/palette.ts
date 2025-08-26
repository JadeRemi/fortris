// Color Palette for Pixel Game

// Main theme colors
export const DARK_GREEN = '#2d4a3e'
export const DARK_BROWN = '#663300'
export const GREY = '#4a4a4a'

// Browns (earth tones)
export const LIGHT_BROWN = '#8b4513'
export const MEDIUM_BROWN = '#654321'
export const DARK_BROWN_ALT = '#3c1f0a'
export const TAN = '#d2b48c'

// Greens (nature)
export const FOREST_GREEN = '#228b22'
export const OLIVE_GREEN = '#556b2f'
export const DARK_OLIVE = '#333d1a'
export const MOSS_GREEN = '#4a5d23'
export const SAGE_GREEN = '#87a96b'

// Greys (stones/metals)
export const DARK_GREY = '#2f2f2f'
export const MEDIUM_GREY = '#606060'
export const LIGHT_GREY = '#808080'
export const STONE_GREY = '#696969'
export const CHARCOAL = '#36454f'

// Background/UI colors
export const BLACK = '#000000'
export const OFF_BLACK = '#1a1a1a'
export const WHITE = '#ffffff'
export const OFF_WHITE = '#f5f5f5'
export const CREAM = '#fffdd0'

// Accent colors (minimal use)
export const DARK_RED = '#8b0000'
export const RUST = '#b7410e'
export const GOLD = '#ffd700'
export const AMBER = '#ffbf00'
export const COPPER = '#b87333'

// Battlefield specific  
export const BATTLEFIELD_BORDER = '#4a3728' // Dark brown for main battlefield borders
export const BATTLEFIELD_CELL_BORDER = '#4a3728' // Dark brown for better contrast
export const BATTLEFIELD_CELL_EMPTY = '#2a2017'

// Noise background variations (much darker for better contrast)
export const NOISE_COLORS = [
  '#2a1200',       // very dark brown
  '#1f0d00',       // darker variant
  '#150900',       // darkest variant
  '#261100',       // slightly reddish dark
  '#1d0c00',       // deep brown
  '#120600',       // almost black brown
  '#231300',       // dark olive brown
  '#0f0500',       // extremely dark variant
] as const

// Grass palette for battlefield background (dark green tones)
export const GRASS_COLORS = [
  '#0d1a0f',       // very dark forest green
  '#101c12',       // dark mossy green
  '#0a1508',       // darkest green
  '#0f1b0d',       // deep forest
  '#121f15',       // dark sage
  '#081204',       // almost black green
  '#0b1609',       // dark olive green
  '#061003',       // extremely dark variant
] as const

// Text colors
export const TEXT_PRIMARY = OFF_WHITE
export const TEXT_SECONDARY = LIGHT_GREY
export const TEXT_ACCENT = GOLD

// Export all colors for easy access
export const PALETTE = {
  // Main
  DARK_GREEN,
  DARK_BROWN, 
  GREY,
  
  // Browns
  LIGHT_BROWN,
  MEDIUM_BROWN,
  DARK_BROWN_ALT,
  TAN,
  
  // Greens
  FOREST_GREEN,
  OLIVE_GREEN,
  DARK_OLIVE,
  MOSS_GREEN,
  SAGE_GREEN,
  
  // Greys
  DARK_GREY,
  MEDIUM_GREY,
  LIGHT_GREY,
  STONE_GREY,
  CHARCOAL,
  
  // Base
  BLACK,
  OFF_BLACK,
  WHITE,
  OFF_WHITE,
  CREAM,
  
  // Accents
  DARK_RED,
  RUST,
  GOLD,
  AMBER,
  COPPER,
  
  // UI
  BATTLEFIELD_BORDER,
  BATTLEFIELD_CELL_BORDER,
  BATTLEFIELD_CELL_EMPTY,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_ACCENT,
  
  // Noise Arrays
  NOISE_COLORS,
  GRASS_COLORS,
} as const
