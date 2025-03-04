import { System } from '../types'
import { aiQuery, aiAttackQuery } from '../queries'
import { AI, Position, Velocity, Attack } from '../components'

// AI states
const AI_STATE = {
  IDLE: 0,
  CHASE: 1,
  ATTACK: 2,
  FLEE: 3
}

export const aiSystem: System = (world) => {
  const entities = aiQuery(world)
  const delta = world.delta
  
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    
    // Decrease decision timer
    AI.decisionTimer[entity] -= delta
    
    // Make new decision if timer expired
    if (AI.decisionTimer[entity] <= 0) {
      // Reset timer with some randomness
      AI.decisionTimer[entity] = 1 + Math.random() * 2
      
      // Find nearest target (player or player monster)
      let nearestTarget = null
      let shortestDistance = Infinity
      
      // In a real implementation, we would query for player entities
      // For now, we'll use a placeholder for the player position
      const playerEntities = world.playerEntities || []
      
      for (let j = 0; j < playerEntities.length; j++) {
        const target = playerEntities[j]
        const targetX = Position.x[target]
        const targetY = Position.y[target]
        const entityX = Position.x[entity]
        const entityY = Position.y[entity]
        
        const dx = targetX - entityX
        const dy = targetY - entityY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < shortestDistance) {
          shortestDistance = distance
          nearestTarget = target
        }
      }
      
      // Update AI state based on distance to target
      if (nearestTarget !== null) {
        AI.targetEntity[entity] = nearestTarget
        
        if (shortestDistance < Attack.range[entity]) {
          // Target is in attack range
          AI.state[entity] = AI_STATE.ATTACK
        } else if (shortestDistance < AI.detectionRange[entity]) {
          // Target is in detection range
          AI.state[entity] = AI_STATE.CHASE
        } else {
          // Target is too far
          AI.state[entity] = AI_STATE.IDLE
        }
      } else {
        // No target found
        AI.state[entity] = AI_STATE.IDLE
      }
    }
    
    // Act based on current state
    switch (AI.state[entity]) {
      case AI_STATE.IDLE:
        // Random movement or stay still
        if (Math.random() < 0.1) {
          Velocity.x[entity] = (Math.random() * 2 - 1) * 20
          Velocity.y[entity] = (Math.random() * 2 - 1) * 20
        } else {
          Velocity.x[entity] *= 0.95 // Slow down gradually
          Velocity.y[entity] *= 0.95
        }
        break
        
      case AI_STATE.CHASE:
        // Move towards target
        const targetEntity = AI.targetEntity[entity]
        if (targetEntity !== undefined && Position.x[targetEntity] !== undefined) {
          const dx = Position.x[targetEntity] - Position.x[entity]
          const dy = Position.y[targetEntity] - Position.y[entity]
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 0) {
            // Normalize and set velocity
            Velocity.x[entity] = (dx / distance) * 50 // Speed factor
            Velocity.y[entity] = (dy / distance) * 50
          }
        }
        break
        
      case AI_STATE.ATTACK:
        // Stop moving when attacking
        Velocity.x[entity] = 0
        Velocity.y[entity] = 0
        break
        
      case AI_STATE.FLEE:
        // Move away from target
        const fleeTarget = AI.targetEntity[entity]
        if (fleeTarget !== undefined && Position.x[fleeTarget] !== undefined) {
          const dx = Position.x[entity] - Position.x[fleeTarget]
          const dy = Position.y[entity] - Position.y[fleeTarget]
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 0) {
            // Normalize and set velocity (away from target)
            Velocity.x[entity] = (dx / distance) * 70 // Faster when fleeing
            Velocity.y[entity] = (dy / distance) * 70
          }
        }
        break
    }
  }
  
  return world
}

export const aiAttackSystem: System = (world) => {
  const entities = aiAttackQuery(world)
  
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    
    // Only process entities in attack state
    if (AI.state[entity] !== AI_STATE.ATTACK) continue
    
    // Attack logic is handled by the attack system
    // This system just ensures the AI is targeting correctly
    const targetEntity = AI.targetEntity[entity]
    
    if (targetEntity !== undefined && Position.x[targetEntity] !== undefined) {
      // Check if target is still in range
      const dx = Position.x[targetEntity] - Position.x[entity]
      const dy = Position.y[targetEntity] - Position.y[entity]
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > Attack.range[entity]) {
        // Target moved out of range, switch to chase
        AI.state[entity] = AI_STATE.CHASE
      }
    } else {
      // Target no longer exists, go back to idle
      AI.state[entity] = AI_STATE.IDLE
    }
  }
  
  return world
}
