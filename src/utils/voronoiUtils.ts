import { NOISE_COLORS, GRASS_COLORS } from '../config/palette'
import { CANVAS_WIDTH, CANVAS_HEIGHT, BATTLEFIELD_X, BATTLEFIELD_Y, BATTLEFIELD_TOTAL_WIDTH, BATTLEFIELD_TOTAL_HEIGHT } from '../config/gameConfig'

interface VoronoiPoint {
  x: number
  y: number
  colorIndex: number
}

/**
 * Seeded pseudo-random number generator
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed % 2147483647
    if (this.seed <= 0) this.seed += 2147483646
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }
}

/**
 * Calculate distance between two points
 */
const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Generate Voronoi points with seeded randomness and palette selection
 */
const generateVoronoiPoints = (count: number, width: number, height: number, seed: number, colorPalette: readonly string[]): VoronoiPoint[] => {
  const rng = new SeededRandom(seed)
  const points: VoronoiPoint[] = []

  for (let i = 0; i < count; i++) {
    points.push({
      x: rng.next() * width,
      y: rng.next() * height,
      colorIndex: Math.floor(rng.next() * colorPalette.length)
    })
  }

  return points
}

/**
 * Find the closest Voronoi point to a given coordinate
 */
const findClosestPoint = (x: number, y: number, points: VoronoiPoint[]): VoronoiPoint => {
  let closest = points[0]
  let minDistance = distance(x, y, closest.x, closest.y)

  for (let i = 1; i < points.length; i++) {
    const dist = distance(x, y, points[i].x, points[i].y)
    if (dist < minDistance) {
      minDistance = dist
      closest = points[i]
    }
  }

  return closest
}

/**
 * Generate deterministic pixelated Voronoi noise pattern with multi-palette support
 */
export const generateVoronoiNoise = (seed: number = 42): ImageData => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  // Generate separate point sets for each palette region for better distribution
  const pointCount = 2000 // Reduced per region but we'll have multiple regions
  
  // Generate points for grass area (battlefield)
  const grassPoints = generateVoronoiPoints(pointCount, CANVAS_WIDTH, CANVAS_HEIGHT, seed, GRASS_COLORS)
  
  // Generate points for general area (rest of canvas)
  const generalPoints = generateVoronoiPoints(pointCount, CANVAS_WIDTH, CANVAS_HEIGHT, seed + 1000, NOISE_COLORS)

  // Create image data
  const imageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT)
  const data = imageData.data

  // Pixelation settings
  const pixelSize = 8 // Larger size for stronger pixelation effect

  // Generate pixelated Voronoi pattern with region-based palettes
  for (let y = 0; y < CANVAS_HEIGHT; y += pixelSize) {
    for (let x = 0; x < CANVAS_WIDTH; x += pixelSize) {
      // Sample the center of each pixel block
      const sampleX = Math.min(x + Math.floor(pixelSize / 2), CANVAS_WIDTH - 1)
      const sampleY = Math.min(y + Math.floor(pixelSize / 2), CANVAS_HEIGHT - 1)
      
      // Determine which palette and points to use based on position
      let closest: VoronoiPoint
      let colorPalette: readonly string[]
      
      if (sampleX >= BATTLEFIELD_X && 
          sampleX < BATTLEFIELD_X + BATTLEFIELD_TOTAL_WIDTH &&
          sampleY >= BATTLEFIELD_Y && 
          sampleY < BATTLEFIELD_Y + BATTLEFIELD_TOTAL_HEIGHT) {
        // Use grass colors and grass-specific points for battlefield
        closest = findClosestPoint(sampleX, sampleY, grassPoints)
        colorPalette = GRASS_COLORS
      } else {
        // Use regular colors and general points for other areas
        closest = findClosestPoint(sampleX, sampleY, generalPoints)
        colorPalette = NOISE_COLORS
      }
      
      const color = colorPalette[closest.colorIndex]
      
      // Convert hex color to RGB
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      
      // Fill the entire pixel block with the same color
      for (let py = y; py < Math.min(y + pixelSize, CANVAS_HEIGHT); py++) {
        for (let px = x; px < Math.min(x + pixelSize, CANVAS_WIDTH); px++) {
          const index = (py * CANVAS_WIDTH + px) * 4
          data[index] = r     // Red
          data[index + 1] = g // Green
          data[index + 2] = b // Blue
          data[index + 3] = 255 // Alpha
        }
      }
    }
  }

  return imageData
}

/**
 * Cache for generated noise pattern
 */
let cachedNoisePattern: ImageData | null = null

/**
 * Get cached or generate new Voronoi noise pattern
 */
export const getVoronoiNoisePattern = (seed: number = 42): ImageData => {
  if (!cachedNoisePattern) {
    cachedNoisePattern = generateVoronoiNoise(seed)
  }
  return cachedNoisePattern
}

/**
 * Clear cached noise pattern (for regeneration with different seed or palette changes)
 */
export const clearNoiseCache = (): void => {
  cachedNoisePattern = null
}

/**
 * Force regeneration of noise pattern with multi-palette support
 * This will clear the cache and generate a new pattern on next render
 */
export const regenerateNoisePattern = (seed: number = 42): void => {
  clearNoiseCache()
  // Pre-generate new pattern
  cachedNoisePattern = generateVoronoiNoise(seed)
}

// Clear cache to apply new pixelation settings
clearNoiseCache()
