/**
 * Centralized combat and game log messages
 * All game messages are defined here for easy management and localization
 * 
 * ACTIVE MESSAGES (currently displayed in game):
 * 1. "{Enemy} is hit for {X} damage" - when enemies take damage (damage amount in green)
 * 2. "{Unit} is upgraded to {NewUnit}" - when units are upgraded (tier 2 unit name in orange-red)
 * 
 * COLOR FORMAT: Use <color:#RRGGBB>text</color> for colored text segments
 * 
 * REMOVED MESSAGES (for reference, intentionally not implemented):
 * - "Barbarian unleashes area attack!" 
 * - "[Monk/Bishop] heals ally for X health"
 * - "Ice Golem launches 3 icicle projectiles!"
 * - "Bishop boosts ally's max health by X"
 * - "Wall unit hit for X damage by icicle"
 * - "{Enemy} is hit in X cells for Y damage" (simplified to regular hit message)
 */

import { LOG_COLOR_TIER_2, LOG_COLOR_DAMAGE } from './gameConfig'

export const COMBAT_MESSAGES = {
  // Damage messages - damage amount highlighted in green
  enemyHit: (enemyName: string, damage: number) => `${enemyName} is hit for <color:${LOG_COLOR_DAMAGE}>${damage}</color> damage`,
  
  // Unit upgrade messages - tier 2 unit name highlighted in orange-red  
  unitUpgraded: (fromName: string, toName: string) => `${fromName} is upgraded to <color:${LOG_COLOR_TIER_2}>${toName}</color>`,
  
} as const

export type CombatMessageKey = keyof typeof COMBAT_MESSAGES
