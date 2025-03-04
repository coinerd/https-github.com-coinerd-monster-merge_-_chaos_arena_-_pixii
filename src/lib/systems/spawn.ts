import { addEntity, addComponent } from 'bitecs'
import { 
  Position, 
  Velocity, 
  Health, 
  Attack, 
  Defense, 
  Monster, 
  Mergeable, 
  Collider, 
  AI, 
  Sprite, 
  PlayerControlled, 
  Enemy 
} from '../components'
import { GameWorld, GameConfig } from '../types'
import { MonsterType } from '../rendering/monster-sprites'

// Monster stats by type and level
interface MonsterStats {
  health: number
  attack: number
  defense: number
  speed: number
  radius: number
}

// Base stats for level 1 monsters
const BASE_MONSTER_STATS: Record<MonsterType, MonsterStats> = {
  [MonsterType.FIRE]: {
    health: 100,
    attack: 15,
    defense: 5,
    speed: 120,
    radius: 25
  },
  [MonsterType.WATER]: {
    health: 120,
    attack: 10,
    defense: 10,
    speed: 100,
    radius: 25
  },
  [MonsterType.EARTH]: {
    health: 150,
    attack: 8,
    defense: 15,
    speed: 80,
    radius: 25
  },
  [MonsterType.AIR]: {
    health: 80,
    attack: 12,
    defense: 8,
    speed: 140,
    radius: 25
  }
}

// Calculate monster stats based on type and level
export function calculateMonsterStats(type: MonsterType, level: number): MonsterStats {
  const baseStats = BASE_MONSTER_STATS[type]
  
  // Scale stats with level
  return {
    health: Math.floor(baseStats.health * (1 + (level - 1) * 0.5)),
    attack: Math.floor(baseStats.attack * (1 + (level - 1) * 0.3)),
    defense: Math.floor(baseStats.defense * (1 + (level - 1) * 0.3)),
    speed: Math.floor(baseStats.speed * (1 + (level - 1) * 0.1)),
    radius: Math.floor(baseStats.radius * (1 + (level - 1) * 0.2))
  }
}

/**
 * Create a player-controlled monster
 */
export function createPlayerMonster(
  world: GameWorld, 
  x: number, 
  y: number, 
  type: MonsterType, 
  level: number = 1
): number {
  const entity = addEntity(world)
  
  // Calculate stats based on type and level
  const stats = calculateMonsterStats(type, level)
  
  // Add components
  addComponent(world, Position, entity)
  Position.x[entity] = x
  Position.y[entity] = y
  
  addComponent(world, Velocity, entity)
  Velocity.x[entity] = 0
  Velocity.y[entity] = 0
  
  addComponent(world, Health, entity)
  Health.current[entity] = stats.health
  Health.max[entity] = stats.health
  
  addComponent(world, Attack, entity)
  Attack.damage[entity] = stats.attack
  Attack.range[entity] = stats.radius * 1.5
  Attack.cooldown[entity] = 1.0
  Attack.timer[entity] = 0
  
  addComponent(world, Defense, entity)
  Defense.value[entity] = stats.defense
  
  addComponent(world, Monster, entity)
  Monster.type[entity] = type
  Monster.level[entity] = level
  
  addComponent(world, Mergeable, entity)
  Mergeable.canMerge[entity] = 1 // Can merge
  
  addComponent(world, Collider, entity)
  Collider.radius[entity] = stats.radius
  Collider.isTrigger[entity] = 0 // Not a trigger
  
  addComponent(world, Sprite, entity)
  Sprite.typeId[entity] = type
  Sprite.animationFrame[entity] = 0
  Sprite.scale[entity] = 1.0
  Sprite.rotation[entity] = 0
  Sprite.opacity[entity] = 1.0
  
  // Add player control tag
  addComponent(world, PlayerControlled, entity)
  
  // Add to player entities list
  world.playerEntities.push(entity)
  
  // Emit spawn event
  world.events.push({
    type: 'MONSTER_SPAWNED',
    data: {
      entity,
      position: { x, y },
      type,
      level,
      isPlayer: true
    }
  })
  
  return entity
}

