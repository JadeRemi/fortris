/**
 * Calculate the optimal scale for a canvas to fit within the window
 * while preserving aspect ratio
 * 
 * @param canvasWidth - The desired canvas width
 * @param canvasHeight - The desired canvas height
 * @param windowWidth - The available window width
 * @param windowHeight - The available window height
 * @param padding - Optional padding to leave around the canvas (default: 20)
 * @returns The scale factor to apply to the canvas
 */
export function calculateCanvasScale(
  canvasWidth: number,
  canvasHeight: number,
  windowWidth: number,
  windowHeight: number,
  padding: number = 20
): number {
  const availableWidth = windowWidth - padding * 2
  const availableHeight = windowHeight - padding * 2
  
  const scaleX = availableWidth / canvasWidth
  const scaleY = availableHeight / canvasHeight
  
  // Use the smaller scale to ensure the canvas fits in both dimensions
  const scale = Math.min(scaleX, scaleY)
  
  // Ensure we don't scale up too much or down too much
  return Math.max(0.1, Math.min(scale, 2))
}

/**
 * Get the actual rendered dimensions of a scaled canvas
 * 
 * @param canvasWidth - The canvas width
 * @param canvasHeight - The canvas height
 * @param scale - The scale factor
 * @returns Object containing the scaled width and height
 */
export function getScaledCanvasDimensions(
  canvasWidth: number,
  canvasHeight: number,
  scale: number
): { width: number; height: number } {
  return {
    width: canvasWidth * scale,
    height: canvasHeight * scale
  }
}

/**
 * Convert screen coordinates to canvas coordinates
 * 
 * @param screenX - X coordinate on screen
 * @param screenY - Y coordinate on screen
 * @param canvasRect - The canvas bounding rectangle
 * @param scale - The current scale factor
 * @returns Canvas coordinates
 */
export function screenToCanvasCoordinates(
  screenX: number,
  screenY: number,
  canvasRect: DOMRect,
  scale: number
): { x: number; y: number } {
  return {
    x: (screenX - canvasRect.left) / scale,
    y: (screenY - canvasRect.top) / scale
  }
}
