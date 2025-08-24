// Units Configuration

export interface UnitType {
  id: string
  name: string
  width: number  // Width in cells
  height: number // Height in cells
  imagePath: string
  description?: string
}

export const UNIT_TYPES: Record<string, UnitType> = {
  SWORDSMAN: {
    id: 'swordsman',
    name: 'Swordsman',
    width: 1,
    height: 1,
    imagePath: '/src/assets/images/swordsman.png',
    description: 'Small melee unit - takes 1x1 cell'
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
