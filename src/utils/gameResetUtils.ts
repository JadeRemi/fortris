import { stopCombat } from './combatUtils'
import { enemies, initializeBattlefield } from './enemyUtils'
import { clearAllWallCells } from './wallExtensions'
import { clearAllLogs } from './logsUtils'
import { resetDiamondCount } from './diamondUtils'
import {
  globalSelection,
  resetArmyStates
} from './controlsUtils'

/**
 * Complete game state reset - restart the level
 */
export const restartGame = (): void => {
  // Stop combat system and reset turn counter
  stopCombat()
  
  // Clear all enemies
  enemies.length = 0
  
  // Clear battlefield cells
  initializeBattlefield()
  
  // Clear all placed units from walls
  clearAllWallCells()
  
  // Clear all combat logs
  clearAllLogs()
  
  // Reset army unit states (counts and selections)
  resetArmyStates()
  
  // Clear global selection state
  globalSelection.isAnySelected = false
  globalSelection.selectedType = null
  globalSelection.selectedUnitType = null
  globalSelection.cursorSprite = null
  
  // Reset inventory counts
  resetDiamondCount()
  // Note: Coin count is already reset by clearCoins() in stopCombat()
  
  // Note: Combat system will auto-restart when units are placed again
  // Note: All projectiles and animations are cleared by stopCombat()
}
