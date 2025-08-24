import React, { useRef, useEffect, useState } from 'react'
import { calculateCanvasScale } from '../utils/canvasUtils'

const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set the internal canvas size
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Initialize canvas with a simple background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Add some visual indication that the canvas is working
    ctx.fillStyle = '#333333'
    ctx.fillRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Game Canvas Ready', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    ctx.fillText(`${CANVAS_WIDTH} x ${CANVAS_HEIGHT}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
  }, [])

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

  return (
    <canvas
      ref={canvasRef}
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
