# Assets Documentation

This project uses static assets (images, fonts, etc.) that are stored in the `/public/assets/` directory.

## Asset Structure

```
/public/assets/
├── images/
│   ├── swordsman.png      # 64x64px ally unit
│   ├── bowman.png         # 64x64px ally unit  
│   ├── skull.png          # 64x64px enemy unit
│   ├── slime.png          # 128x128px enemy unit
│   ├── lich.png           # 64x128px enemy unit
│   ├── ogre.png           # 128x128px enemy unit (scaled for 3x3 cells)
│   ├── skeleton.png       # 128x128px enemy unit (spawned by Lich)
│   ├── serpent.png        # 192x64px enemy unit (3x1 cells)
│   ├── coin.png           # 64x64px collectible sprite
│   ├── slash.png          # 64x64px melee attack effect
│   └── diamond.png        # 64x64px collectible sprite
└── fonts/
    └── PixelifySans-Regular.ttf  # Main game font

```

## Asset Loading

Assets are loaded using the `assetUtils.ts` helper which dynamically resolves paths based on the build environment:

- **Development**: Assets are served directly from `/public/assets/`
- **Production**: Assets are served from the configured base path (e.g., `/fortris/assets/` for GitHub Pages)

## Adding New Assets

1. Place the asset file in the appropriate `/public/assets/` subdirectory
2. Add the asset to the preload list in `GameCanvas.tsx`
3. Use `getImagePath()` or `getAssetPath()` to reference the asset in code
4. Update this documentation

## Asset Guidelines

- **Sprites**: All game sprites should maintain consistent pixel art style
- **Size**: Use power-of-2 dimensions when possible (64x64, 128x128, etc.)
- **Format**: PNG with transparency for sprites, TTF for fonts
- **Naming**: Use lowercase with hyphens (kebab-case) for filenames
