/**
 * Challenges section rendering
 */

import { drawSectionHeader } from './uiSectionUtils'
import { getChallenges, formatChallengeText, getChallengeTextColor } from './challengeSystem'
import { CHALLENGES_X, CHALLENGES_Y, CHALLENGES_WIDTH, CHALLENGES_HEIGHT } from '../config/gameConfig'

/**
 * Render the challenges section
 */
export const renderChallenges = (ctx: CanvasRenderingContext2D) => {
  // Draw section header using reusable styling
  drawSectionHeader(
    ctx, 
    'CHALLENGES', 
    CHALLENGES_X, 
    CHALLENGES_Y, 
    CHALLENGES_WIDTH, 
    CHALLENGES_HEIGHT
  )
  
  // Render challenges list
  const challenges = getChallenges()
  let yOffset = 80 // Start below header (title + divider + padding)
  
  // Set up text properties for content (left-aligned like other sections)
  ctx.font = '16px "Pixelify Sans", monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  challenges.forEach((challenge, index) => {
    const text = formatChallengeText(challenge)
    const color = getChallengeTextColor(challenge)
    const textY = CHALLENGES_Y + yOffset + (index * 30) // 30px between challenges
    
    // Use left-aligned text positioning like logs section
    ctx.fillStyle = color
    ctx.fillText(text, CHALLENGES_X + 15, textY) // 15px padding from left edge
  })
}
