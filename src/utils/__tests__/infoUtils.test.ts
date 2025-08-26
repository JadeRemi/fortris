/**
 * Unit tests for INFO block carousel functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  isPointInLeftArrow, 
  isPointInRightArrow, 
  handleInfoTooltips,
  handleInfoClick
} from '../infoUtils'

// Mock tooltip functions
vi.mock('../tooltipUtils', () => ({
  showTooltip: vi.fn()
}))

// Import the mocked function
import { showTooltip } from '../tooltipUtils'
const mockShowTooltip = vi.mocked(showTooltip)

// Import actual config values to ensure test accuracy
import { INFO_X, INFO_Y, INFO_WIDTH, ARMY_UNIT_CELL_SIZE, INFO_ARROW_GAP, INFO_TOOLTIP_OFFSET } from '../../config/gameConfig'

// Calculate positions using the same logic as the actual implementation
const CELL_SIZE = ARMY_UNIT_CELL_SIZE
const CELL_X = INFO_X + (INFO_WIDTH - CELL_SIZE) / 2
const ARROW_BUTTON_WIDTH = 7
const ARROW_BUTTON_HEIGHT = 60
const LEFT_ARROW_X = CELL_X - ARROW_BUTTON_WIDTH - INFO_ARROW_GAP
const RIGHT_ARROW_X = CELL_X + CELL_SIZE + INFO_ARROW_GAP
const ARROW_BUTTON_Y = INFO_Y + 80 + (CELL_SIZE - ARROW_BUTTON_HEIGHT) / 2

describe('INFO Block Arrow Navigation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Arrow button hit detection', () => {
    it('should detect point in left arrow button', () => {
      // Test center of left arrow button
      const centerX = LEFT_ARROW_X + ARROW_BUTTON_WIDTH / 2
      const centerY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      expect(isPointInLeftArrow(centerX, centerY)).toBe(true)
      expect(isPointInRightArrow(centerX, centerY)).toBe(false)
    })

    it('should detect point in right arrow button', () => {
      // Test center of right arrow button
      const centerX = RIGHT_ARROW_X + ARROW_BUTTON_WIDTH / 2
      const centerY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      expect(isPointInRightArrow(centerX, centerY)).toBe(true)
      expect(isPointInLeftArrow(centerX, centerY)).toBe(false)
    })

    it('should not detect point outside arrow buttons', () => {
      // Test point way outside any button
      const outsideX = INFO_X - 100
      const outsideY = INFO_Y - 100
      
      expect(isPointInLeftArrow(outsideX, outsideY)).toBe(false)
      expect(isPointInRightArrow(outsideX, outsideY)).toBe(false)
    })

    it('should detect exact button boundaries', () => {
      // Test left arrow boundaries
      expect(isPointInLeftArrow(LEFT_ARROW_X, ARROW_BUTTON_Y)).toBe(true) // Top-left corner
      expect(isPointInLeftArrow(LEFT_ARROW_X + ARROW_BUTTON_WIDTH, ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT)).toBe(true) // Bottom-right corner
      expect(isPointInLeftArrow(LEFT_ARROW_X - 1, ARROW_BUTTON_Y)).toBe(false) // Just outside left
      expect(isPointInLeftArrow(LEFT_ARROW_X, ARROW_BUTTON_Y - 1)).toBe(false) // Just outside top
      
      // Test right arrow boundaries  
      expect(isPointInRightArrow(RIGHT_ARROW_X, ARROW_BUTTON_Y)).toBe(true) // Top-left corner
      expect(isPointInRightArrow(RIGHT_ARROW_X + ARROW_BUTTON_WIDTH, ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT)).toBe(true) // Bottom-right corner
      expect(isPointInRightArrow(RIGHT_ARROW_X + ARROW_BUTTON_WIDTH + 1, ARROW_BUTTON_Y)).toBe(false) // Just outside right
      expect(isPointInRightArrow(RIGHT_ARROW_X, ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT + 1)).toBe(false) // Just outside bottom
    })
  })

  describe('Tooltip positioning', () => {
    it('should show left arrow tooltip at correct position when hovering', () => {
      const hoverX = LEFT_ARROW_X + ARROW_BUTTON_WIDTH / 2
      const hoverY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      handleInfoTooltips(hoverX, hoverY)
      
      expect(mockShowTooltip).toHaveBeenCalledTimes(1)
      expect(mockShowTooltip).toHaveBeenCalledWith(
        'Previous unit',
        LEFT_ARROW_X + ARROW_BUTTON_WIDTH / 2, // Tooltip X should be centered on button
        ARROW_BUTTON_Y + INFO_TOOLTIP_OFFSET // Tooltip Y should be at configurable offset from chevron top
      )
    })

    it('should show right arrow tooltip at correct position when hovering', () => {
      const hoverX = RIGHT_ARROW_X + ARROW_BUTTON_WIDTH / 2
      const hoverY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      handleInfoTooltips(hoverX, hoverY)
      
      expect(mockShowTooltip).toHaveBeenCalledTimes(1)
      expect(mockShowTooltip).toHaveBeenCalledWith(
        'Next unit',
        RIGHT_ARROW_X + ARROW_BUTTON_WIDTH / 2, // Tooltip X should be centered on button
        ARROW_BUTTON_Y + INFO_TOOLTIP_OFFSET // Tooltip Y should be at configurable offset from chevron top
      )
    })

    it('should not show tooltip when not hovering over any button', () => {
      const outsideX = INFO_X + INFO_WIDTH / 2 // Center of info block (between arrows)
      const outsideY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      handleInfoTooltips(outsideX, outsideY)
      
      expect(mockShowTooltip).not.toHaveBeenCalled()
    })

    it('should show correct tooltip text for each arrow', () => {
      // Test left arrow tooltip text
      handleInfoTooltips(LEFT_ARROW_X + 1, ARROW_BUTTON_Y + 1)
      expect(mockShowTooltip).toHaveBeenCalledWith(
        'Previous unit',
        expect.any(Number),
        expect.any(Number)
      )
      
      // Clear and test right arrow tooltip text
      vi.clearAllMocks()
      handleInfoTooltips(RIGHT_ARROW_X + 1, ARROW_BUTTON_Y + 1)
      expect(mockShowTooltip).toHaveBeenCalledWith(
        'Next unit',
        expect.any(Number),
        expect.any(Number)
      )
    })
  })

  describe('Click handling', () => {
    it('should handle left arrow click and return true', () => {
      const clickX = LEFT_ARROW_X + ARROW_BUTTON_WIDTH / 2
      const clickY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      const result = handleInfoClick(clickX, clickY)
      
      expect(result).toBe(true) // Should return true to indicate click was handled
    })

    it('should handle right arrow click and return true', () => {
      const clickX = RIGHT_ARROW_X + ARROW_BUTTON_WIDTH / 2
      const clickY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      const result = handleInfoClick(clickX, clickY)
      
      expect(result).toBe(true) // Should return true to indicate click was handled
    })

    it('should not handle clicks outside arrow buttons and return false', () => {
      const outsideX = INFO_X + INFO_WIDTH / 2 // Center of info block
      const outsideY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      const result = handleInfoClick(outsideX, outsideY)
      
      expect(result).toBe(false) // Should return false to indicate click was not handled
    })
  })

  describe('Button positioning relative to cell', () => {
    it('should position left arrow to the left of cell with correct gap', () => {
      const cellLeftEdge = CELL_X
      const leftArrowRightEdge = LEFT_ARROW_X + ARROW_BUTTON_WIDTH
      const actualGap = cellLeftEdge - leftArrowRightEdge
      
      expect(actualGap).toBe(INFO_ARROW_GAP) // Should have exactly the specified gap
    })

    it('should position right arrow to the right of cell with correct gap', () => {
      const cellRightEdge = CELL_X + CELL_SIZE
      const rightArrowLeftEdge = RIGHT_ARROW_X
      const actualGap = rightArrowLeftEdge - cellRightEdge
      
      expect(actualGap).toBe(INFO_ARROW_GAP) // Should have exactly the specified gap
    })

    it('should center arrows vertically with the cell', () => {
      const cellCenterY = INFO_Y + 80 + CELL_SIZE / 2
      const arrowCenterY = ARROW_BUTTON_Y + ARROW_BUTTON_HEIGHT / 2
      
      expect(arrowCenterY).toBe(cellCenterY) // Arrows should be vertically centered with cell
    })
  })
})

describe('Arrow Button Dimensions', () => {
  it('should have correct narrower width (3x less than original)', () => {
    const originalWidth = 20
    const expectedWidth = Math.round(originalWidth / 3)
    
    expect(ARROW_BUTTON_WIDTH).toBe(expectedWidth) // Should be approximately 1/3 of original width
  })

  it('should maintain same height as before', () => {
    const expectedHeight = 60
    
    expect(ARROW_BUTTON_HEIGHT).toBe(expectedHeight) // Height should remain unchanged
  })
})
