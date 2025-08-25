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
  tier: number       // Unit tier (1, 2, 3, etc.) - determines Roman numeral display
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
  spawnChance: number // independent probability of spawning per turn (0 = doesn't spawn naturally)
  lootChance: number // probability of dropping loot on death (0-1) - 95% gold, 5% diamond
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
    maxHealth: 40,
    damage: 2,
    tier: 1, // Tier 1 unit
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
    maxHealth: 20,
    damage: 1,
    tier: 1, // Tier 1 unit
    description: 'Small ranged unit - takes 1x1 cell'
  },
  
  MONK: {
    id: 'monk',
    name: 'Monk',
    width: 1,
    height: 1,
    imagePath: getImagePath('monk.png'),
    assetWidth: 128,
    assetHeight: 128,
    maxHealth: 20,
    damage: 1,
    spriteScale: 1.0,
    tier: 1, // Tier 1 unit
    description: 'Balanced support unit - takes 1x1 cell'
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
    spawnChance: 0.25, // Reduced from 40% to 25% chance per turn
    lootChance: 0.10 // 10% chance to drop loot (95% gold, 5% diamond)
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
    spawnChance: 0.15, // 15% chance per turn
    lootChance: 0.30 // 30% chance to drop loot (95% gold, 5% diamond)
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
    spawnChance: 0.12, // 12% chance per turn
    lootChance: 0.20 // 20% chance to drop loot (95% gold, 5% diamond) - reasonable default
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
    spawnChance: 0.08, // 8% chance per turn
    lootChance: 0.50 // 50% chance to drop loot (95% gold, 5% diamond)
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
    spawnChance: 0.06, // 6% chance per turn (doubled)
    lootChance: 1.00 // 100% chance to drop loot (95% gold, 5% diamond)
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
    spawnChance: 0, // Will not spawn naturally - special conditions only (Lich spawning)
    lootChance: 0.02 // 2% chance to drop loot (95% gold, 5% diamond)
  },
  
  SPIDER_LARGE: {
    id: 'spider_large',
    name: 'Large Spider',
    width: 4,
    height: 4,
    assetPath: getImagePath('spider.png'),
    assetWidth: 128,
    assetHeight: 128,
    health: 20,
    damage: 2,
    spawnChance: 0.03, // Lower than Ogre (0.06)
    lootChance: 1.00 // 100% chance to drop loot (95% gold, 5% diamond)
  },
  
  SPIDER_SMALL: {
    id: 'spider_small',
    name: 'Small Spider',
    width: 1,
    height: 1,
    assetPath: getImagePath('spider.png'),
    assetWidth: 128,
    assetHeight: 128,
    health: 3,
    damage: 1,
    spriteScale: 0.6, // Smaller to differentiate from large spider
    spawnChance: 0, // Does not spawn naturally - only from Large Spider death
    lootChance: 0.05 // 5% chance to drop loot (95% gold, 5% diamond)
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
 * Get all naturally spawning enemy units (spawn chance > 0)
 */
export const getSpawnableEnemyUnits = (): EnemyUnitType[] => {
  return Object.values(ENEMY_UNITS).filter(unit => unit.spawnChance > 0)
}