/**
 * Create an enemy monster
 */
export function createEnemyMonster(
  world: GameWorld, 
  x: number, 
  y: number, 
  type: MonsterType, 
  level: number = 1
): number {
  const entity = addEntity(world)
  
  // Calculate stats based on type and level
  const stats = calculateMonsterStats(type, level)
  
  // Add components
  addComponent(world, Position, entity)
  Position.x[entity] = x
  Position.y[entity] = y
  
  addComponent(world, Velocity, entity)
  Velocity.x[entity] = 0
  Velocity.y[entity] = 0
  
  addComponent(world, Health, entity)
  Health.current[entity] = stats.health
  Health.max[entity] = stats.health
  
  addComponent(world, Attack, entity)
  Attack.damage[entity] = stats.attack
  Attack.range[entity] = stats.radius * 1.5
  Attack.cooldown[entity] = 1.0
  Attack.timer[entity] = 0
  
  addComponent(world, Defense, entity)
  Defense.value[entity] = stats.defense
  
  addComponent(world, Monster, entity)
  Monster.type[entity] = type
  Monster.level[entity] = level
  
  addComponent(world, Mergeable, entity)
  Mergeable.canMerge[entity] = 0 // Enemy monsters can't merge
  
  addComponent(world, Collider, entity)
  Collider.radius[entity] = stats.radius
  Collider.isTrigger[entity] = 0 // Not a trigger
  
  addComponent(world, Sprite, entity)
  Sprite.typeId[entity] = type
  Sprite.animationFrame[entity] = 0
  Sprite.scale[entity] = 1.0
  Sprite.rotation[entity] = 0
  Sprite.opacity[entity] = 1.0
  
  // Add AI component
  addComponent(world, AI, entity)
  AI.state[entity] = 0 // Idle
  AI.targetEntity[entity] = 0 // No target
  AI.detectionRange[entity] = stats.radius * 5
  AI.decisionTimer[entity] = 0
  
  // Add enemy tag
  addComponent(world, Enemy, entity)
  
  // Emit spawn event
  world.events.push({
    type: 'MONSTER_SPAWNED',
    data: {
      entity,
      position: { x, y },
      type,
      level,
      isPlayer: false
    }
  })
  
  return entity
}

/**
 * Spawn system - handles spawning new enemy monsters
 */
export function spawnSystem(world: GameWorld): GameWorld {
  // Update spawn timer
  world.spawnTimer -= world.delta
  
  // Spawn new enemy if timer is up
  if (world.spawnTimer <= 0) {
    // Reset timer
    world.spawnTimer = world.config.baseSpawnInterval * (0.8 + Math.random() * 0.4)
    
    // Determine spawn position (around the edges)
    const { arenaWidth, arenaHeight } = world.config
    let x, y
    
    // 50% chance to spawn on horizontal edge, 50% on vertical edge
    if (Math.random() < 0.5) {
      // Horizontal edge (top or bottom)
      x = Math.random() * arenaWidth
      y = Math.random() < 0.5 ? 20 : arenaHeight - 20
    } else {
      // Vertical edge (left or right)
      x = Math.random() < 0.5 ? 20 : arenaWidth - 20
      y = Math.random() * arenaHeight
    }
    
    // Determine monster type and level
    const type = Math.floor(Math.random() * 4) as MonsterType // 0-3 for Fire, Water, Earth, Air
    
    // Level is weighted toward lower levels
    const levelRoll = Math.random()
    let level = 1
    
    if (levelRoll > 0.95) {
      level = 3
    } else if (levelRoll > 0.8) {
      level = 2
    }
    
    // Create enemy monster
    createEnemyMonster(world, x, y, type, level)
  }
  
  return world
}
