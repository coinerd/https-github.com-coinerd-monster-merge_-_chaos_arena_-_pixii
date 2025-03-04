import { System } from '../types'
import { movingEntityQuery, knockbackQuery } from '../queries'
import { Position, Velocity, Knockback } from '../components'

export const movementSystem: System = (world) => {
  const movables = movingEntityQuery(world)
  const delta = world.delta

  for (let i = 0; i < movables.length; i++) {
    const entity = movables[i]
    
    // Apply velocity to position
    Position.x[entity] += Velocity.x[entity] * delta
    Position.y[entity] += Velocity.y[entity] * delta
  }

  return world
}

export const knockbackSystem: System = (world) => {
  const entities = knockbackQuery(world)
  const delta = world.delta

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    
    if (Knockback.remaining[entity] > 0) {
      // Apply knockback force
      Position.x[entity] += Knockback.force[entity] * Math.cos(Knockback.duration[entity]) * delta
      Position.y[entity] += Knockback.force[entity] * Math.sin(Knockback.duration[entity]) * delta
      
      // Reduce remaining knockback time
      Knockback.remaining[entity] -= delta
    }
  }

  return world
}

export const boundarySystem: System = (world) => {
  const movables = movingEntityQuery(world)
  
  // Get arena boundaries from world config
  const { arenaWidth, arenaHeight } = world.config
  
  for (let i = 0; i < movables.length; i++) {
    const entity = movables[i]
    
    // Keep entities within arena boundaries
    if (Position.x[entity] < 0) {
      Position.x[entity] = 0
      Velocity.x[entity] = Math.abs(Velocity.x[entity]) * 0.5 // Bounce with reduced velocity
    } else if (Position.x[entity] > arenaWidth) {
      Position.x[entity] = arenaWidth
      Velocity.x[entity] = -Math.abs(Velocity.x[entity]) * 0.5
    }
    
    if (Position.y[entity] < 0) {
      Position.y[entity] = 0
      Velocity.y[entity] = Math.abs(Velocity.y[entity]) * 0.5
    } else if (Position.y[entity] > arenaHeight) {
      Position.y[entity] = arenaHeight
      Velocity.y[entity] = -Math.abs(Velocity.y[entity]) * 0.5
    }
  }
  
  return world
}
