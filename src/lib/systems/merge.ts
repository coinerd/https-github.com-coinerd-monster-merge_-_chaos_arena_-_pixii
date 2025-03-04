import { System } from '../types'
import { mergeableOverlapQuery } from '../queries'
import { Monster, Mergeable, Overlap, Health, Attack, Defense, Position, Collider } from '../components'
import { removeEntity } from 'bitecs'

export const mergeSystem: System = (world) => {
  const entities = mergeableOverlapQuery(world)
  
  // Track processed entities to avoid double merging
  const processed = new Set<number>()
  
  // Initialize entitiesToRemove array if it doesn't exist
  if (!world.entitiesToRemove) {
    world.entitiesToRemove = []
  }
  
  for (let i = 0; i < entities.length; i++) {
    const entityA = entities[i]
    
    // Skip if already processed
    if (processed.has(entityA)) continue
    
    const entityB = Overlap.entity[entityA]
    
    // Skip if the other entity is already processed
    if (processed.has(entityB)) continue
    
    // Check if both entities are mergeable and of the same type and level
    if (Mergeable.canMerge[entityA] === 1 && 
        Mergeable.canMerge[entityB] === 1 && 
        Monster.type[entityA] === Monster.type[entityB] &&
        Monster.level[entityA] === Monster.level[entityB]) {
      
      // Perform merge: upgrade one entity, remove the other
      const survivingEntity = entityA
      const removedEntity = entityB
      
      // Increase monster level
      Monster.level[survivingEntity] += 1
      
      // Enhance stats based on level increase
      Health.max[survivingEntity] = Math.floor(Health.max[survivingEntity] * 1.5)
      Health.current[survivingEntity] = Health.max[survivingEntity]
      
      Attack.damage[survivingEntity] = Math.floor(Attack.damage[survivingEntity] * 1.3)
      
      if (Defense.value[survivingEntity] !== undefined) {
        Defense.value[survivingEntity] = Math.floor(Defense.value[survivingEntity] * 1.2)
      }
      
      // Increase size
      if (Collider.radius[survivingEntity] !== undefined) {
        Collider.radius[survivingEntity] *= 1.2
      }
      
      // Mark entities as processed
      processed.add(entityA)
      processed.add(entityB)
      
      // Add to removal queue
      world.entitiesToRemove.push(removedEntity)
      
      // Emit merge event for rendering/effects
      world.events.push({
        type: 'MONSTER_MERGED',
        data: {
          survivor: survivingEntity,
          removed: removedEntity,
          newLevel: Monster.level[survivingEntity],
          position: {
            x: Position.x[survivingEntity],
            y: Position.y[survivingEntity]
          }
        }
      })
    }
  }
  
  // Remove entities marked for removal
  while (world.entitiesToRemove.length > 0) {
    const entity = world.entitiesToRemove.pop()
    if (entity !== undefined) {
      removeEntity(world, entity)
    }
  }
  
  return world
}
