// Walls type definitions (formerly Interactive Zones)

export type WallType = 'left' | 'right' | 'bottom'

export interface WallCell {
  wallType: WallType
  index: number // Position within the wall
  isOccupied: boolean
  occupiedBy?: string // Unit type ID (e.g., 'swordsman')
  unitUuid?: string // UUID of the unit placed here
  currentHealth?: number // Current health of the unit placed here
  maxHealth?: number // Maximum health of the unit for reference
  // Add more cell properties as needed for game logic
}

export interface Walls {
  left: WallCell[]
  right: WallCell[]
  bottom: WallCell[]
}

export interface WallPosition {
  wallType: WallType
  index: number
}
