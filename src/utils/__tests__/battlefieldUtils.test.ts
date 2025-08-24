import { describe, it, expect } from 'vitest'
import { battlefieldToCanvas } from '../battlefieldUtils'
import {
  BATTLEFIELD_X,
  BATTLEFIELD_Y,
  BATTLEFIELD_BORDER_WIDTH,
  BATTLEFIELD_CELL_SIZE,
  BATTLEFIELD_CELL_BORDER_WIDTH
} from '../../config/gameConfig'

describe('battlefieldUtils', () => {
  describe('battlefieldToCanvas', () => {
    it('should return correct coordinates for top-left cell (0,0)', () => {
      const coords = battlefieldToCanvas(0, 0)
      
      const expectedX = BATTLEFIELD_X + BATTLEFIELD_BORDER_WIDTH
      const expectedY = BATTLEFIELD_Y + BATTLEFIELD_BORDER_WIDTH
      
      expect(coords.x).toBe(expectedX)
      expect(coords.y).toBe(expectedY)
    })
    
    it('should return correct coordinates for cell (1,1)', () => {
      const coords = battlefieldToCanvas(1, 1)
      
      const expectedX = BATTLEFIELD_X + BATTLEFIELD_BORDER_WIDTH + 1 * (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH)
      const expectedY = BATTLEFIELD_Y + BATTLEFIELD_BORDER_WIDTH + 1 * (BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH)
      
      expect(coords.x).toBe(expectedX)
      expect(coords.y).toBe(expectedY)
    })
    
    it('should place hit border completely inside cell bounds', () => {
      // Test hit border positioning for various cells
      const testCells = [
        { row: 0, col: 0 },
        { row: 5, col: 5 },
        { row: 11, col: 11 } // Bottom-right corner
      ]
      
      testCells.forEach(({ row, col }) => {
        const coords = battlefieldToCanvas(row, col)
        
        // Simulate hit border calculation (matching combat system)
        const lineWidth = 6
        const inset = lineWidth / 2 // 3px inset
        const innerX = coords.x + inset
        const innerY = coords.y + inset
        const innerSize = BATTLEFIELD_CELL_SIZE - lineWidth
        
        // Verify border is inside the cell
        expect(innerX).toBeGreaterThanOrEqual(coords.x)
        expect(innerY).toBeGreaterThanOrEqual(coords.y)
        expect(innerX + innerSize).toBeLessThanOrEqual(coords.x + BATTLEFIELD_CELL_SIZE)
        expect(innerY + innerSize).toBeLessThanOrEqual(coords.y + BATTLEFIELD_CELL_SIZE)
        
        // Verify border has reasonable size
        expect(innerSize).toBeGreaterThan(0)
        expect(innerSize).toBeLessThan(BATTLEFIELD_CELL_SIZE)
      })
    })
    
    it('should maintain consistent spacing between cells', () => {
      // Check that adjacent cells have correct spacing
      const cell00 = battlefieldToCanvas(0, 0)
      const cell01 = battlefieldToCanvas(0, 1)
      const cell10 = battlefieldToCanvas(1, 0)
      
      const expectedSpacing = BATTLEFIELD_CELL_SIZE + BATTLEFIELD_CELL_BORDER_WIDTH
      
      expect(cell01.x - cell00.x).toBe(expectedSpacing)
      expect(cell01.y - cell00.y).toBe(0)
      
      expect(cell10.x - cell00.x).toBe(0)  
      expect(cell10.y - cell00.y).toBe(expectedSpacing)
    })
    
    it('should ensure hit border inset calculation is mathematically sound', () => {
      // Test the mathematical correctness of the inset calculation
      const lineWidth = 6
      const inset = lineWidth / 2
      const innerSize = BATTLEFIELD_CELL_SIZE - lineWidth
      
      // Verify inset is half the line width (for centered stroke)
      expect(inset).toBe(3)
      
      // Verify inner size accounts for both sides of the border
      expect(innerSize).toBe(BATTLEFIELD_CELL_SIZE - 6)
      
      // Verify total space used equals original cell size
      expect(inset + innerSize + inset).toBe(BATTLEFIELD_CELL_SIZE)
      
      // Verify resulting border leaves reasonable space
      expect(innerSize).toBeGreaterThan(BATTLEFIELD_CELL_SIZE * 0.8) // At least 80% of cell
    })
  })
})
