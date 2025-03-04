import { World } from 'bitecs'

export interface GameConfig {
  arenaWidth: number
  arenaHeight: number
  baseSpawnInterval: number
  monsterTypes: number
  maxLevel: number
  initialPlayerMonsters: number
}

export interface GameEvent {
  type: string
  data: any
}

// Extend the bitECS World type with our custom properties
export interface GameWorld extends World {
  delta: number
  time: number
  events: GameEvent[]
  deadEntities: number[]
  entitiesToRemove: number[]
  playerEntities: number[]
  spawnTimer: number
  config: GameConfig
}

export type System = (world: GameWorld) => GameWorld
