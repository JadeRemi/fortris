/**
 * Challenges section rendering
 */

import { drawSectionHeader } from './uiSectionUtils'
import { getChallenges, formatChallengeText, getChallengeTextColor, updateChallengeProgress } from './challengeSystem'
import { CHALLENGES_X, CHALLENGES_Y, CHALLENGES_WIDTH, CHALLENGES_HEIGHT } from '../config/gameConfig'

/**
 * Render the challenges section
 */
export const renderChallenges = (ctx: CanvasRenderingContext2D) => {
  // Update challenge progress synchronously to prevent flickering
  updateChallengeProgress()
  
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
  
  const maxWidth = CHALLENGES_WIDTH - 30 // Leave 15px padding on each side
  const lineHeight = 20 // Line height for wrapped text
  
  challenges.forEach((challenge) => {
    const text = formatChallengeText(challenge)
    const color = getChallengeTextColor(challenge)
    const textY = CHALLENGES_Y + yOffset
    
    ctx.fillStyle = color
    
    // Word wrap and render the text
    const words = text.split(' ')
    let line = ''
    let lineY = textY
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && line !== '') {
        // Draw the current line and start a new one
        ctx.fillText(line, CHALLENGES_X + 15, lineY) // 15px padding from left edge
        line = word
        lineY += lineHeight
      } else {
        line = testLine
      }
    }
    
    // Draw the final line
    if (line) {
      ctx.fillText(line, CHALLENGES_X + 15, lineY) // 15px padding from left edge
    }
    
    // Calculate how many lines this challenge used and update yOffset
    const linesUsed = Math.max(1, Math.ceil(words.length > 0 ? (lineY - textY) / lineHeight + 1 : 1))
    yOffset += linesUsed * lineHeight + 10 // 10px spacing between challenges
  })
}
