import { getVoronoiNoisePattern } from './voronoiUtils'

/**
 * Render deterministic Voronoi noise pattern as background
 */
export const renderNoiseBackground = (ctx: CanvasRenderingContext2D) => {
  const noisePattern = getVoronoiNoisePattern()
  ctx.putImageData(noisePattern, 0, 0)
}
