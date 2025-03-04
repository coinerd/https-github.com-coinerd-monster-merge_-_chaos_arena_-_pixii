# Monster Merge: Chaos Arena Game Library

A TypeScript library for creating a monster merge game with ECS architecture using bitECS.

## Features

- Entity Component System (ECS) architecture using bitECS
- Complete game mechanics for a monster merge game
- Collision detection and resolution
- Combat system with attacks and health
- Monster merging mechanics
- AI behavior for enemy monsters
- Spawn system for generating new monsters
- Event system for game state changes
- Rendering-agnostic (can be used with any rendering system)

## Installation

```bash
npm install bitecs rxjs
```

## Usage

```typescript
import { createGame } from './lib'

// Create game instance with configuration
const game = createGame({
  arenaWidth: 800,
  arenaHeight: 600,
  baseSpawnInterval: 2,
  monsterTypes: 5,
  initialPlayerMonsters: 3
})

// Initialize game
game.init()

// Start game loop
game.start()

// Subscribe to game events
game.events$.subscribe(event => {
  console.log('Game event:', event)
})

// Get game state for rendering
const { world } = game.getState()

// Create a new player monster
game.createPlayerMonster(x, y, type, level)

// Move a player monster
game.movePlayerMonster(entityId, velocityX, velocityY)
```

## Architecture

The library uses an Entity Component System (ECS) architecture:

- **Entities**: Simple numeric IDs representing game objects
- **Components**: Data containers attached to entities
- **Systems**: Logic that processes entities with specific components

## Components

The library includes components for:

- Position and movement
- Health and combat
- Monster attributes
- Collision detection
- AI behavior
- Visual representation

## Systems

The game logic is divided into systems:

- Movement system
- Collision system
- Combat system
- Merge system
- AI system
- Spawn system

## Extending

You can extend the library by:

1. Creating new components
2. Adding new systems to the pipeline
3. Subscribing to events for custom behavior
4. Implementing your own rendering system

## Demo

A simple canvas-based demo is included to demonstrate the library's capabilities.
