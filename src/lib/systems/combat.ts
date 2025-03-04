import { System } from '../types'
import { attackerQuery, damageableQuery, healthQuery, knockbackQuery } from '../queries'
import { Position, Attack, Health, Knockback, Velocity } from '../components'
import { addComponent, removeEntity, hasComponent } from 'bitecs'

export const attackSystem: System = (world) => {
  const attackers = attackerQuery(world)
  const targets = damageableQuery(world)
  const delta = world.delta
  
  // Update attack cooldowns
  for (let i = 0; i < attackers.length; i++) {
    const attacker = attackers[i]
    
    // Decrease cooldown timer
    if (Attack.timer[attacker] > 0) {
      Attack.timer[attacker] -= delta
    }
  }
  
  // Process attacks
  for (let i = 0; i < attackers.length; i++) {
    const attacker = attackers[i]
    
    // Skip if on cooldown
    if (Attack.timer[attacker] > 0) continue
    
    const attackerX = Position.x[attacker]
    const attackerY = Position.y[attacker]
    const attackRange = Attack.range[attacker]
    
    // Check for targets in range
    for (let j = 0; j < targets.length; j++) {
      const target = targets[j]
      
      // Skip self
      if (target === attacker) continue
      
      const targetX = Position.x[target]
      const targetY = Position.y[target]
      
      // Calculate distance
      const dx = targetX - attackerX
      const dy = targetY - attackerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // If target is in range, attack it
      if (distance <= attackRange) {
        // Apply damage
        const damage = Attack.damage[attacker]
        Health.current[target] -= damage
        
        // Apply knockback
        if (!hasComponent(world, Knockback, target)) {
          addComponent(world, Knockback, target)
        }
        
        Knockback.force[target] = damage * 10 // Knockback force proportional to damage
        Knockback.direction[target] = Math.atan2(dy, dx) // Direction of knockback
        Knockback.remaining[target] = 0.2 // Duration in seconds
        
        // Reset attack cooldown
        Attack.timer[attacker] = Attack.cooldown[attacker]
        
        // Emit damage event
        world.events.push({
          type: 'MONSTER_DAMAGED',
          data: {
            entity: target,
            attacker: attacker,
            damage: damage,
            position: { x: targetX, y: targetY }
          }
        })
        
        // Only attack one target per cooldown
        break
      }
    }
  }
  
  return world
}

export const knockbackSystem: System = (world) => {
  const entities = knockbackQuery(world)
  const delta = world.delta
  
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    
    // Update remaining time
    Knockback.remaining[entity] -= delta
    
    // Apply knockback force
    if (Knockback.remaining[entity] > 0) {
      const force = Knockback.force[entity]
      const direction = Knockback.direction[entity]
      
      // Calculate knockback velocity
      const knockbackVelocityX = Math.cos(direction) * force
      const knockbackVelocityY = Math.sin(direction) * force
      
      // Apply to position directly
      Position.x[entity] += knockbackVelocityX * delta
      Position.y[entity] += knockbackVelocityY * delta
      
      // Reduce force over time
      Knockback.force[entity] *= 0.9
    }
  }
  
  return world
}

export const healthSystem: System = (world) => {
  const entities = healthQuery(world)
  
  // Check for dead entities
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    
    // If health is depleted, mark for removal
    if (Health.current[entity] <= 0) {
      world.deadEntities.push(entity)
    }
  }
  
  // Remove dead entities
  while (world.deadEntities.length > 0) {
    const entity = world.deadEntities.pop()
    if (entity !== undefined) {
      removeEntity(world, entity)
    }
  }
  
  return world
}
