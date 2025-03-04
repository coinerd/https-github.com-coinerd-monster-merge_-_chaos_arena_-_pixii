import { createWorld, addEntity, addComponent, IWorld } from 'bitecs'
import { Subject } from 'rxjs'
import { 
  Position, 
  Velocity, 
  Health, 
  Monster, 
  PlayerControlled, 
  Sprite 
} from './components'
import { 
  movementSystem, 
  collisionSystem, 
  attackSystem, 
  healthSystem, 
  knockbackSystem,
  mergeSystem, 
  aiSystem, 
  spawnSystem 
} from './systems'
import { GameWorld, GameConfig, GameEvent, System } from './types'
import { createPlayerMonster } from './systems/spawn'
import { MonsterType } from './rendering/monster-sprites'

// Default game configuration
const DEFAULT_CONFIG: GameConfig = {
  arenaWidth: 800,
  arenaHeight: 600,
  baseSpawnInterval: 3,
  monsterTypes: 4,
  maxLevel: 10,
  initialPlayerMonsters: 1
}

export class Game {
  private world: GameWorld
  private running: boolean = false
  private lastTime: number = 0
  private systems: System[] = []
  public events$ = new Subject<GameEvent>()
  
  constructor(config: Partial<GameConfig> = {}) {
    // Create world with merged config
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }
    
    this.world = createWorld() as GameWorld
    this.world.time = 0
    this.world.delta = 0
    this.world.config = mergedConfig
    this.world.events = []
    this.world.deadEntities = []
    this.world.entitiesToRemove = []
    this.world.playerEntities = []
    this.world.spawnTimer = mergedConfig.baseSpawnInterval
    
    // Add systems
    this.systems = [
      movementSystem,
      aiSystem,
      attackSystem,
      knockbackSystem,
      collisionSystem,
      healthSystem,
      mergeSystem,
      spawnSystem
    ]
    
    // Initialize with player monsters
    this.initializePlayerMonsters()
  }
  
  /**
   * Initialize player monsters
   */
  private initializePlayerMonsters(): void {
    const { initialPlayerMonsters, arenaWidth, arenaHeight } = this.world.config
    
    // Create initial player monsters
    for (let i = 0; i < initialPlayerMonsters; i++) {
      // Position in center area
      const x = arenaWidth / 2 + (Math.random() * 200 - 100)
      const y = arenaHeight / 2 + (Math.random() * 200 - 100)
      
      // Random monster type
      const type = Math.floor(Math.random() * this.world.config.monsterTypes) as MonsterType
      
      // Create monster
      createPlayerMonster(this.world, x, y, type, 1)
    }
  }
  
  /**
   * Start game loop
   */
  public start(): void {
    if (this.running) return
    
    this.running = true
    this.lastTime = performance.now()
    requestAnimationFrame(this.update)
  }
  
  /**
   * Stop game loop
   */
  public stop(): void {
    this.running = false
  }
  
  /**
   * Game update loop
   */
  private update = (time: number): void => {
    if (!this.running) return
    
    // Calculate delta time in seconds
    const delta = (time - this.lastTime) / 1000
    this.lastTime = time
    
    // Update world time
    this.world.time += delta
    this.world.delta = Math.min(delta, 0.1) // Cap delta time to prevent large jumps
    
    // Run all systems
    for (const system of this.systems) {
      system(this.world)
    }
    
    // Process events
    while (this.world.events.length > 0) {
      const event = this.world.events.shift()
      if (event) {
        this.events$.next(event)
      }
    }
    
    // Continue loop
    requestAnimationFrame(this.update)
  }
  
  /**
   * Move a player monster
   */
  public movePlayerMonster(entity: number, vx: number, vy: number): void {
    // Ensure entity exists and is a player monster
    if (this.world.playerEntities.includes(entity)) {
      Velocity.x[entity] = vx
      Velocity.y[entity] = vy
    }
  }
  
  /**
   * Create a new player monster
   */
  public createPlayerMonster(x: number, y: number, type: MonsterType): number {
    return createPlayerMonster(this.world, x, y, type, 1)
  }
  
  /**
   * Get current world state
   */
  public getWorld(): GameWorld {
    return this.world
  }
}

/**
 * Create a new game instance
 */
export function createGame(config: Partial<GameConfig> = {}): Game {
  return new Game(config)
}
