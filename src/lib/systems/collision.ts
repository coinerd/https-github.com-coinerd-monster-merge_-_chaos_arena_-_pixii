import { System } from '../types'
import { colliderQuery, overlapQuery } from '../queries'
import { Position, Collider, Overlap } from '../components'
import { addComponent, removeComponent } from 'bitecs'

export const collisionSystem: System = (world) => {
  const entities = colliderQuery(world)
  
  // Clear previous overlaps
  const previousOverlaps = overlapQuery(world)
  for (let i = 0; i < previousOverlaps.length; i++) {
    removeComponent(world, Overlap, previousOverlaps[i])
  }
  
  // Check for new collisions
  for (let i = 0; i < entities.length; i++) {
    const entityA = entities[i]
    const posAx = Position.x[entityA]
    const posAy = Position.y[entityA]
    const radiusA = Collider.radius[entityA]
    
    for (let j = i + 1; j < entities.length; j++) {
      const entityB = entities[j]
      const posBx = Position.x[entityB]
      const posBy = Position.y[entityB]
      const radiusB = Collider.radius[entityB]
      
      // Calculate distance between entities
      const dx = posBx - posAx
      const dy = posBy - posAy
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Check if colliding
      if (distance < radiusA + radiusB) {
        // Add overlap component to both entities
        addComponent(world, Overlap, entityA)
        Overlap.entity[entityA] = entityB
        Overlap.duration[entityA] = 0
        
        addComponent(world, Overlap, entityB)
        Overlap.entity[entityB] = entityA
        Overlap.duration[entityB] = 0
        
        // If not triggers, resolve collision by pushing entities apart
        if (Collider.isTrigger[entityA] === 0 && Collider.isTrigger[entityB] === 0) {
          const overlap = (radiusA + radiusB) - distance
          const resolveX = dx / distance * overlap * 0.5
          const resolveY = dy / distance * overlap * 0.5
          
          Position.x[entityA] -= resolveX
          Position.y[entityA] -= resolveY
          Position.x[entityB] += resolveX
          Position.y[entityB] += resolveY
        }
      }
    }
  }
  
  return world
}
