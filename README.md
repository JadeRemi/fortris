# Fortris

A casual pixel-style game built with React, TypeScript, and Vite.

## Commands

```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn test         # Run tests (watch mode)
yarn test:run     # Run tests once
yarn lint         # Run ESLint
yarn deploy       # Deploy to GitHub Pages
```

## Deployment

### GitHub Pages

This project is configured for easy deployment to GitHub Pages using the `gh-pages` package.

**Prerequisites:**
- Repository must be pushed to GitHub
- GitHub Pages must be enabled for the repository
- You need push access to the repository

**Deploy Steps:**
```bash
# 1. Build the project
yarn build

# 2. Deploy to GitHub Pages
yarn deploy
```

**First-time setup:**
1. Go to your GitHub repository settings
2. Navigate to "Pages" section  
3. Set source to "Deploy from a branch"
4. Select "gh-pages" branch
5. Save the settings

The `yarn deploy` command will:
- Build the project automatically
- Create/update the `gh-pages` branch
- Push the built files to GitHub Pages
- Your game will be available at `https://<username>.github.io/<repository>`

**Configuration Notes:**
- The `vite.config.ts` includes `base: '/fortris/'` to ensure assets load correctly on GitHub Pages
- This base path must match your repository name for proper deployment
- Without this, you'll get MIME type errors when GitHub Pages tries to serve JS/CSS files
- Asset paths use `getImagePath()` utility to automatically adapt to the deployment base path
- This ensures images load correctly in both development (`/assets/...`) and production (`/fortris/assets/...`)

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
