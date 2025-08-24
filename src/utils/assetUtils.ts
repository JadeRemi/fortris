/**
 * Asset path utilities for handling base paths correctly in development and production
 */

/**
 * Get the full asset path with correct base URL
 * Uses Vite's BASE_URL which automatically adjusts for GitHub Pages deployment
 * 
 * @param assetPath - Path relative to public folder (e.g., "assets/images/sprite.png")
 * @returns Full path with correct base URL
 */
export const getAssetPath = (assetPath: string): string => {
  // Remove leading slash if present to ensure consistent handling
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath
  
  // Combine with BASE_URL (which is "/" in dev, "/fortris/" in production)
  // @ts-ignore - Vite provides import.meta.env at runtime
  return `${import.meta.env.BASE_URL}${cleanPath}`
}

/**
 * Get image asset path
 * Convenience function for getting image asset paths
 * 
 * @param imageName - Image filename (e.g., "swordsman.png") 
 * @returns Full path to image with correct base URL
 */
export const getImagePath = (imageName: string): string => {
  return getAssetPath(`assets/images/${imageName}`)
}
