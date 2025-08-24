// Units Configuration
import { getImagePath } from '../utils/assetUtils'

export interface UnitType {
  id: string
  name: string
  width: number  // Width in cells
  height: number // Height in cells
  imagePath: string
  assetWidth: number  // Asset width in pixels
  assetHeight: number // Asset height in pixels
  maxHealth: number  // Maximum health points
  description?: string
}

// Ally units only - enemies are defined in enemiesConfig.ts
export const UNIT_TYPES: Record<string, UnitType> = {
  SWORDSMAN: {
    id: 'swordsman',
    name: 'Swordsman',
    width: 1,
    height: 1,
    imagePath: getImagePath('swordsman.png'),
    assetWidth: 128,
    assetHeight: 128,
    maxHealth: 10,
    description: 'Small melee unit - takes 1x1 cell'
  },
  BOWMAN: {
    id: 'bowman',
    name: 'Bowman',
    width: 1,
    height: 1,
    imagePath: getImagePath('bowman.png'),
    assetWidth: 128,
    assetHeight: 128,
    maxHealth: 10,
    description: 'Small ranged unit - takes 1x1 cell'
  }
} as const

// Unit size categories
export const UNIT_SIZE_CATEGORIES = {
  SMALL: { maxWidth: 1, maxHeight: 1 },
  MEDIUM: { maxWidth: 2, maxHeight: 2 },
  LARGE: { maxWidth: 4, maxHeight: 4 }
} as const

// Helper functions
export const getUnitById = (id: string): UnitType | undefined => {
  return Object.values(UNIT_TYPES).find(unit => unit.id === id)
}

export const getUnitByName = (name: string): UnitType | undefined => {
  return Object.values(UNIT_TYPES).find(unit => unit.name === name)
}

export const getUnitSizeCategory = (unit: UnitType): keyof typeof UNIT_SIZE_CATEGORIES => {
  const { width, height } = unit
  
  if (width <= UNIT_SIZE_CATEGORIES.SMALL.maxWidth && height <= UNIT_SIZE_CATEGORIES.SMALL.maxHeight) {
    return 'SMALL'
  }
  
  if (width <= UNIT_SIZE_CATEGORIES.MEDIUM.maxWidth && height <= UNIT_SIZE_CATEGORIES.MEDIUM.maxHeight) {
    return 'MEDIUM'
  }
  
  return 'LARGE'
}

export const isValidUnitPlacement = (unit: UnitType, row: number, col: number, fieldRows: number, fieldCols: number): boolean => {
  return (
    row >= 0 &&
    col >= 0 &&
    row + unit.height <= fieldRows &&
    col + unit.width <= fieldCols
  )
}
