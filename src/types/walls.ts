// Walls type definitions (formerly Interactive Zones)

export type WallType = 'left' | 'right' | 'bottom'

export interface WallCell {
  wallType: WallType
  index: number // Position within the wall
  isOccupied: boolean
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
