/**
 * Challenge system - async event-driven progress tracking
 */

import { getWallCell } from './wallExtensions'
import { CHECKMARK, CHALLENGE_TARGETS } from '../config/gameConfig'

// Challenge data structure
interface Challenge {
  id: string
  name: string
  description: string
  target: number
  current: number
  isCompleted: boolean
  condition: () => number // Function that returns current progress
}

// Active challenges
let challenges: Challenge[] = []

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
      condition: () => countUnitsOnWalls('bishop')
    }
    // More challenges can be added here
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
 * Update challenge progress (async, non-blocking)
 * This is called from gameplay without await
 */
export const updateChallengeProgress = async (): Promise<void> => {
  try {
    for (const challenge of challenges) {
      if (challenge.isCompleted) continue
      
      // Get current progress
      const newProgress = challenge.condition()
      
      // Update progress if it increased (never decrease)
      if (newProgress > challenge.current) {
        challenge.current = newProgress
        
        // Check if completed
        if (challenge.current >= challenge.target) {
          challenge.isCompleted = true
          console.log(`🏆 Challenge completed: ${challenge.description}`)
        }
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
  const progress = challenge.isCompleted ? '' : ` (${challenge.current}/${challenge.target})`
  return `${prefix} ${challenge.description}${progress}`
}

/**
 * Get challenge text color
 */
export const getChallengeTextColor = (challenge: Challenge): string => {
  return challenge.isCompleted ? '#4CAF50' : '#f5f5f5' // Green if completed, otherwise white
}
