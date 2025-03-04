import './style.css'
import * as PIXI from 'pixi.js'
import { createGame, createPlayerMonster } from './lib'
import { PixiRenderer } from './lib/rendering/pixi-renderer'
import { UIManager } from './lib/rendering/ui-manager'
import { EffectsFactory } from './lib/rendering/effects'
import { MonsterType } from './lib/rendering/monster-sprites'

// Create app container
const appContainer = document.querySelector<HTMLDivElement>('#app')!
appContainer.innerHTML = ''

// Create game container
const gameContainer = document.createElement('div')
gameContainer.className = 'game-container'
gameContainer.style.position = 'relative'
gameContainer.style.width = '800px'
gameContainer.style.height = '600px'
gameContainer.style.margin = '0 auto'
gameContainer.style.overflow = 'hidden'
appContainer.appendChild(gameContainer)

// Create game instance
const game = createGame({
  arenaWidth: 800,
  arenaHeight: 600,
  baseSpawnInterval: 2,
  monsterTypes: 4, // Updated to match our 4 monster types
  initialPlayerMonsters: 4 // One of each type
})

// Initialize game with specific monster types
const initGame = () => {
  // Get world from game instance
  const world = (game as any).world
  
  // Clear any existing player monsters
  world.playerEntities = []
  
  // Create Fire monster (Ember)
  createPlayerMonster(world, 300, 300, MonsterType.FIRE, 1)
  
  // Create Water monster (Aqua)
  createPlayerMonster(world, 500, 300, MonsterType.WATER, 1)
  
  // Create Earth monster (Pebble)
  createPlayerMonster(world, 300, 400, MonsterType.EARTH, 1)
  
  // Create Air monster (Breeze)
  createPlayerMonster(world, 500, 400, MonsterType.AIR, 1)
}

// Create UI manager after a short delay to ensure renderer is ready
setTimeout(() => {
  // Create UI manager
  const uiManager = new UIManager(gameContainer)
  uiManager.createUI()

  // Connect renderer to game world - ensure PIXI is fully initialized
  setTimeout(() => {
    renderer.connectToWorld((game as any).world)
    
    // Initialize game with our custom monsters
    initGame()
    
    // Wait a bit more before creating effects factory to ensure renderer is fully initialized
    setTimeout(() => {
      // Create effects factory - safely access app property
      const effectsFactory = new EffectsFactory(
        (renderer as any).app || new PIXI.Application()
      )
    
      // Track selected monster
      let selectedMonster: number | null = null
    
      // Handle renderer events
      renderer.events$.subscribe(event => {
        switch (event.type) {
          case 'ENTITY_CLICK':
            // Select monster
            selectedMonster = event.data.entity
            break
            
          case 'STAGE_CLICK':
            // If monster is selected, move it
            if (selectedMonster !== null) {
              const { x, y } = event.data
              
              // Get entity position from game components
              const world = (game as any).world
              const Position = world.components.Position
              const entityX = Position.x[selectedMonster]
              const entityY = Position.y[selectedMonster]
              
              // Calculate direction
              const dx = x - entityX
              const dy = y - entityY
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              if (distance > 0) {
                // Set velocity towards click
                const speed = 100
                game.movePlayerMonster(selectedMonster, (dx / distance) * speed, (dy / distance) * speed)
              }
              
              selectedMonster = null
            }
            break
        }
      })
    
      // Handle UI events
      uiManager.events$.subscribe(event => {
        switch (event.type) {
          case 'SPAWN_MONSTER':
            // Spawn a random monster type
            const x = Math.random() * 800
            const y = Math.random() * 600
            const type = Math.floor(Math.random() * 4) as MonsterType
            game.createPlayerMonster(x, y, type)
            break
            
          case 'PAUSE_GAME':
            game.stop()
            break
            
          case 'RESUME_GAME':
            game.start()
            break
            
          case 'RESTART_GAME':
            // Reset game
            game.stop()
            
            // Clear entities
            const world = (game as any).world
            world.deadEntities = []
            world.entitiesToRemove = []
            world.playerEntities = []
            
            // Reinitialize with our custom monsters
            initGame()
            game.start()
            
            // Hide game over screen
            uiManager.hideGameOver()
            break
        }
      })
    
      // Subscribe to game events
      game.events$.subscribe(event => {
        // Update UI with game state
        uiManager.updateUI({
          score: 0, // Replace with actual score
          time: (game as any).world.time
        })
        
        // Handle specific events
        switch (event.type) {
          case 'MONSTER_MERGED':
            // Add merge effect
            effectsFactory.createMergeEffect(
              event.data.position.x,
              event.data.position.y,
              0xFFFFFF // Use monster color here
            )
            break
            
          case 'MONSTER_SPAWNED':
            // Add spawn effect
            effectsFactory.createSpawnEffect(
              event.data.position.x,
              event.data.position.y,
              0xFFFFFF // Use monster color here
            )
            break
            
          case 'MONSTER_DAMAGED':
            // Add damage effect
            effectsFactory.createDamageEffect(
              event.data.position.x,
              event.data.position.y,
              event.data.damage
            )
            break
            
          case 'GAME_OVER':
            // Show game over screen
            uiManager.showGameOver(event.data.score || 0)
            break
        }
      })
    
      // Handle window resize
      window.addEventListener('resize', () => {
        // Get container size
        const width = Math.min(800, window.innerWidth - 40)
        const height = Math.min(600, window.innerHeight - 40)
        
        // Resize renderer
        renderer.resize(width, height)
      })
    
      // Start game
      game.start()
    }, 500) // Increased delay for effects factory initialization
  }, 500) // Increased delay to ensure PIXI is fully initialized
}, 200) // Increased delay to ensure renderer is initialized

// Create PixiJS renderer
const renderer = new PixiRenderer({
  width: 800,
  height: 600,
  backgroundColor: 0x242424,
  parentElement: gameContainer
})
