import React, { useRef, useEffect, useState, useCallback } from 'react'
import { calculateCanvasScale, screenToCanvasCoordinates } from '../utils/canvasUtils'
import { createGameLoop } from '../utils/gameLoop'
import { renderNoiseBackground } from '../utils/noiseUtils'
import { renderBattlefield } from '../utils/battlefieldUtils'
import { renderWalls, handleWallHover, isInWall } from '../utils/wallsUtils'
import { renderControls, renderArmy, handleSwordsmanClick, handleBowmanClick, isPointInAnyUnitCell, renderCursorSprite, handleGlobalClick, tryPlaceUnitOnWall, getSelectionState } from '../utils/controlsUtils'
import { restartGame } from '../utils/gameResetUtils'
import { renderPlacedUnits, isWallCellOccupied, getLeftWallCellIndex, getRightWallCellIndex, getBottomWallCellIndex, renderUnitHealthNumbers } from '../utils/wallExtensions'
import { preloadImages } from '../utils/imageUtils'
import { loadGameFont, renderText } from '../utils/fontUtils'
import { drawPixelButton, createButton, isPointInButton, type CanvasButton } from '../utils/canvasButtonUtils'
import { updateFPS, renderFPS, renderTurnCounter, renderEnemyCounter } from '../utils/fpsUtils'
import { updateCombat, renderCombatEffects, startCombat, getCurrentTurn, shouldAutoStartCombat, skipTurn } from '../utils/combatUtils'
import { renderLogs } from '../utils/logsUtils'
import { getImagePath } from '../utils/assetUtils'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/gameConfig'
import { TEXT_PRIMARY } from '../config/palette'

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<ReturnType<typeof createGameLoop> | null>(null)
  const [scale, setScale] = useState(1)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [_mousePos, setMousePos] = useState({ x: 0, y: 0 }) // Throttled mouse position (not directly used)
  const [statsEnabled, setStatsEnabled] = useState(true) // Stats are enabled by default

  // Create stats button (positioned in controls section)
  const statsButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      80, // Below the controls title  
      140, // width
      50,  // height
