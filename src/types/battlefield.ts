// Battlefield type definitions

export interface Position {
  row: number
  col: number
}

export interface CanvasPosition {
  x: number
  y: number
}

export type CellState = 'empty' | 'occupied'

export interface BattlefieldCell {
  state: CellState
  // Add more cell properties as needed for game logic
}

export type Battlefield = BattlefieldCell[][]
