import { describe, it, expect } from 'vitest'
import { 
  calculateCanvasScale, 
  getScaledCanvasDimensions, 
  screenToCanvasCoordinates 
} from '../canvasUtils'

describe('canvasUtils', () => {
  describe('calculateCanvasScale', () => {
    it('should calculate correct scale when window is larger than canvas', () => {
      const scale = calculateCanvasScale(1920, 1080, 2000, 1200)
      expect(scale).toBeCloseTo(1.0208, 3) // min((2000-40)/1920, (1200-40)/1080) = min(1.0208, 1.074) = 1.0208
    })

    it('should calculate correct scale when window is smaller than canvas', () => {
      const scale = calculateCanvasScale(1920, 1080, 1000, 600)
      expect(scale).toBeCloseTo(0.5, 2) // min((1000-40)/1920, (600-40)/1080) = min(0.5, 0.518) = 0.5
    })

    it('should use the smaller scale dimension', () => {
      // Wide window, should be limited by height
      const scale1 = calculateCanvasScale(1920, 1080, 3000, 600)
      expect(scale1).toBeCloseTo(0.5185, 3) // min((3000-40)/1920, (600-40)/1080) = min(1.5417, 0.5185) = 0.5185

      // Tall window, should be limited by width  
      const scale2 = calculateCanvasScale(1920, 1080, 1000, 2000)
      expect(scale2).toBeCloseTo(0.5, 2) // min((1000-40)/1920, (2000-40)/1080) = min(0.5, 1.8148) = 0.5
    })

    it('should respect custom padding', () => {
      const scale = calculateCanvasScale(1920, 1080, 2000, 1200, 100)
      expect(scale).toBeCloseTo(0.926, 2) // (1200-200)/1080 = 0.926
    })

    it('should not scale below 0.1', () => {
      const scale = calculateCanvasScale(1920, 1080, 100, 100)
      expect(scale).toBe(0.1)
    })

    it('should not scale above 2', () => {
      const scale = calculateCanvasScale(100, 100, 5000, 5000)
      expect(scale).toBe(2)
    })
  })

  describe('getScaledCanvasDimensions', () => {
    it('should return correct scaled dimensions', () => {
      const dimensions = getScaledCanvasDimensions(1920, 1080, 0.5)
      expect(dimensions).toEqual({
        width: 960,
        height: 540
      })
    })

    it('should handle scale of 1', () => {
      const dimensions = getScaledCanvasDimensions(1920, 1080, 1)
      expect(dimensions).toEqual({
        width: 1920,
        height: 1080
      })
    })

    it('should handle scale greater than 1', () => {
      const dimensions = getScaledCanvasDimensions(100, 100, 2)
      expect(dimensions).toEqual({
        width: 200,
        height: 200
      })
    })
  })

  describe('screenToCanvasCoordinates', () => {
    it('should convert screen coordinates to canvas coordinates', () => {
      const canvasRect = {
        left: 100,
        top: 50,
        width: 960,
        height: 540,
        right: 1060,
        bottom: 590,
        x: 100,
        y: 50,
        toJSON: () => ({})
      } as DOMRect

      const coords = screenToCanvasCoordinates(300, 150, canvasRect, 0.5)
      expect(coords).toEqual({
        x: 400, // (300 - 100) / 0.5
        y: 200  // (150 - 50) / 0.5
      })
    })

    it('should handle coordinates at canvas origin', () => {
      const canvasRect = {
        left: 100,
        top: 50,
        width: 960,
        height: 540,
        right: 1060,
        bottom: 590,
        x: 100,
        y: 50,
        toJSON: () => ({})
      } as DOMRect

      const coords = screenToCanvasCoordinates(100, 50, canvasRect, 1)
      expect(coords).toEqual({
        x: 0,
        y: 0
      })
    })

    it('should handle different scale factors', () => {
      const canvasRect = {
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        right: 1920,
        bottom: 1080,
        x: 0,
        y: 0,
        toJSON: () => ({})
      } as DOMRect

      const coords = screenToCanvasCoordinates(960, 540, canvasRect, 2)
      expect(coords).toEqual({
        x: 480, // 960 / 2
        y: 270  // 540 / 2
      })
    })
  })
})
