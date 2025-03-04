import './style.css'
import { createGame } from './lib'

// Create game instance
const game = createGame({
  arenaWidth: 800,
  arenaHeight: 600,
  baseSpawnInterval: 2,
  monsterTypes: 5,
  initialPlayerMonsters: 3
})

// Initialize game
game.init()

// Create canvas for rendering
const canvas = document.createElement('canvas')
canvas.width = 800
canvas.height = 600
document.querySelector<HTMLDivElement>('#app')!.innerHTML = ''
document.querySelector<HTMLDivElement>('#app')!.appendChild(canvas)

const ctx = canvas.getContext('2d')!

// Colors for different monster types
const monsterColors = [
  '#FF5733', // Red
  '#33FF57', // Green
  '#3357FF', // Blue
  '#F3FF33', // Yellow
  '#FF33F3'  // Purple
]

// Subscribe to game events
game.events$.subscribe(event => {
  console.log('Game event:', event)
  
  // Handle specific events
  switch (event.type) {
    case 'MONSTER_MERGED':
      // Could add visual effects here
      break
    case 'MONSTER_SPAWNED':
      // Could add spawn animation here
      break
  }
})

// Render function
function render() {
  if (!ctx) return
  
  // Clear canvas
  ctx.fillStyle = '#242424'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Get game state
  const { world } = game.getState()
  
  // Import components and queries
  const { Position, Monster, Collider, Health, PlayerControlled } = require('./lib/components')
  const { monsterQuery } = require('./lib/queries')
  
  // Get all monsters
  const monsters = monsterQuery(world)
  
  // Render each monster
  for (let i = 0; i < monsters.length; i++) {
    const entity = monsters[i]
    const x = Position.x[entity]
    const y = Position.y[entity]
    const type = Monster.type[entity]
    const level = Monster.level[entity]
    const radius = Collider.radius[entity]
    const health = Health.current[entity]
    const maxHealth = Health.max[entity]
    const isPlayer = PlayerControlled.isPlayer !== undefined ? PlayerControlled.isPlayer[entity] === 1 : false
    
    // Draw monster body
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = monsterColors[type % monsterColors.length]
    ctx.fill()
    
    // Draw border for player monsters
    if (world.playerEntities.includes(entity)) {
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // Draw level text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(level.toString(), x, y + 5)
    
    // Draw health bar
    const healthWidth = radius * 2
    const healthHeight = 6
    const healthX = x - radius
    const healthY = y - radius - 10
    
    // Health bar background
    ctx.fillStyle = '#333333'
    ctx.fillRect(healthX, healthY, healthWidth, healthHeight)
    
    // Health bar fill
    const healthFill = (health / maxHealth) * healthWidth
    ctx.fillStyle = health > maxHealth * 0.5 ? '#33FF57' : health > maxHealth * 0.2 ? '#F3FF33' : '#FF5733'
    ctx.fillRect(healthX, healthY, healthFill, healthHeight)
  }
  
  // Request next frame
  requestAnimationFrame(render)
}

// Handle player input
let selectedMonster: number | null = null

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  // Import components
  const { Position, Collider, PlayerControlled } = require('./lib/components')
  
  // Get player monsters
  const playerMonsters = game.getEntitiesWith(PlayerControlled)
  
  // Find clicked monster
  for (let i = 0; i < playerMonsters.length; i++) {
    const entity = playerMonsters[i]
    const x = Position.x[entity]
    const y = Position.y[entity]
    const radius = Collider.radius[entity]
    
    // Check if click is within monster
    const dx = mouseX - x
    const dy = mouseY - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance <= radius) {
      selectedMonster = entity
      return
    }
  }
  
  // If no monster clicked and one is selected, move it
  if (selectedMonster !== null) {
    // Calculate direction
    const entity = selectedMonster
    const x = Position.x[entity]
    const y = Position.y[entity]
    
    const dx = mouseX - x
    const dy = mouseY - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 0) {
      // Set velocity towards click
      const speed = 100
      game.movePlayerMonster(entity, (dx / distance) * speed, (dy / distance) * speed)
    }
    
    selectedMonster = null
  }
})

// Start game and rendering
game.start()
render()

// Add UI controls
const controls = document.createElement('div')
controls.className = 'controls'
controls.innerHTML = `
  <h2>Monster Merge: Chaos Arena</h2>
  <p>Click on a player monster (white border) to select it, then click elsewhere to move it.</p>
  <p>Merge monsters of the same type and level to create stronger monsters!</p>
  <button id="spawn-btn">Spawn New Monster</button>
`
document.querySelector<HTMLDivElement>('#app')!.appendChild(controls)

// Spawn button
document.getElementById('spawn-btn')?.addEventListener('click', () => {
  const x = Math.random() * 800
  const y = Math.random() * 600
  const type = Math.floor(Math.random() * 5)
  game.createPlayerMonster(x, y, type)
})
