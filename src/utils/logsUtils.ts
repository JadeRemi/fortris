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
 * Calculate number of lines a message will take when rendered (ignoring color tags)
 */
const calculateLineCount = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number => {
  // Strip color tags for accurate width calculation
  const cleanText = text.replace(/<color:[^>]*>|<\/color>/g, '')
  const words = cleanText.split(' ')
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
    
    // Parse and render text with color support
    const actualLinesUsed = renderColoredText(ctx, message.text, LOGS_X + 10, cumulativeY, maxWidth, lineHeight, opacity)
    
    // Update cumulative Y for next message using actual lines rendered
    cumulativeY += actualLinesUsed * lineHeight
  })
  
  ctx.restore()
}

/**
 * Render text with color support using <color:#RRGGBB>text</color> format
 * Returns the actual number of lines used for rendering
 */
const renderColoredText = (ctx: CanvasRenderingContext2D, text: string, startX: number, startY: number, maxWidth: number, lineHeight: number, opacity: number): number => {
  // Parse text segments with their colors
  const segments = parseColoredText(text)
  
  // Check if there's any actual content to render
  const hasContent = segments.some(segment => segment.text.trim().length > 0)
  if (!hasContent) {
    return 0
  }
  
  let currentX = startX
  let currentY = startY
  let linesUsed = 1 // Start with 1 line
  let isFirstSegmentInLine = true
  
  for (const segment of segments) {
    // Skip empty segments
    if (!segment.text.trim()) {
      continue
    }
    
    // Set color for this segment
    if (segment.color) {
      // Convert hex to rgba with opacity
      const hex = segment.color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})` // Default white
    }
    
    // Word wrap this segment
    const words = segment.text.split(' ')
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      
      // Skip empty words
      if (!word.trim()) {
        continue
      }
      
      // Add space before word if not the first word in line
      const wordWithSpace = !isFirstSegmentInLine && currentX > startX ? ' ' + word : word
      const wordMetrics = ctx.measureText(wordWithSpace)
      
      // Check if word fits on current line
      if (currentX + wordMetrics.width > startX + maxWidth && currentX > startX) {
        // Move to next line
        currentY += lineHeight
        currentX = startX
        linesUsed++ // Increment line count
        isFirstSegmentInLine = true
        
        // Draw word without leading space on new line
        ctx.fillText(word, currentX, currentY)
        currentX += ctx.measureText(word).width
      } else {
        // Draw word on current line
        ctx.fillText(wordWithSpace, currentX, currentY)
        currentX += wordMetrics.width
      }
      
      isFirstSegmentInLine = false
    }
  }
  
  return linesUsed
}

/**
 * Parse text with color tags into segments
 */
const parseColoredText = (text: string): Array<{text: string, color?: string}> => {
  const segments: Array<{text: string, color?: string}> = []
  const colorRegex = /<color:([^>]+)>(.*?)<\/color>/g
  let lastIndex = 0
  let match
  
  while ((match = colorRegex.exec(text)) !== null) {
    // Add text before the color tag
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index)
      })
    }
    
    // Add colored text
    segments.push({
      text: match[2],
      color: match[1]
    })
    
    lastIndex = colorRegex.lastIndex
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex)
    })
  }
  
  return segments
}
