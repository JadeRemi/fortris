// Enemy type definitions

export interface EnemyType {
  id: string
  name: string
  width: number  // size in cells (width)
  height: number // size in cells (height)
  assetPath: string
  assetWidth: number  // pixel dimensions of sprite
  assetHeight: number // pixel dimensions of sprite
  health: number
  damage: number // Damage dealt by this enemy
  spriteScale?: number // Optional sprite scale (default 1.0 = 100%)
  spawnWeight: number // relative probability of spawning
}

export interface Enemy {
  id: string // unique identifier for this enemy instance
  uuid: string // UUID for tracking and identification
  type: EnemyType
  x: number // battlefield cell x coordinate (left edge)
  y: number // battlefield cell y coordinate (top edge)
  health: number // current health (starts at type.health, decreases with damage)
  maxHealth: number // maximum health for reference
  turnsSinceSpawn: number // how many turns this enemy has been alive
}

// Battlefield cell state for enemy tracking
export interface BattlefieldCell {
  x: number
  y: number
  enemyId?: string // ID of enemy occupying this cell (if any)
}
