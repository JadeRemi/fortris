// Enemies Configuration
import type { EnemyType } from '../types/enemies'
import { getImagePath } from '../utils/assetUtils'

// Available enemy types
export const ENEMY_TYPES = {
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
    spawnWeight: 0.5
  } as EnemyType,
  
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
    spawnWeight: 0.25
  } as EnemyType,
  
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
    spawnWeight: 0.20
  } as EnemyType,
  
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
    spawnWeight: 0.05
  } as EnemyType,
  
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
    spawnWeight: 0 // Will not spawn naturally - special conditions will be added later
  } as EnemyType,
  
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
    spawnWeight: 0.15 // Natural spawning enemy - 15% spawn weight
  } as EnemyType
}

// Enemy spawn settings
export const ENEMY_SPAWN_SETTINGS = {
  BASE_SPAWN_CHANCE: 0.3, // 30% chance per turn
  SPAWN_BLOCK_ON_TOP_ROW: true,
  MAX_ENEMIES_PER_TURN: 1
} as const

// Helper functions
export const getEnemyTypeById = (id: string): EnemyType | undefined => {
  return Object.values(ENEMY_TYPES).find(enemy => enemy.id === id)
}

export const getAllEnemyTypes = (): EnemyType[] => {
  return Object.values(ENEMY_TYPES)
}

export const getEnemySpawnWeights = (): Record<string, number> => {
  const weights: Record<string, number> = {}
  Object.values(ENEMY_TYPES).forEach(enemy => {
    weights[enemy.id] = enemy.spawnWeight
  })
  return weights
}
