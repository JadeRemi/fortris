# Source Assets

This directory contains assets that are imported in your TypeScript/React code.

## Note
**Game assets have been moved to `/public/assets/`** to ensure proper inclusion in production builds.

## Usage
- For imported assets: `import logo from './assets/images/logo.png'`
- For game assets: Use public paths like `'/assets/images/sprite.png'`
- Assets are processed by Vite's build system (optimized, hashed filenames)
- Use for assets that are referenced in components or need build-time processing

## Directories
**Note: Game asset folders have been removed since all assets are now in `/public/assets/`**

## Example
```typescript
import playerSprite from '../assets/images/logo.png' // For imported assets
const gameSprite = '/assets/images/player.png' // For public game assets

// Use in component
<img src={playerSprite} alt="Imported asset" />
// Or reference public assets directly in canvas/game code
ctx.drawImage(getCachedImage('/assets/images/player.png'))
```
