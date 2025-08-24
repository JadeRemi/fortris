# Source Assets

This directory contains assets that are imported in your TypeScript/React code.

## Usage
- Import assets in your code: `import logo from './assets/images/logo.png'`
- Assets are processed by Vite's build system (optimized, hashed filenames)
- Use for assets that are referenced in components or need build-time processing

## Directories
- `images/` - Image files (PNG, JPG, SVG, etc.)
- `audio/` - Audio files (MP3, WAV, OGG, etc.)

## Example
```typescript
import playerSprite from '../assets/images/player.png'
import backgroundMusic from '../assets/audio/theme.mp3'

// Use in component
<img src={playerSprite} alt="Player character" />
```
