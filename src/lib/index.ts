// Export main game class and factory
export { Game as MonsterMergeGame, createGame } from './game'

// Export components for external use
export * from './components'

// Export queries for external use
export * from './queries'

// Export types
export * from './types'

// Export utility functions
export { createPlayerMonster } from './systems/spawn'

// Export individual systems for custom pipelines
export { movementSystem, knockbackSystem, boundarySystem } from './systems/movement'
export { collisionSystem } from './systems/collision'
export { attackSystem, healthSystem } from './systems/combat'
export { mergeSystem } from './systems/merge'
export { aiSystem, aiAttackSystem } from './systems/ai'
export { spawnSystem } from './systems/spawn'

// Export rendering components
export * from './rendering'
