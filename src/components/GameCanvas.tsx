import React, { useRef, useEffect, useState, useCallback } from 'react'
import { calculateCanvasScale, screenToCanvasCoordinates } from '../utils/canvasUtils'
import { createGameLoop } from '../utils/gameLoop'
import { renderNoiseBackground } from '../utils/noiseUtils'
import { renderBattlefield } from '../utils/battlefieldUtils'
import { renderWalls, handleWallHover, isInWall } from '../utils/wallsUtils'
import { renderControls, renderArmy, handleSwordsmanClick, isPointInSwordsmanCell } from '../utils/controlsUtils'
import { preloadImages } from '../utils/imageUtils'
import { loadGameFont, renderText } from '../utils/fontUtils'
import { drawPixelButton, createButton, isPointInButton, type CanvasButton } from '../utils/canvasButtonUtils'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/gameConfig'
import { TEXT_PRIMARY } from '../config/palette'

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<ReturnType<typeof createGameLoop> | null>(null)
  const [scale, setScale] = useState(1)
  const [fontLoaded, setFontLoaded] = useState(false)

  // Create stats button (positioned in controls section)
  const statsButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      80, // Below the controls title  
      140, // width
      50,  // height
      'Show Stats'
    )
  )

  // Game state (placeholder for future use)
  // const gameStateRef = useRef({
  //   // Add game state properties here as needed
  // })

  // Game update function
  const updateGame = useCallback((_deltaTime: number) => {
    // Update game logic here
    // This runs at fixed timestep (60 FPS)
  }, [])

  // Render function
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Render deterministic Voronoi noise background
    renderNoiseBackground(ctx)

    // Render battlefield
    renderBattlefield(ctx)

    // Render walls
    renderWalls(ctx)

    // Render army section
    renderArmy(ctx)

    // Render controls section
    renderControls(ctx)

    // Render canvas button
    drawPixelButton(ctx, statsButton.current)

    // Render UI text if font is loaded
    if (fontLoaded) {
      renderText(ctx, 'Fortris', CANVAS_WIDTH / 2, 100, TEXT_PRIMARY, 48)
    }
  }, [fontLoaded])

  // Initialize canvas and game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set the internal canvas size
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Load font and preload images
    Promise.all([
      loadGameFont(),
      preloadImages(['/src/assets/images/swordsman.png'])
    ]).then(() => setFontLoaded(true))
      .catch((error) => {
        console.error('Failed to load font or images:', error)
        setFontLoaded(false)
      })

    // Create and start game loop
    gameLoopRef.current = createGameLoop(updateGame, renderGame)
    gameLoopRef.current.start()

    // Initial render
    renderGame()

    // Cleanup
    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop()
      }
    }
  }, [updateGame, renderGame])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newScale = calculateCanvasScale(
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        window.innerWidth,
        window.innerHeight
      )
      setScale(newScale)
    }

    // Set initial scale
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mouse interaction handlers
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasCoords = screenToCanvasCoordinates(
      event.clientX,
      event.clientY,
      rect,
      scale
    )

    // Update button hover state
    const wasHovered = statsButton.current.isHovered
    statsButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, statsButton.current)
    
    // Handle wall hover effects
    handleWallHover(canvasCoords.x, canvasCoords.y, renderGame)
    
    // Check if hovering over wall cells, button, or swordsman cell
    const overButton = statsButton.current.isHovered
    const overWall = isInWall(canvasCoords.x, canvasCoords.y)
    const overSwordsman = isPointInSwordsmanCell(canvasCoords.x, canvasCoords.y)
    
    // Change cursor based on what's being hovered
    canvas.style.cursor = (overButton || overWall || overSwordsman) ? 'pointer' : 'default'
    
    // Request re-render if hover state changed
    if (wasHovered !== statsButton.current.isHovered) {
      renderGame()
    }
  }, [scale, renderGame])

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasCoords = screenToCanvasCoordinates(
      event.clientX,
      event.clientY,
      rect,
      scale
    )

    // Check if clicking on stats button
    if (isPointInButton(canvasCoords.x, canvasCoords.y, statsButton.current)) {
      statsButton.current.isPressed = true
      renderGame()
      return
    }
    
    // Check if clicking on swordsman cell
    if (handleSwordsmanClick(canvasCoords.x, canvasCoords.y, renderGame)) {
      return
    }
  }, [scale, renderGame])

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasCoords = screenToCanvasCoordinates(
      event.clientX,
      event.clientY,
      rect,
      scale
    )

    // Handle button release
    if (statsButton.current.isPressed) {
      statsButton.current.isPressed = false
      
      // If still over button, trigger click
      if (isPointInButton(canvasCoords.x, canvasCoords.y, statsButton.current)) {
        console.log('Show stats clicked')
        // TODO: Implement stats display logic
      }
      
      renderGame()
    }
  }, [scale, renderGame])

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        width: `${CANVAS_WIDTH * scale}px`,
        height: `${CANVAS_HEIGHT * scale}px`,
        maxWidth: '100vw',
        maxHeight: '100vh',
        border: '2px solid #444',
      }}
    />
  )
}

export default GameCanvas
