/**
 * Challenge system - async event-driven progress tracking
 */

import { getWallCell } from './wallExtensions'
import { CHECKMARK, CHALLENGE_TARGETS } from '../config/gameConfig'
import { getCurrentTurn } from './combatUtils'

// Challenge data structure
interface Challenge {
  id: string
  name: string
  description: string
  target: number
  current: number
  isCompleted: boolean
  type: 'incremental' | 'simultaneous' // Type determines display and logic
  condition: () => number // Function that returns current progress
}

// Active challenges
let challenges: Challenge[] = []

// Global counters for incremental challenges
let ogresKilled = 0
let monksBought = 0
let unitsReached200Health = 0
let spearMultikills = 0

/**
 * Initialize challenge system with default challenges
 */
export const initializeChallenges = (): void => {
  challenges = [
    {
      id: 'have_5_bishops',
      name: 'Bishop Collector',
      description: `Have ${CHALLENGE_TARGETS.BISHOPS_COUNT} Bishops`,
      target: CHALLENGE_TARGETS.BISHOPS_COUNT,
      current: 0,
      isCompleted: false,
      type: 'simultaneous',
      condition: () => countUnitsOnWalls('bishop')
    },
    {
      id: 'kill_50_ogres',
      name: 'Ogre Slayer',
      description: `Kill ${CHALLENGE_TARGETS.OGRES_KILLED} Ogres`,
      target: CHALLENGE_TARGETS.OGRES_KILLED,
      current: 0,
      isCompleted: false,
      type: 'incremental',
      condition: () => ogresKilled
    },
    {
      id: 'buy_30_monks',
      name: 'Monk Recruiter',
      description: `Buy ${CHALLENGE_TARGETS.MONKS_BOUGHT} Monks`,
      target: CHALLENGE_TARGETS.MONKS_BOUGHT,
      current: 0,
      isCompleted: false,
      type: 'incremental',
      condition: () => monksBought
    },
    {
      id: 'reach_200_health',
      name: 'Health Master',
      description: `Have unit reach 200 health`,
      target: CHALLENGE_TARGETS.UNITS_REACH_200_HEALTH,
      current: 0,
      isCompleted: false,
      type: 'simultaneous',
      condition: () => unitsReached200Health
    },
    {
      id: 'spear_multikill',
      name: 'Spear Master',
      description: `Kill 5 enemies with 1 spear`,
      target: CHALLENGE_TARGETS.SPEAR_MULTIKILLS,
      current: 0,
      isCompleted: false,
      type: 'simultaneous',
      condition: () => spearMultikills
    },
    {
      id: 'survive_300_turns',
      name: 'Survivor',
      description: `Survive ${CHALLENGE_TARGETS.TURNS_SURVIVED} turns`,
      target: CHALLENGE_TARGETS.TURNS_SURVIVED,
      current: 0,
      isCompleted: false,
      type: 'simultaneous',
      condition: () => getCurrentTurn()
    }
  ]
}

/**
 * Count units of a specific type on all walls
 */
const countUnitsOnWalls = (unitType: string): number => {
  let count = 0
  
  // Check all wall types and cells
  for (const wallType of ['left', 'right', 'bottom'] as const) {
    const maxCells = 12 // All walls have 12 cells
    for (let i = 0; i < maxCells; i++) {
      const cell = getWallCell(wallType, i)
      if (cell?.isOccupied && cell.occupiedBy === unitType) {
        count++
      }
    }
  }
  
  return count
}

/**
 * Update challenge progress (synchronous)
 * This ensures consistent state when rendering
 */
export const updateChallengeProgress = (): void => {
  try {
    for (const challenge of challenges) {
      if (challenge.isCompleted) continue
      
      // Get current progress
      const newProgress = challenge.condition()
      
      // Update progress based on challenge type
      if (challenge.type === 'incremental') {
        // For incremental: only increase, never decrease
        if (newProgress > challenge.current) {
          challenge.current = newProgress
        }
      } else if (challenge.type === 'simultaneous') {
        // For simultaneous: always use current value, can go up or down
        // Exception: for achievement-style challenges, don't decrease once completed
        if (challenge.id === 'reach_200_health' || challenge.id === 'spear_multikill' || challenge.id === 'survive_300_turns') {
          // Achievement-style: only increase, never decrease
          if (newProgress > challenge.current) {
            challenge.current = newProgress
          }
        } else {
          // True simultaneous: can go up or down (like bishop count)
          challenge.current = newProgress
        }
      }
      
      // Check if completed
      if (challenge.current >= challenge.target) {
        challenge.isCompleted = true
      }
    }
  } catch (error) {
    // Silent error handling - don't affect gameplay
    console.warn('Challenge system error:', error)
  }
}

/**
 * Get all challenges for rendering
 */
export const getChallenges = (): Challenge[] => {
  return [...challenges] // Return copy to prevent mutations
}

/**
 * Format challenge text for display
 */
export const formatChallengeText = (challenge: Challenge): string => {
  const prefix = challenge.isCompleted ? CHECKMARK : ' '
  // Only show progress for incremental challenges, hide for simultaneous
  const progress = challenge.isCompleted ? '' : 
    (challenge.type === 'incremental' ? ` (${challenge.current}/${challenge.target})` : '')
  return `${prefix} ${challenge.description}${progress}`
}

/**
 * Get challenge text color
 */
export const getChallengeTextColor = (challenge: Challenge): string => {
  return challenge.isCompleted ? '#4CAF50' : '#f5f5f5' // Green if completed, otherwise white
}

/**
 * Increment ogre kill count for challenge tracking
 */
export const incrementOgreKills = (): void => {
  ogresKilled++
}

/**
 * Increment monk purchase count for challenge tracking
 */
export const incrementMonksBought = (): void => {
  monksBought++
}

/**
 * Increment units reached 200 health count for challenge tracking
 */
export const incrementUnitsReached200Health = (): void => {
  unitsReached200Health++
}

/**
 * Increment spear multikill count for challenge tracking
 */
export const incrementSpearMultikills = (): void => {
  spearMultikills++
}

/**
 * Reset all challenge progress (for game restart)
 */
export const resetChallengeProgress = (): void => {
  ogresKilled = 0
  monksBought = 0
  unitsReached200Health = 0
  spearMultikills = 0
  for (const challenge of challenges) {
    challenge.current = 0
    challenge.isCompleted = false
  }
}
