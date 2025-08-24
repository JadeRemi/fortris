# Fortris

A casual pixel-style game built with React, TypeScript, and Vite.

## Commands

```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn test         # Run tests (watch mode)
yarn test:run     # Run tests once
yarn lint         # Run ESLint
```

## Linting Setup

For real-time linting while coding:

- **VSCode**: Install the ESLint extension (`ms-vscode.vscode-eslint`)
- **Other editors**: Configure your editor to use the project's `.eslintrc` file
- **Manual**: Run `yarn lint` to check for linting issues
- **Auto-fix**: Run `yarn lint --fix` to automatically fix fixable issues

## Project Structure

```
src/
├── components/      # React components
├── utils/          # Pure utility functions (const fn = () => {})
├── config/         # App configuration and constants
├── assets/         # Imported assets (images, audio)
└── types/          # TypeScript type definitions

public/
└── assets/         # Static assets served directly
```

## Canvas

- **Resolution**: 1920x1080 (scales automatically)
- **Font**: Pixelify Sans
- **Battlefield**: 10x10 grid in center
- **Style**: Pixel art with noise background