'Hide Stats'
    )
  )
  
  // Create restart button (positioned below stats button)
  const restartButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      150, // Below the stats button (80 + 50 + 20 margin)
      140, // width
      50,  // height
      'Restart'
    )
  )
  
  // Create skip turn button (positioned below restart button)
  const skipTurnButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      220, // Below the restart button (150 + 50 + 20 margin)
      140, // width
      50,  // height
      'Skip Turn'
    )
  )

  // Game state (placeholder for future use)
  // const gameStateRef = useRef({
  //   // Add game state properties here as needed
  // })

  // Game update function
  const updateGame = useCallback((deltaTime: number) => {
    // Update game logic here
    // This runs at fixed timestep (60 FPS)
    updateFPS() // Update FPS tracking
    updateCombat(deltaTime) // Update combat system
    
    // Auto-start combat when units are placed
    if (shouldAutoStartCombat()) {
      startCombat()
    }
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

    // Render placed units in walls
    renderPlacedUnits(ctx)

    // Render army section
    renderArmy(ctx)

    // Render controls section
    renderControls(ctx)

    // Render canvas buttons
    drawPixelButton(ctx, statsButton.current)
    drawPixelButton(ctx, restartButton.current)
    drawPixelButton(ctx, skipTurnButton.current)

    // Render UI text if font is loaded
    if (fontLoaded) {
      renderText(ctx, 'Fortris', CANVAS_WIDTH / 2, 100, TEXT_PRIMARY, 48)
    }

    // Render cursor sprite if unit is selected (using immediate mouse position)
    renderCursorSprite(ctx, mousePositionRef.current.x, mousePositionRef.current.y)

    // Render combat effects (attack animations, hit effects, projectiles)
    renderCombatEffects(ctx)

    // Render FPS display (only if stats enabled)
    if (statsEnabled) {
      renderFPS(ctx)
    }
    
    // Render turn counter and enemy counter
    if (statsEnabled) {
      renderTurnCounter(ctx, getCurrentTurn())
      renderEnemyCounter(ctx)
    }
    
    // Render health numbers on units if stats are enabled
    if (statsEnabled && fontLoaded) {
      renderUnitHealthNumbers(ctx)
    }
    
    // Render combat logs
    renderLogs(ctx)
  }, [fontLoaded, statsEnabled]) // Added statsEnabled dependency

  // Update button text when statsEnabled changes
  useEffect(() => {
    statsButton.current.text = statsEnabled ? 'Hide Stats' : 'Show Stats'
  }, [statsEnabled])

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
      preloadImages([
        getImagePath('swordsman.png'),
        getImagePath('bowman.png'),
        getImagePath('arrow.png'), // Preload arrow for projectiles
        getImagePath('skull.png'), // Preload skull enemy
        getImagePath('slime.png'), // Preload slime enemy
        getImagePath('lich.png'),  // Preload lich enemy
        getImagePath('ogre.png'),  // Preload ogre enemy
        getImagePath('skeleton.png'), // Preload skeleton enemy (no natural spawning)
        getImagePath('serpent.png'), // Preload serpent enemy
        getImagePath('coin.png'), // Preload coin for rewards
        getImagePath('slash.png') // Preload slash effect for melee attacks
      ])
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

  // Mouse position throttling to prevent React render spam
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const lastMouseUpdateRef = useRef(0)

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

    // Store mouse position in ref for immediate use (no re-render)
    mousePositionRef.current = canvasCoords
    
    // Throttle React state updates to match target FPS (60 FPS = ~16.67ms)
    const now = performance.now()
    if (now - lastMouseUpdateRef.current >= 16.67) {
      setMousePos(canvasCoords)
      lastMouseUpdateRef.current = now
    }

    // Update button hover states
    const wasStatsHovered = statsButton.current.isHovered
    const wasRestartHovered = restartButton.current.isHovered
    const wasSkipTurnHovered = skipTurnButton.current.isHovered
    statsButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, statsButton.current)
    restartButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, restartButton.current)
    skipTurnButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, skipTurnButton.current)
    
    // Handle wall hover effects
    handleWallHover(canvasCoords.x, canvasCoords.y, renderGame)
    
    // Check if hovering over wall cells, buttons, or any unit cell
    const overButton = statsButton.current.isHovered || restartButton.current.isHovered || skipTurnButton.current.isHovered
    const overWall = isInWall(canvasCoords.x, canvasCoords.y)
    const overUnit = isPointInAnyUnitCell(canvasCoords.x, canvasCoords.y)
    const selectionState = getSelectionState()
    
    // Set appropriate cursor
    if (selectionState.isUnitSelected) {
      canvas.style.cursor = 'none' // Hide cursor when showing sprite
    } else {
      canvas.style.cursor = (overButton || overWall || overUnit) ? 'pointer' : 'default'
    }
    
    // Request re-render if any button hover state changed
    if (wasStatsHovered !== statsButton.current.isHovered || wasRestartHovered !== restartButton.current.isHovered || wasSkipTurnHovered !== skipTurnButton.current.isHovered) {
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
    
    // Check if clicking on restart button
    if (isPointInButton(canvasCoords.x, canvasCoords.y, restartButton.current)) {
      restartButton.current.isPressed = true
      renderGame()
      return
    }
    
    // Check if clicking on skip turn button
    if (isPointInButton(canvasCoords.x, canvasCoords.y, skipTurnButton.current)) {
      skipTurnButton.current.isPressed = true
      renderGame()
      return
    }
    
    // Check if clicking on unit cells
    if (handleSwordsmanClick(canvasCoords.x, canvasCoords.y, renderGame)) {
      return
    }
    if (handleBowmanClick(canvasCoords.x, canvasCoords.y, renderGame)) {
      return
    }

    // Check if unit is selected for placement
    const selectionState = getSelectionState()
    if (selectionState.isUnitSelected) {
      // Try to place unit on wall cell
      let placed = false

      // Check left wall
      const leftCellIndex = getLeftWallCellIndex(canvasCoords.x, canvasCoords.y)
      if (leftCellIndex >= 0 && !isWallCellOccupied('left', leftCellIndex)) {
        placed = tryPlaceUnitOnWall('left', leftCellIndex)
      }

      // Check right wall if not placed
      if (!placed) {
        const rightCellIndex = getRightWallCellIndex(canvasCoords.x, canvasCoords.y)
        if (rightCellIndex >= 0 && !isWallCellOccupied('right', rightCellIndex)) {
          placed = tryPlaceUnitOnWall('right', rightCellIndex)
        }
      }

      // Check bottom wall if not placed
      if (!placed) {
        const bottomCellIndex = getBottomWallCellIndex(canvasCoords.x, canvasCoords.y)
        if (bottomCellIndex >= 0 && !isWallCellOccupied('bottom', bottomCellIndex)) {
          placed = tryPlaceUnitOnWall('bottom', bottomCellIndex)
        }
      }

      // Always handle global click (deselect unit)
      handleGlobalClick(canvasCoords.x, canvasCoords.y, renderGame)
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

    // Handle button releases
    if (statsButton.current.isPressed) {
      statsButton.current.isPressed = false
      
      // If still over button, trigger click
      if (isPointInButton(canvasCoords.x, canvasCoords.y, statsButton.current)) {
        setStatsEnabled(!statsEnabled)
      }
      
      renderGame()
    }
    
    if (restartButton.current.isPressed) {
      restartButton.current.isPressed = false
      
      // If still over button, trigger click
      if (isPointInButton(canvasCoords.x, canvasCoords.y, restartButton.current)) {
        restartGame()
        renderGame() // Re-render after restart
      }
      
      renderGame()
    }
    
    if (skipTurnButton.current.isPressed) {
      skipTurnButton.current.isPressed = false
      
      // If still over button, trigger click
      if (isPointInButton(canvasCoords.x, canvasCoords.y, skipTurnButton.current)) {
        skipTurn()
        renderGame() // Re-render after skip turn
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
