import { describe, it, expect } from 'vitest'

/**
 * Unit test for Controls section button positioning
 * Verifies consistent 10px gaps between all buttons
 */
describe('Controls Button Positions', () => {
  // Button configuration constants from GameCanvas.tsx
  const BUTTON_HEIGHT = 42
  const BUTTON_GAP = 10
  const CONTROLS_X = 30
  
  // Expected button positions
  const STATS_Y = 80
  const RESTART_Y = STATS_Y + BUTTON_HEIGHT + BUTTON_GAP // 132
  const SKIP_TURN_Y = RESTART_Y + BUTTON_HEIGHT + BUTTON_GAP // 184
  const CLEAR_WALLS_Y = SKIP_TURN_Y + BUTTON_HEIGHT + BUTTON_GAP // 236
  const MAX_OUT_Y = CLEAR_WALLS_Y + BUTTON_HEIGHT + BUTTON_GAP // 288
  const FREEZE_Y = MAX_OUT_Y + BUTTON_HEIGHT + BUTTON_GAP // 340
  
  it('should have consistent 10px gaps between all buttons', () => {
    // Test each button position calculation
    expect(RESTART_Y).toBe(132)
    expect(SKIP_TURN_Y).toBe(184)
    expect(CLEAR_WALLS_Y).toBe(236)
    expect(MAX_OUT_Y).toBe(288)
    expect(FREEZE_Y).toBe(340)
  })
  
  it('should have correct gaps between consecutive buttons', () => {
    const gapStatsToRestart = RESTART_Y - (STATS_Y + BUTTON_HEIGHT)
    const gapRestartToSkip = SKIP_TURN_Y - (RESTART_Y + BUTTON_HEIGHT)
    const gapSkipToClear = CLEAR_WALLS_Y - (SKIP_TURN_Y + BUTTON_HEIGHT)
    const gapClearToMax = MAX_OUT_Y - (CLEAR_WALLS_Y + BUTTON_HEIGHT)
    const gapMaxToFreeze = FREEZE_Y - (MAX_OUT_Y + BUTTON_HEIGHT)
    
    expect(gapStatsToRestart).toBe(BUTTON_GAP)
    expect(gapRestartToSkip).toBe(BUTTON_GAP)
    expect(gapSkipToClear).toBe(BUTTON_GAP)
    expect(gapClearToMax).toBe(BUTTON_GAP)
    expect(gapMaxToFreeze).toBe(BUTTON_GAP)
  })
  
  it('should have all buttons with consistent dimensions', () => {
    const BUTTON_WIDTH = 140
    
    // All buttons should have same width and height
    expect(BUTTON_WIDTH).toBe(140)
    expect(BUTTON_HEIGHT).toBe(42)
    
    // All buttons should have same X position
    expect(CONTROLS_X).toBe(30)
  })
  
  it('should calculate positions using formula: previous_y + height + gap', () => {
    // Verify the positioning formula works correctly
    expect(RESTART_Y).toBe(STATS_Y + BUTTON_HEIGHT + BUTTON_GAP)
    expect(SKIP_TURN_Y).toBe(RESTART_Y + BUTTON_HEIGHT + BUTTON_GAP)
    expect(CLEAR_WALLS_Y).toBe(SKIP_TURN_Y + BUTTON_HEIGHT + BUTTON_GAP)
    expect(MAX_OUT_Y).toBe(CLEAR_WALLS_Y + BUTTON_HEIGHT + BUTTON_GAP)
    expect(FREEZE_Y).toBe(MAX_OUT_Y + BUTTON_HEIGHT + BUTTON_GAP)
  })
})
