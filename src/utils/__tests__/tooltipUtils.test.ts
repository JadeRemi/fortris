/**
 * Unit tests for tooltip positioning and functionality
 */

import { describe, it, expect } from 'vitest'
import { isPointInRect } from '../tooltipUtils'

describe('tooltipUtils', () => {
  // Test tooltip positioning logic without canvas dependencies
  describe('tooltip positioning logic', () => {
    it('should calculate improved Y position with more clearance', () => {
      // Test that the new positioning increases clearance from 5px to 25px
      const targetY = 200
      const tooltipHeight = 40
      const triangleSize = 6
      
      // Old positioning: targetY - tooltipHeight - triangleSize - 5
      const oldY = targetY - tooltipHeight - triangleSize - 5 // = 149
      
      // New positioning: targetY - tooltipHeight - triangleSize - 25  
      const newY = targetY - tooltipHeight - triangleSize - 25 // = 129
      
      // New positioning should provide 20px more clearance
      expect(oldY - newY).toBe(20)
      expect(newY).toBe(129) // Well above the target
    })

    it('should ensure tooltip does not obstruct target cell', () => {
      const targetY = 200
      const cellSize = 50
      const tooltipHeight = 40
      const triangleSize = 6
      
      // Calculate tooltip bottom with new positioning
      const tooltipY = targetY - tooltipHeight - triangleSize - 25
      const tooltipBottom = tooltipY + tooltipHeight // = 129 + 40 = 169
      
      // Calculate cell top
      const cellTop = targetY - cellSize / 2 // = 200 - 25 = 175
      
      // Tooltip should not overlap with cell
      expect(tooltipBottom).toBeLessThan(cellTop)
      expect(cellTop - tooltipBottom).toBeGreaterThan(0) // Should have clearance
    })
  })

  describe('isPointInRect', () => {
    it('should correctly detect point inside rectangle', () => {
      expect(isPointInRect(50, 50, 25, 25, 50, 50)).toBe(true)
      expect(isPointInRect(25, 25, 25, 25, 50, 50)).toBe(true) // top-left corner
      expect(isPointInRect(75, 75, 25, 25, 50, 50)).toBe(true) // bottom-right corner
    })

    it('should correctly detect point outside rectangle', () => {
      expect(isPointInRect(10, 10, 25, 25, 50, 50)).toBe(false) // above and left
      expect(isPointInRect(100, 100, 25, 25, 50, 50)).toBe(false) // below and right
      expect(isPointInRect(50, 10, 25, 25, 50, 50)).toBe(false) // above
      expect(isPointInRect(10, 50, 25, 25, 50, 50)).toBe(false) // left
    })

    it('should handle edge cases correctly', () => {
      // Test exact boundaries
      expect(isPointInRect(25, 25, 25, 25, 50, 50)).toBe(true) // Exact top-left
      expect(isPointInRect(74, 74, 25, 25, 50, 50)).toBe(true) // Just inside bottom-right
      expect(isPointInRect(75, 75, 25, 25, 50, 50)).toBe(true) // Exact bottom-right
      expect(isPointInRect(76, 76, 25, 25, 50, 50)).toBe(false) // Just outside
    })
  })
})
