import { defineQuery } from 'bitecs'
import { 
  Position, 
  Velocity, 
  Health, 
  Monster, 
  Collider, 
  PlayerControlled, 
  Enemy, 
  AI, 
  Mergeable,
  Attack,
  Knockback,
  Overlap
} from './components'

// Query for all monsters (entities with Position, Health, and Monster components)
export const monsterQuery = defineQuery([Position, Health, Monster])

// Query for player-controlled monsters
export const playerMonsterQuery = defineQuery([Position, Health, Monster, PlayerControlled])

// Query for enemy monsters
export const enemyMonsterQuery = defineQuery([Position, Health, Monster, Enemy])

// Query for monsters that can be merged
export const mergeableMonsterQuery = defineQuery([Position, Monster, Mergeable])

// Query for mergeable monsters that are overlapping
export const mergeableOverlapQuery = defineQuery([Monster, Mergeable, Overlap])

// Query for entities with AI
export const aiQuery = defineQuery([Position, AI])

// Query for AI entities that can attack
export const aiAttackQuery = defineQuery([Position, AI, Attack])

// Query for entities with velocity
export const movingEntityQuery = defineQuery([Position, Velocity])

// Query for entities with colliders
export const colliderQuery = defineQuery([Position, Collider])

// Query for entities with health
export const healthQuery = defineQuery([Health])

// Query for entities that can attack
export const attackerQuery = defineQuery([Position, Attack])

// Query for entities that can be damaged
export const damageableQuery = defineQuery([Position, Health])

// Query for entities with knockback
export const knockbackQuery = defineQuery([Position, Knockback])

// Query for entities with overlap
export const overlapQuery = defineQuery([Overlap])
