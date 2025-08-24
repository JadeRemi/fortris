// Combat logs system
import { LOGS_X, LOGS_Y, LOGS_WIDTH } from '../config/gameConfig'
import { TEXT_PRIMARY } from '../config/palette'
import { renderText } from './fontUtils'

// Log message interface
interface LogMessage {
  id: string
  text: string
  timestamp: number
  isVisible: boolean
  lineCount?: number // Cached line count for proper positioning
}

// Global logs state
const logMessages: LogMessage[] = []
let logIdCounter = 0

/**
 * Add a new log message
 */
export const addLogMessage = (text: string): void => {
  const message: LogMessage = {
    id: `log_${logIdCounter++}_${Date.now()}`,
    text,
    timestamp: Date.now(),
    isVisible: true
  }
  
  logMessages.push(message)
  
  // Keep only the latest 8 messages
  while (logMessages.length > 8) {
    logMessages.shift()
  }
}

/**
 * Clear all log messages (for game restart)
 */
export const clearAllLogs = (): void => {
  logMessages.length = 0
  logIdCounter = 0
}

/**
 * Calculate number of lines a message will take when rendered
 */
const calculateLineCount = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number => {
  const words = text.split(' ')
  let lineCount = 0
  let line = ''
  
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && line !== '') {
      lineCount++
      line = word
    } else {
      line = testLine
    }
  }
  
  if (line) {
    lineCount++
  }
  
  return Math.max(lineCount, 1) // At least 1 line
}

/**
 * Update logs - remove expired messages
 */
export const updateLogs = (): void => {
  const currentTime = Date.now()
  
  // Remove messages that are older than 10 seconds
  for (let i = logMessages.length - 1; i >= 0; i--) {
    const message = logMessages[i]
    const age = currentTime - message.timestamp
    
    if (age > 10000) { // 10 seconds in milliseconds
      logMessages.splice(i, 1)
    }
  }
}

/**
 * Render the logs section
 */
export const renderLogs = (ctx: CanvasRenderingContext2D): void => {
  // Draw logs section background (optional border) - matching other sections
  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1
  ctx.strokeRect(LOGS_X, LOGS_Y, LOGS_WIDTH, 400) // 400px height for logs
  
  // Draw section title - matching other sections
  renderText(ctx, 'LOGS', LOGS_X + LOGS_WIDTH / 2, LOGS_Y + 30, TEXT_PRIMARY, 20)
  
  // Draw divider line - matching other sections
  ctx.strokeStyle = '#444444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(LOGS_X + 20, LOGS_Y + 50)
  ctx.lineTo(LOGS_X + LOGS_WIDTH - 20, LOGS_Y + 50)
  ctx.stroke()
  
  // Update logs before rendering
  updateLogs()
  
  // Render log messages
  ctx.font = '12px "Pixelify Sans", monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  const currentTime = Date.now()
  const lineHeight = 18
  const startY = LOGS_Y + 70 // Below the title and divider line (matching other sections)
  const maxWidth = LOGS_WIDTH - 20 // Leave some margin
  
  let cumulativeY = startY
  
  logMessages.forEach((message) => {
    const age = currentTime - message.timestamp
    const fadeProgress = age / 10000 // 10 seconds fade time
    
    // Calculate opacity based on age
    let opacity = 1.0
    if (fadeProgress > 0.7) {
      // Start fading after 70% of lifetime (7 seconds)
      opacity = 1.0 - ((fadeProgress - 0.7) / 0.3)
      opacity = Math.max(opacity, 0)
    }
    
    // Set text color with opacity
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    
    // Calculate line count if not cached
    if (!message.lineCount) {
      message.lineCount = calculateLineCount(ctx, message.text, maxWidth)
    }
    
    // Word wrap and render the text
    const words = message.text.split(' ')
    let line = ''
    let lineY = cumulativeY
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && line !== '') {
        // Draw the current line and start a new one
        ctx.fillText(line, LOGS_X + 10, lineY)
        line = word
        lineY += lineHeight
      } else {
        line = testLine
      }
    }
    
    // Draw the final line
    if (line) {
      ctx.fillText(line, LOGS_X + 10, lineY)
    }
    
    // Update cumulative Y for next message
    cumulativeY += message.lineCount * lineHeight
  })
  
  ctx.restore()
}
