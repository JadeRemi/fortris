/**
 * Unified game units configuration - single source of truth for all units
 * Contains both ally units and enemy units to eliminate ambiguity
 */

import { getImagePath } from '../utils/assetUtils'

// Base interface for ally units (matches UnitType)
export interface AllyUnitType {
  id: string
  name: string
  width: number  // Width in cells
  height: number // Height in cells
  imagePath: string
  assetWidth: number  // Asset width in pixels
  assetHeight: number // Asset height in pixels
  maxHealth: number  // Maximum health points
  damage: number     // Damage dealt by this unit
  spriteScale?: number // Optional sprite scale (default 1.0 = 100%)
  description?: string
}

// Base interface for enemy units (matches EnemyType)
export interface EnemyUnitType {
  id: string
  name: string
  width: number  // Width in cells
  height: number // Height in cells
  assetPath: string  // Note: enemies use 'assetPath', allies use 'imagePath'
  assetWidth: number  // Asset width in pixels
  assetHeight: number // Asset height in pixels
  health: number     // Note: enemies use 'health', allies use 'maxHealth'
  damage: number     // Damage dealt by this unit
  spriteScale?: number // Optional sprite scale (default 1.0 = 100%)
  spawnWeight: number // relative probability of spawning (0 = doesn't spawn naturally)
}

// ============ ALLY UNITS ============
export const ALLY_UNITS: Record<string, AllyUnitType> = {
  SWORDSMAN: {
    id: 'swordsman',
    name: 'Swordsman',
    width: 1,
    height: 1,
    imagePath: getImagePath('swordsman.png'),
    assetWidth: 128,
    assetHeight: 128,
    maxHealth: 10,
    damage: 2,
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
    damage: 1,
    description: 'Small ranged unit - takes 1x1 cell'
  }
} as const

// ============ ENEMY UNITS ============  
export const ENEMY_UNITS: Record<string, EnemyUnitType> = {
  
  SKULL: {
    id: 'skull',
    name: 'Skull',
    width: 1,
    height: 1,
    assetPath: getImagePath('skull.png'),
    assetWidth: 64,
    assetHeight: 64,
    health: 10,
    damage: 1,
    spriteScale: 0.7, // Make skulls appear smaller within their 1x1 cell
    spawnWeight: 0.45 // 45% spawn chance
  },
  
  SLIME: {
    id: 'slime', 
    name: 'Slime',
    width: 2,
    height: 2,
    assetPath: getImagePath('slime.png'),
    assetWidth: 128,
    assetHeight: 128,
    health: 10,
    damage: 1,
    spawnWeight: 0.25 // 25% spawn chance
  },
  
  SERPENT: {
    id: 'serpent',
    name: 'Serpent',
    width: 3,
    height: 1,
    assetPath: getImagePath('serpent.png'),
    assetWidth: 192,
    assetHeight: 64,
    health: 10,
    damage: 1,
    spawnWeight: 0.15 // 15% spawn chance (moved before Lich for better spawn order)
  },
  
  LICH: {
    id: 'lich',
    name: 'Lich',
    width: 1,
    height: 2,
    assetPath: getImagePath('lich.png'),
    assetWidth: 64,
    assetHeight: 128,
    health: 10,
    damage: 1,
    spawnWeight: 0.10 // 10% spawn chance (reduced from 20%)
  },
  
  OGRE: {
    id: 'ogre',
    name: 'Ogre', 
    width: 3,
    height: 3,
    assetPath: getImagePath('ogre.png'),
    assetWidth: 128,
    assetHeight: 128,
    health: 10,
    damage: 1,
    spawnWeight: 0.05 // 5% spawn chance
  },
  
  SKELETON: {
    id: 'skeleton',
    name: 'Skeleton',
    width: 1,
    height: 1,
    assetPath: getImagePath('skeleton.png'),
    assetWidth: 128,
    assetHeight: 128,
    health: 10,
    damage: 1,
    spawnWeight: 0 // Will not spawn naturally - special conditions only (Lich spawning)
  }
} as const

// ============ HELPER FUNCTIONS ============

/**
 * Get ally unit by ID
 */
export const getUnitById = (id: string): AllyUnitType | undefined => {
  return Object.values(ALLY_UNITS).find(unit => unit.id === id)
}

/**
 * Get enemy unit by ID
 */
export const getEnemyById = (id: string): EnemyUnitType | undefined => {
  return Object.values(ENEMY_UNITS).find(unit => unit.id === id)
}

/**
 * Get any unit (ally or enemy) by ID
 */
export const getAnyUnitById = (id: string): AllyUnitType | EnemyUnitType | undefined => {
  return getUnitById(id) || getEnemyById(id)
}

/**
 * Get all naturally spawning enemy units (spawn weight > 0)
 */
export const getSpawnableEnemyUnits = (): EnemyUnitType[] => {
  return Object.values(ENEMY_UNITS).filter(unit => unit.spawnWeight > 0)
}

/**
 * Validate spawn weights add up to 1.0
 */
export const validateSpawnWeights = (): { isValid: boolean; total: number } => {
  const spawnableEnemies = getSpawnableEnemyUnits()
  const total = spawnableEnemies.reduce((sum, enemy) => sum + enemy.spawnWeight, 0)
  return {
    isValid: Math.abs(total - 1.0) < 0.001, // Allow tiny floating point differences
    total
  }
}

// Log spawn weight validation on import (for debugging)
const validation = validateSpawnWeights()
if (!validation.isValid) {
  console.warn(`⚠️  Enemy spawn weights total ${validation.total} (should be 1.0)`)
} else {
  console.log(`✅ Enemy spawn weights validated: ${validation.total}`)
}
