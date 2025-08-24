/**
 * Image loading and rendering utilities
 */

// Cache for loaded images
const imageCache = new Map<string, HTMLImageElement>()

/**
 * Load an image and cache it
 */
export const loadImage = (imagePath: string): Promise<HTMLImageElement> => {
  // Check cache first
  if (imageCache.has(imagePath)) {
    return Promise.resolve(imageCache.get(imagePath)!)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      imageCache.set(imagePath, img)
      resolve(img)
    }
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imagePath}`))
    }
    
    img.src = imagePath
  })
}

/**
 * Get a cached image (returns undefined if not loaded)
 */
export const getCachedImage = (imagePath: string): HTMLImageElement | undefined => {
  return imageCache.get(imagePath)
}

/**
 * Preload multiple images
 */
export const preloadImages = (imagePaths: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(imagePaths.map(path => loadImage(path)))
}

/**
 * Draw an image at specific position with scaling
 */
export const drawImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width?: number,
  height?: number
) => {
  if (width !== undefined && height !== undefined) {
    ctx.drawImage(image, x, y, width, height)
  } else {
    ctx.drawImage(image, x, y)
  }
}

/**
 * Clear image cache
 */
export const clearImageCache = (): void => {
  imageCache.clear()
}
