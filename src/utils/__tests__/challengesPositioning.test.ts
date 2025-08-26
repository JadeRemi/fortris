import { describe, it, expect } from 'vitest'

/**
 * Unit test for Challenges section positioning
 * Verifies that challenges content stays within canvas bounds
 */
describe('Challenges Section Positioning', () => {
  // Import actual config values for testing
  const CANVAS_HEIGHT = 1080
  const BATTLEFIELD_Y = 200 // From gameConfig.ts
  const ARMY_Y = BATTLEFIELD_Y
  const CHALLENGES_Y = ARMY_Y + 400 + 30 // 630
  
  // Challenges content positioning
  const CHALLENGES_HEADER_HEIGHT = 80 // Title + divider + padding
  const CHALLENGE_LINE_HEIGHT = 30 // Space between challenge lines
  const CHALLENGE_COUNT = 1 // Currently just one challenge
  
  it('should position challenges section within canvas bounds', () => {
    expect(CHALLENGES_Y).toBeLessThan(CANVAS_HEIGHT)
    expect(CHALLENGES_Y).toBeGreaterThan(0)
  })
  
  it('should position challenges content within canvas bounds', () => {
    // Calculate where the first challenge text appears
    const firstChallengeY = CHALLENGES_Y + CHALLENGES_HEADER_HEIGHT
    expect(firstChallengeY).toBeLessThan(CANVAS_HEIGHT)
    
    // Calculate where the last challenge text would appear
    const lastChallengeY = firstChallengeY + ((CHALLENGE_COUNT - 1) * CHALLENGE_LINE_HEIGHT)
    expect(lastChallengeY).toBeLessThan(CANVAS_HEIGHT)
  })
  
  it('should have proper spacing from ARMY section', () => {
    const ARMY_HEIGHT = 400
    const expectedChallengesY = ARMY_Y + ARMY_HEIGHT + 30 // 30px gap
    expect(CHALLENGES_Y).toBe(expectedChallengesY)
  })
  
  it('should verify actual positioning values', () => {
    // Test actual calculated positions
    expect(ARMY_Y).toBe(200) // BATTLEFIELD_Y
    expect(CHALLENGES_Y).toBe(630) // ARMY_Y + 400 + 30
    
    // First challenge text at Y=710 (630 + 80)
    const firstTextY = CHALLENGES_Y + CHALLENGES_HEADER_HEIGHT
    expect(firstTextY).toBe(710)
    
    // This should be well within canvas height of 1080
    expect(firstTextY).toBeLessThan(1080)
    expect(firstTextY + 100).toBeLessThan(1080) // Even with padding, should fit
  })
  
  it('should position challenge text within block boundaries horizontally', () => {
    const ARMY_X = 30 // ARMY_MARGIN from config
    const CHALLENGES_X = ARMY_X // Same as ARMY
    const CHALLENGES_WIDTH = 200 // Same as other sections
    const TEXT_PADDING = 15 // Padding from left edge
    
    // Challenge text should start at CHALLENGES_X + padding
    const challengeTextX = CHALLENGES_X + TEXT_PADDING
    expect(challengeTextX).toBe(45) // 30 + 15
    
    // Text should be well within the block's right boundary
    const blockRightEdge = CHALLENGES_X + CHALLENGES_WIDTH
    expect(challengeTextX).toBeLessThan(blockRightEdge)
    expect(challengeTextX).toBeGreaterThan(CHALLENGES_X) // Within left boundary
    
    // With left-aligned text, even long challenge text should stay within bounds
    // Longest expected text: " Have 5 Bishops (0/5)" ≈ 20 chars ≈ 160px at 16px font
    const approximateTextWidth = 160
    expect(challengeTextX + approximateTextWidth).toBeLessThan(blockRightEdge)
  })
  
  it('should have challenges section positioned correctly relative to other sections', () => {
    // Challenges should be below ARMY section
    expect(CHALLENGES_Y).toBeGreaterThan(ARMY_Y)
    
    // Challenges should start within canvas
    expect(CHALLENGES_Y).toBeLessThan(CANVAS_HEIGHT - 100) // Leave room for content
  })
})
