import React, { useRef, useEffect, useState, useCallback } from 'react'
import { calculateCanvasScale, screenToCanvasCoordinates } from '../utils/canvasUtils'
import { createGameLoop } from '../utils/gameLoop'
import { renderNoiseBackground } from '../utils/noiseUtils'
import { renderBattlefield } from '../utils/battlefieldUtils'
import { renderWalls, handleWallHover } from '../utils/wallsUtils'
import { renderControls, renderArmy, isPointInAnyUnitCell, renderCursorSprite, handleGlobalClick, tryPlaceUnitOnWall, getSelectionState, handleArmyMouseMove, handleArmyClick, getSwordsmanPlusButtonX, getBowmanPlusButtonX, getMonkPlusButtonX, selectUpgrade, clearUpgradeSelection } from '../utils/controlsUtils'
import { isPointInRect } from '../utils/tooltipUtils'
import { SWORDSMAN_CELL_Y, BOWMAN_CELL_Y, MONK_CELL_Y, ARMY_UNIT_CELL_SIZE } from '../config/gameConfig'
import { restartGame } from '../utils/gameResetUtils'
import { renderPlacedUnits, isWallCellOccupied, getLeftWallCellIndex, getRightWallCellIndex, getBottomWallCellIndex, renderUnitHealthNumbers, clearAllWallUnits, upgradeWallUnit } from '../utils/wallExtensions'
import { renderInventory, isPointInUpgradeButton } from '../utils/inventoryUtils'
import { renderChallenges } from '../utils/challengesUtils'
import { initializeChallenges, updateChallengeProgress } from '../utils/challengeSystem'
import { getCollectedDiamondCount, spendDiamond, addDiamonds } from '../utils/diamondUtils'
import { addCoins } from '../utils/coinUtils'
import { preloadImages } from '../utils/imageUtils'
import { loadGameFont, renderText } from '../utils/fontUtils'
import { drawPixelButton, createButton, isPointInButton, type CanvasButton } from '../utils/canvasButtonUtils'
import { updateFPS, renderFPS, renderTurnCounter, renderEnemyCounter } from '../utils/fpsUtils'
import { updateCombat, renderCombatEffects, startCombat, getCurrentTurn, shouldAutoStartCombat, skipTurn, toggleFreeze, isFrozen } from '../utils/combatUtils'
import { renderLogs } from '../utils/logsUtils'

