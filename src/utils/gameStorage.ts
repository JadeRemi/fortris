/**
 * Simple game data storage (non-persistent)
 * For storing game state like score, level, etc.
 */

interface GameData {
  score: number
  level: number
  highScore: number
  gamesPlayed: number
  // Add more game data fields as needed
}

class GameStorage {
  private data: GameData = {
    score: 0,
    level: 1,
    highScore: 0,
    gamesPlayed: 0
  }

  /**
   * Get current score
   */
  getScore = (): number => this.data.score

  /**
   * Set score
   */
  setScore = (score: number): void => {
    this.data.score = score
    if (score > this.data.highScore) {
      this.data.highScore = score
    }
  }

  /**
   * Add to score
   */
  addScore = (points: number): void => {
    this.setScore(this.data.score + points)
  }

  /**
   * Get current level
   */
  getLevel = (): number => this.data.level

  /**
   * Set level
   */
  setLevel = (level: number): void => {
    this.data.level = level
  }

  /**
   * Get high score
   */
  getHighScore = (): number => this.data.highScore

  /**
   * Get games played count
   */
  getGamesPlayed = (): number => this.data.gamesPlayed

  /**
   * Increment games played
   */
  incrementGamesPlayed = (): void => {
    this.data.gamesPlayed++
  }

  /**
   * Get all game data
   */
  getAllData = (): Readonly<GameData> => ({ ...this.data })

  /**
   * Reset score and level (for new game)
   */
  resetGame = (): void => {
    this.data.score = 0
    this.data.level = 1
  }

  /**
   * Reset all data (including high score)
   */
  resetAll = (): void => {
    this.data = {
      score: 0,
      level: 1,
      highScore: 0,
      gamesPlayed: 0
    }
  }
}

// Create singleton instance
const gameStorage = new GameStorage()

export { gameStorage }
export type { GameData }
