/**
 * Centralized combat and game log messages
 * All game messages are defined here for easy management and localization
 * 
 * ACTIVE MESSAGES (currently displayed in game):
 * 1. "{Enemy} is hit for {X} damage" - when enemies take damage
 * 2. "{Unit} is upgraded to {NewUnit}" - when units are upgraded
 * 
 * REMOVED MESSAGES (for reference, intentionally not implemented):
 * - "Barbarian unleashes area attack!" 
 * - "[Monk/Bishop] heals ally for X health"
 * - "Ice Golem launches 3 icicle projectiles!"
 * - "Bishop boosts ally's max health by X"
 * - "Wall unit hit for X damage by icicle"
 * - "{Enemy} is hit in X cells for Y damage" (simplified to regular hit message)
 */

export const COMBAT_MESSAGES = {
  // Damage messages
  enemyHit: (enemyName: string, damage: number) => `${enemyName} is hit for ${damage} damage`,
  
  // Unit upgrade messages  
  unitUpgraded: (fromName: string, toName: string) => `${fromName} is upgraded to ${toName}`,
  
} as const

export type CombatMessageKey = keyof typeof COMBAT_MESSAGES