import { renderTooltip, showTooltip, hideTooltip } from '../utils/tooltipUtils'
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
  const [isFullscreen, setIsFullscreen] = useState(false) // Track fullscreen state

  // Fullscreen functions
  const enterFullscreen = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      await canvas.requestFullscreen()
      setIsFullscreen(true)
    } catch (error) {
      console.error('Error entering fullscreen:', error)
    }
  }

  const exitFullscreen = async () => {
    try {
      await document.exitFullscreen()
      setIsFullscreen(false)
    } catch (error) {
      console.error('Error exiting fullscreen:', error)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Draw absolute positioned button (not relative to controls section)
  const drawAbsoluteButton = (ctx: CanvasRenderingContext2D, button: CanvasButton) => {
    const { x, y, width, height, text, isPressed, isHovered } = button
    
    // Use same colors as other buttons but smaller styling
    const borderColor = '#8b7355'
    const bgColor = isPressed ? '#1f1810' : (isHovered ? '#3a2d20' : '#2d2318')
    const highlightColor = isHovered ? '#5a4635' : '#8b7355'
    
    ctx.save()
    
    // Draw with border-radius using rounded rectangle
    const cornerRadius = 6
    
    // Helper function for rounded rectangle
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.arcTo(x + width, y, x + width, y + height, radius)
      ctx.arcTo(x + width, y + height, x, y + height, radius)
      ctx.arcTo(x, y + height, x, y, radius)
      ctx.arcTo(x, y, x + width, y, radius)
      ctx.closePath()
    }
    
    // Draw outer border/highlight
    ctx.fillStyle = highlightColor
    drawRoundedRect(x, y, width, height, cornerRadius)
    ctx.fill()
    
    // Draw main border
    ctx.fillStyle = borderColor
    drawRoundedRect(x + 1, y + 1, width - 2, height - 2, cornerRadius - 1)
    ctx.fill()
    
    // Draw main button background
    const inset = isPressed ? 2 : 1
    ctx.fillStyle = bgColor
    drawRoundedRect(x + inset, y + inset, width - inset * 2, height - inset * 2, cornerRadius - inset)
    ctx.fill()
    
    // Draw text
    const textX = x + width / 2 + (isPressed ? 1 : 0)
    const textY = y + height / 2 + (isPressed ? 1 : 0)
    renderText(ctx, text, textX, textY, TEXT_PRIMARY, 14) // Slightly larger font for square button
    
    ctx.restore()
  }

  // Check if point is in absolute positioned button
  const isPointInAbsoluteButton = (x: number, y: number, button: CanvasButton): boolean => {
    return x >= button.x && 
           x <= button.x + button.width && 
           y >= button.y && 
           y <= button.y + button.height
  }

  // Enhanced coordinate conversion that handles fullscreen mode with letterboxing
  const screenToCanvasCoordinatesEnhanced = (screenX: number, screenY: number, canvasRect: DOMRect, scale: number) => {
    if (isFullscreen) {
      // In fullscreen mode, we need to account for letterboxing
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Calculate the aspect ratios
      const canvasAspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT
      const viewportAspectRatio = viewportWidth / viewportHeight
      
      let actualCanvasWidth, actualCanvasHeight, offsetX, offsetY
      
      if (viewportAspectRatio > canvasAspectRatio) {
        // Viewport is wider than canvas aspect ratio - vertical letterboxing (black bars on sides)
        actualCanvasHeight = viewportHeight
        actualCanvasWidth = actualCanvasHeight * canvasAspectRatio
        offsetX = (viewportWidth - actualCanvasWidth) / 2
        offsetY = 0
      } else {
        // Viewport is taller than canvas aspect ratio - horizontal letterboxing (black bars on top/bottom)  
        actualCanvasWidth = viewportWidth
        actualCanvasHeight = actualCanvasWidth / canvasAspectRatio
        offsetX = 0
        offsetY = (viewportHeight - actualCanvasHeight) / 2
      }
      
      // Calculate the scale factor for fullscreen
      const fullscreenScale = actualCanvasWidth / CANVAS_WIDTH
      
      // Adjust coordinates for letterboxing offset and scale
      return {
        x: (screenX - offsetX) / fullscreenScale,
        y: (screenY - offsetY) / fullscreenScale
      }
    } else {
      // Use normal coordinate conversion for windowed mode
      return screenToCanvasCoordinates(screenX, screenY, canvasRect, scale)
    }
  }

  // Create fullscreen button (positioned absolutely in top-right corner)
  const fullscreenButton = useRef<CanvasButton>(
    createButton(
      CANVAS_WIDTH - 50, // 50px from right edge (absolute positioning)
      10, // 10px from top edge (absolute positioning)
      40, // square button
      40, // square button
      '⛶' // fullscreen icon symbol
    )
  )

    // Create stats button (positioned in controls section)
  const statsButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      80, // Below the controls title  
      140, // width
      42,  // height (reduced from 50 to 42 - thinner)
      'Hide Stats'
    )
  )
  
  // Create restart button (positioned below stats button)
  const restartButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      132, // Below the stats button (80 + 42 + 10 margin) - reduced gap
      140, // width
      42,  // height (reduced from 50 to 42 - thinner)
      'Restart'
    )
  )
  
  // Create skip turn button (positioned below restart button)
  const skipTurnButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      184, // Below the restart button (132 + 42 + 10 margin) - reduced gap
      140, // width
      42,  // height (reduced from 50 to 42 - thinner)
      'Skip Turn'
    )
  )
  
  // Create clear walls button (positioned below skip turn button)
  const clearWallsButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      236, // Below the skip turn button (184 + 42 + 10 margin) - reduced gap
      140, // width
      42,  // height (reduced from 50 to 42 - thinner)
      'Clear Walls'
    )
  )
  
  // Create max out button (positioned below clear walls button)
  const maxOutButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      288, // Below the clear walls button (236 + 42 + 10 margin)
      140, // width
      42,  // height (reduced from 50 to 42 - thinner)
      'Max out'
    )
  )
  
  // Create freeze button (positioned below max out button)
  const freezeButton = useRef<CanvasButton>(
    createButton(
      30, // 30px from left edge of controls section
      340, // Below the max out button (288 + 42 + 10 margin)
      140, // width
      42,  // height (reduced from 50 to 42 - thinner)
      'Freeze'
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
    
    // Update challenge progress (async, non-blocking)
    updateChallengeProgress() // Don't await - let it run in background
    
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

    // Render army section with mouse position for hover effects
    renderArmy(ctx, mousePositionRef.current.x, mousePositionRef.current.y)

    // Render controls section
    renderControls(ctx)

    // Render inventory section with mouse position for upgrade button
    renderInventory(ctx, mousePositionRef.current.x, mousePositionRef.current.y)
    
    // Render challenges section
    renderChallenges(ctx)

    // Render canvas buttons
    drawPixelButton(ctx, statsButton.current)
    drawPixelButton(ctx, restartButton.current)
    drawPixelButton(ctx, skipTurnButton.current)
    drawPixelButton(ctx, clearWallsButton.current)
    drawPixelButton(ctx, maxOutButton.current)
    drawPixelButton(ctx, freezeButton.current)
    
    // Render fullscreen button (absolute positioned)
    drawAbsoluteButton(ctx, fullscreenButton.current)

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
    
    // Render health numbers and tier indicators on units if stats are enabled
    if (statsEnabled && fontLoaded) {
      renderUnitHealthNumbers(ctx)
    }
    
    // Render combat logs
    renderLogs(ctx)
    
    // Render tooltips (last so they appear on top)
    renderTooltip(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
  }, [fontLoaded, statsEnabled]) // Added statsEnabled dependency

  // Update button text when statsEnabled changes
  useEffect(() => {
    statsButton.current.text = statsEnabled ? 'Hide Stats' : 'Show Stats'
  }, [statsEnabled])

  // Update fullscreen button text when fullscreen state changes
  useEffect(() => {
    fullscreenButton.current.text = isFullscreen ? '⊟' : '⛶' // Exit vs Enter fullscreen symbols
  }, [isFullscreen])

  // Update freeze button text when freeze state changes
  useEffect(() => {
    freezeButton.current.text = isFrozen() ? 'Unfreeze' : 'Freeze'
  }, []) // We'll need to trigger this when freeze state changes

  // Re-render when freeze state changes to update button text
  useEffect(() => {
    const interval = setInterval(() => {
      const currentFreezeState = isFrozen()
      const expectedText = currentFreezeState ? 'Unfreeze' : 'Freeze'
      if (freezeButton.current.text !== expectedText) {
        freezeButton.current.text = expectedText
        renderGame()
      }
    }, 100) // Check every 100ms

    return () => clearInterval(interval)
  }, [renderGame])

  // Initialize canvas and game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set the internal canvas size
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    
    // Initialize challenge system
    initializeChallenges()

    // Load font and preload images
    Promise.all([
      loadGameFont(),
          preloadImages([
      // Tier 1 Ally Units
      getImagePath('swordsman.png'),
      getImagePath('bowman.png'),
      getImagePath('monk.png'), // Preload monk ally unit
      
      // Tier 2 Ally Units (Upgrades)
      getImagePath('barbarian.png'), // Upgraded Swordsman
      getImagePath('lancer.png'),    // Upgraded Bowman  
      getImagePath('bishop.png'),    // Upgraded Monk
      
      // Projectiles and Effects
      getImagePath('arrow.png'), // Preload arrow for projectiles
      getImagePath('spear.png'), // Preload spear for future lancer projectiles
      getImagePath('icicle.png'), // Preload icicle for future projectiles
      getImagePath('slash.png'), // Preload slash effect for melee attacks
      getImagePath('claws.png'), // Preload claws effect for enemy attacks
      
      // Enemy Units
      getImagePath('skull.png'), // Preload skull enemy
      getImagePath('slime.png'), // Preload slime enemy
      getImagePath('lich.png'),  // Preload lich enemy
      getImagePath('ogre.png'),  // Preload ogre enemy
      getImagePath('skeleton.png'), // Preload skeleton enemy (no natural spawning)
      getImagePath('serpent.png'), // Preload serpent enemy
      getImagePath('spider.png'), // Preload spider enemy unit
      getImagePath('icegolem.png'), // Preload ice golem enemy
      
      // UI and Rewards
      getImagePath('coin.png'), // Preload coin for rewards
      getImagePath('diamond.png'), // Preload diamond for rewards
      getImagePath('upgrade.png') // Preload upgrade button icon
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
    const canvasCoords = screenToCanvasCoordinatesEnhanced(
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
    const wasClearWallsHovered = clearWallsButton.current.isHovered
    const wasFullscreenHovered = fullscreenButton.current.isHovered
    
    statsButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, statsButton.current)
    restartButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, restartButton.current)
    skipTurnButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, skipTurnButton.current)
    clearWallsButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, clearWallsButton.current)
    maxOutButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, maxOutButton.current)
    freezeButton.current.isHovered = isPointInButton(canvasCoords.x, canvasCoords.y, freezeButton.current)
    fullscreenButton.current.isHovered = isPointInAbsoluteButton(canvasCoords.x, canvasCoords.y, fullscreenButton.current)
    
    // Handle wall hover effects
    handleWallHover(canvasCoords.x, canvasCoords.y, renderGame)
    
    // Handle army tooltips
    handleArmyMouseMove(canvasCoords.x, canvasCoords.y, renderGame, statsEnabled)
    
    // Handle fullscreen button tooltip (only show when stats enabled and no unit selected)
    const selectionState = getSelectionState()
    if (statsEnabled && !selectionState.isUnitSelected && fullscreenButton.current.isHovered) {
      const tooltipX = fullscreenButton.current.x + fullscreenButton.current.width / 2
      const tooltipY = fullscreenButton.current.y + fullscreenButton.current.height + 5 // Below button
      const tooltipText = isFullscreen ? 'Exit fullscreen mode' : 'Fullscreen mode'
      showTooltip(tooltipText, tooltipX, tooltipY)
    } else if (fullscreenButton.current.isHovered) {
      // If hovering but conditions not met, hide tooltip
      hideTooltip()
    }
    
    // Check if hovering over buttons or any unit cell
    const overButton = statsButton.current.isHovered || restartButton.current.isHovered || skipTurnButton.current.isHovered || clearWallsButton.current.isHovered || maxOutButton.current.isHovered || freezeButton.current.isHovered || fullscreenButton.current.isHovered
    const overUnit = isPointInAnyUnitCell(canvasCoords.x, canvasCoords.y)
    
    // Check if hovering over plus buttons for pointer cursor (only when enabled)  
    const overPlusButton = !selectionState.isAnySelected && (
      isPointInRect(canvasCoords.x, canvasCoords.y, getSwordsmanPlusButtonX(), SWORDSMAN_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE) ||
      isPointInRect(canvasCoords.x, canvasCoords.y, getBowmanPlusButtonX(), BOWMAN_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE) ||
      isPointInRect(canvasCoords.x, canvasCoords.y, getMonkPlusButtonX(), MONK_CELL_Y, ARMY_UNIT_CELL_SIZE, ARMY_UNIT_CELL_SIZE)
    )
    
    // Check if hovering over upgrade button
    const overUpgradeButton = isPointInUpgradeButton(canvasCoords.x, canvasCoords.y)
    
    // Set appropriate cursor
    if (selectionState.isUnitSelected || selectionState.isUpgradeSelected) {
      canvas.style.cursor = 'none' // Hide cursor when showing sprite
    } else {
      canvas.style.cursor = (overButton || overUnit || overPlusButton || overUpgradeButton) ? 'pointer' : 'default'
    }
    
    // Request re-render if any button hover state changed
    const wasMaxOutHovered = maxOutButton.current.isHovered
    const wasFreezeHovered = freezeButton.current.isHovered
    if (wasStatsHovered !== statsButton.current.isHovered || wasRestartHovered !== restartButton.current.isHovered || wasSkipTurnHovered !== skipTurnButton.current.isHovered || wasClearWallsHovered !== clearWallsButton.current.isHovered || wasMaxOutHovered !== maxOutButton.current.isHovered || wasFreezeHovered !== freezeButton.current.isHovered || wasFullscreenHovered !== fullscreenButton.current.isHovered) {
      renderGame()
    }
  }, [scale, renderGame, isFullscreen])

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasCoords = screenToCanvasCoordinatesEnhanced(
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
    
    // Check if clicking on clear walls button
    if (isPointInButton(canvasCoords.x, canvasCoords.y, clearWallsButton.current)) {
      clearWallsButton.current.isPressed = true
      renderGame()
      return
    }
    
    // Check if clicking on max out button
    if (isPointInButton(canvasCoords.x, canvasCoords.y, maxOutButton.current)) {
      maxOutButton.current.isPressed = true
      renderGame()
      return
    }
    
    // Check if clicking on freeze button
    if (isPointInButton(canvasCoords.x, canvasCoords.y, freezeButton.current)) {
      freezeButton.current.isPressed = true
      renderGame()
      return
    }
    
    // Check if clicking on fullscreen button
    if (isPointInAbsoluteButton(canvasCoords.x, canvasCoords.y, fullscreenButton.current)) {
      fullscreenButton.current.isPressed = true
      renderGame()
      return
    }
    
    // Check if clicking on army units or plus buttons
    if (handleArmyClick(canvasCoords.x, canvasCoords.y, renderGame)) {
      return
    }
    
          // Handle upgrade button click
      if (isPointInUpgradeButton(canvasCoords.x, canvasCoords.y)) {
        const diamondCount = getCollectedDiamondCount()
        if (diamondCount > 0) {
          const selectionState = getSelectionState()
          if (!selectionState.isUpgradeSelected) {
            selectUpgrade()
            console.log('🔧 Upgrade selected - click on a wall unit to upgrade')
          } else {
            clearUpgradeSelection()
            console.log('🔧 Upgrade deselected')
          }
          renderGame()
        }
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
    
    // Check if upgrade is selected
    if (selectionState.isUpgradeSelected) {
      // Try to apply upgrade to wall unit
      let upgraded = false
      
      // Check left wall
      const leftCellIndex = getLeftWallCellIndex(canvasCoords.x, canvasCoords.y)
      if (leftCellIndex >= 0 && isWallCellOccupied('left', leftCellIndex)) {
        upgraded = upgradeWallUnit('left', leftCellIndex)
        if (!upgraded) {
          console.log('🚫 Cannot upgrade this unit (already upgraded or invalid)')
        }
      }
      
      // Check right wall if not upgraded
      if (!upgraded) {
        const rightCellIndex = getRightWallCellIndex(canvasCoords.x, canvasCoords.y)
        if (rightCellIndex >= 0 && isWallCellOccupied('right', rightCellIndex)) {
          upgraded = upgradeWallUnit('right', rightCellIndex)
          if (!upgraded) {
            console.log('🚫 Cannot upgrade this unit (already upgraded or invalid)')
          }
        }
      }
      
      // Check bottom wall if not upgraded
      if (!upgraded) {
        const bottomCellIndex = getBottomWallCellIndex(canvasCoords.x, canvasCoords.y)
        if (bottomCellIndex >= 0 && isWallCellOccupied('bottom', bottomCellIndex)) {
          upgraded = upgradeWallUnit('bottom', bottomCellIndex)
          if (!upgraded) {
            console.log('🚫 Cannot upgrade this unit (already upgraded or invalid)')
          }
        }
      }
      
      // Always clear upgrade selection after clicking (whether applied or cancelled)
      clearUpgradeSelection()
      if (upgraded) {
        spendDiamond() // Cost 1 diamond
      } else {
        console.log('🔧 Upgrade cancelled - clicked on empty area')
      }
      
      renderGame()
      return
    }
  }, [scale, renderGame, isFullscreen])

  const handleMouseUp = useCallback(async (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasCoords = screenToCanvasCoordinatesEnhanced(
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
    
    if (clearWallsButton.current.isPressed) {
      clearWallsButton.current.isPressed = false
      
      // If still over button, trigger click
      if (isPointInButton(canvasCoords.x, canvasCoords.y, clearWallsButton.current)) {
        clearAllWallUnits()
        renderGame() // Re-render after clearing walls
      }
      
      renderGame()
    }
    
    if (maxOutButton.current.isPressed) {
      maxOutButton.current.isPressed = false
      
      // If still over button, trigger click
      if (isPointInButton(canvasCoords.x, canvasCoords.y, maxOutButton.current)) {
        // Add 1000 coins and 1000 diamonds
        addCoins(1000)
        addDiamonds(1000)
        console.log('💰 Added 1000 coins and 1000 diamonds')
        renderGame() // Re-render after adding resources
      }
      
      renderGame()
    }
    
    if (freezeButton.current.isPressed) {
      freezeButton.current.isPressed = false
      
      // If still over button, trigger click
      if (isPointInButton(canvasCoords.x, canvasCoords.y, freezeButton.current)) {
        // Toggle freeze state
        toggleFreeze()
        const newState = isFrozen() ? 'frozen' : 'resumed'
        console.log(`❄️ Combat turns ${newState}`)
        renderGame() // Re-render to update button state
      }
      
      renderGame()
    }
    
    if (fullscreenButton.current.isPressed) {
      fullscreenButton.current.isPressed = false
      
      // If still over button, trigger click
      if (isPointInAbsoluteButton(canvasCoords.x, canvasCoords.y, fullscreenButton.current)) {
        if (isFullscreen) {
          exitFullscreen()
        } else {
          enterFullscreen()
        }
      }
      
      renderGame()
    }
  }, [scale, renderGame, isFullscreen, enterFullscreen, exitFullscreen])

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
        // Fullscreen styles - preserve aspect ratio with letterboxing
        ...(isFullscreen && {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          backgroundColor: '#000000', // Black letterbox background
          maxWidth: '100vw',
          maxHeight: '100vh',
          objectFit: 'contain', // This ensures aspect ratio is preserved
          border: 'none', // Remove border in fullscreen
        }),
      }}
    />
  )
}

export default GameCanvas
