import * as PIXI from 'pixi.js'
import { Subject } from 'rxjs'
import { GameWorld } from '../types'
import { 
  Position, 
  Sprite, 
  Monster, 
  Health, 
  Collider, 
  PlayerControlled 
} from '../components'
import { monsterQuery } from '../queries'
import { MonsterSpriteManager, MonsterType, MONSTER_NAMES } from './monster-sprites'

export interface RendererConfig {
  width: number
  height: number
  backgroundColor: number
  antialias: boolean
  resolution: number
  parentElement?: HTMLElement
}

export interface RenderEvent {
  type: string
  data: any
}

// Define interfaces for extended PIXI objects
interface ExtendedSprite extends PIXI.Sprite {
  vx?: number;
  vy?: number;
}

export class PixiRenderer {
  private app: PIXI.Application | null = null
  private world: GameWorld | null = null
  private entitySprites: Map<number, PIXI.Container> = new Map()
  private isInitialized: boolean = false
  private config: RendererConfig
  private spriteManager: MonsterSpriteManager | null = null
  
  // Observable for renderer events
  public events$ = new Subject<RenderEvent>()
  
  constructor(config: Partial<RendererConfig> = {}) {
    // Default configuration
    const defaultConfig: RendererConfig = {
      width: 800,
      height: 600,
      backgroundColor: 0x242424,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    }
    
    this.config = { ...defaultConfig, ...config }
    
    // Create PIXI Application with proper options
    try {
      this.app = new PIXI.Application({
        width: this.config.width,
        height: this.config.height,
        backgroundColor: this.config.backgroundColor,
        antialias: this.config.antialias,
        resolution: this.config.resolution,
        autoDensity: true,
        // Force Canvas renderer instead of WebGL to avoid issues
        forceCanvas: true
      })
      
      // Wait for the application to be ready before adding to DOM
      // This ensures the canvas is created
      setTimeout(() => {
        this.initializeRenderer()
      }, 100)
    } catch (error) {
      console.error('Failed to create PIXI Application:', error)
    }
  }
  
  /**
   * Initialize the renderer after creation
   */
  private initializeRenderer(): void {
    if (!this.app) {
      console.error('PIXI Application failed to initialize')
      return
    }
    
    try {
      // Add canvas to parent element or body
      if (this.config.parentElement && this.app.view) {
        this.config.parentElement.appendChild(this.app.view as HTMLCanvasElement)
      } else if (this.app.view) {
        document.body.appendChild(this.app.view as HTMLCanvasElement)
      }
      
      // Create sprite manager
      this.spriteManager = new MonsterSpriteManager(this.app)
      
      // Load monster textures
      this.spriteManager.loadTextures().then(() => {
        console.log('Monster textures loaded successfully')
      }).catch(error => {
        console.error('Failed to load monster textures:', error)
      })
      
      // Setup interaction
      this.setupInteraction()
      
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize renderer:', error)
    }
  }
  
  /**
   * Setup interaction events
   */
  private setupInteraction(): void {
    if (!this.app || !this.app.stage) {
      console.error('Cannot setup interaction: PIXI stage not available')
      return
    }
    
    try {
      // Make stage interactive
      this.app.stage.eventMode = 'static'
      this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.app.screen.width, this.app.screen.height)
      
      // Handle click/tap events
      this.app.stage.on('pointerdown', (event) => {
        const position = event.global
        
        this.events$.next({
          type: 'STAGE_CLICK',
          data: {
            x: position.x,
            y: position.y,
            originalEvent: event
          }
        })
      })
    } catch (error) {
      console.error('Failed to setup interaction:', error)
    }
  }
  
  /**
   * Connect to game world
   */
  public connectToWorld(world: GameWorld): void {
    this.world = world
    
    // Ensure the renderer is initialized before starting the render loop
    const checkAndStartRender = () => {
      if (this.isInitialized && this.app) {
        // Start render loop - use add instead of addOnce to keep rendering
        if (this.app.ticker) {
          this.app.ticker.add(this.render)
        } else {
          console.warn('PIXI ticker is not available. Using requestAnimationFrame fallback.')
          // Create a fallback render loop using requestAnimationFrame if ticker is not available
          const renderLoop = () => {
            this.render()
            requestAnimationFrame(renderLoop)
          }
          requestAnimationFrame(renderLoop)
        }
      } else {
        // If not initialized yet, check again in 100ms
        setTimeout(checkAndStartRender, 100)
      }
    }
    
    checkAndStartRender()
  }
  
  /**
   * Disconnect from game world
   */
  public disconnect(): void {
    if (this.app && this.app.ticker) {
      this.app.ticker.remove(this.render)
    }
    this.world = null
  }
  
  /**
   * Render function (called each frame)
   */
  private render = (): void => {
    if (!this.world || !this.app || !this.spriteManager) return
    
    // Get all monsters
    const monsters = monsterQuery(this.world)
    
    // Track existing entities to detect removed ones
    const existingEntities = new Set<number>()
    
    // Update or create sprites for each monster
    for (let i = 0; i < monsters.length; i++) {
      const entity = monsters[i]
      existingEntities.add(entity)
      
      // Get entity data
      const x = Position.x[entity]
      const y = Position.y[entity]
      const typeId = Sprite.typeId[entity]
      const monsterType = Monster.type[entity]
      const level = Monster.level[entity]
      const radius = Collider.radius[entity]
      const health = Health.current[entity]
      const maxHealth = Health.max[entity]
      const isPlayerControlled = this.world.playerEntities.includes(entity)
      
      // Get or create sprite container
      let container = this.entitySprites.get(entity)
      
      if (!container) {
        // Create new container for this entity
        container = new PIXI.Container()
        container.eventMode = 'static'
        container.cursor = 'pointer'
        
        // Add to stage and map
        this.app.stage.addChild(container)
        this.entitySprites.set(entity, container)
        
        // Add click handler
        container.on('pointerdown', (event) => {
          event.stopPropagation()
          this.events$.next({
            type: 'ENTITY_CLICK',
            data: {
              entity,
              x: event.global.x,
              y: event.global.y,
              originalEvent: event
            }
          })
        })
        
        // Get texture for this monster type
        const texture = this.spriteManager.getTexture(monsterType as MonsterType)
        
        if (!texture) {
          console.error(`Texture not found for monster type ${monsterType}`)
          continue
        }
        
        // Create sprite
        const sprite = new PIXI.Sprite(texture)
        sprite.anchor.set(0.5)
        sprite.name = 'monsterSprite'
        container.addChild(sprite)
        
        // Create border for player monsters
        const border = new PIXI.Graphics()
        border.name = 'border'
        container.addChild(border)
        
        // Create level text
        const levelText = new PIXI.Text(level.toString(), {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: 0xFFFFFF,
          align: 'center'
        })
        levelText.name = 'levelText'
        levelText.anchor.set(0.5)
        container.addChild(levelText)
        
        // Create monster name text
        const monsterName = MONSTER_NAMES[monsterType] || 'Monster'
        const nameText = new PIXI.Text(`${monsterName} Lv.${level}`, {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xFFFFFF,
          align: 'center'
        })
        nameText.name = 'nameText'
        nameText.anchor.set(0.5, 0)
        nameText.position.set(0, radius + 5)
        container.addChild(nameText)
        
        // Create health bar container
        const healthBar = new PIXI.Container()
        healthBar.name = 'healthBar'
        container.addChild(healthBar)
        
        // Health bar background
        const healthBg = new PIXI.Graphics()
        healthBg.name = 'healthBg'
        healthBar.addChild(healthBg)
        
        // Health bar fill
        const healthFill = new PIXI.Graphics()
        healthFill.name = 'healthFill'
        healthBar.addChild(healthFill)
      }
      
      // Update container position
      container.position.set(x, y)
      
      // Update sprite
      const sprite = container.getChildByName('monsterSprite') as PIXI.Sprite
      if (sprite) {
        // Update texture if needed
        const texture = this.spriteManager.getTexture(monsterType as MonsterType)
        if (texture && sprite.texture !== texture) {
          sprite.texture = texture
        }
        
        // Scale based on radius
        sprite.scale.set(radius / 50) // Scale based on radius (texture is 50px radius)
      }
      
      // Update border for player monsters
      const border = container.getChildByName('border') as PIXI.Graphics
      if (border) {
        border.clear()
        if (isPlayerControlled) {
          border.lineStyle(2, 0xFFFFFF)
          border.drawCircle(0, 0, radius)
        }
      }
      
      // Update level text
      const levelText = container.getChildByName('levelText') as PIXI.Text
      if (levelText) {
        levelText.text = level.toString()
      }
      
      // Update name text
      const nameText = container.getChildByName('nameText') as PIXI.Text
      if (nameText) {
        const monsterName = MONSTER_NAMES[monsterType] || 'Monster'
        nameText.text = `${monsterName} Lv.${level}`
        nameText.position.set(0, radius + 5)
      }
      
      // Update health bar
      const healthBar = container.getChildByName('healthBar') as PIXI.Container
      if (healthBar) {
        const healthBg = healthBar.getChildByName('healthBg') as PIXI.Graphics
        const healthFill = healthBar.getChildByName('healthFill') as PIXI.Graphics
        
        const healthWidth = radius * 2
        const healthHeight = 6
        const healthX = -radius
        const healthY = -radius - 10
        
        healthBar.position.set(0, 0)
        
        // Health bar background
        healthBg.clear()
        healthBg.beginFill(0x333333)
        healthBg.drawRect(healthX, healthY, healthWidth, healthHeight)
        healthBg.endFill()
        
        // Health bar fill
        healthFill.clear()
        const healthFillWidth = (health / maxHealth) * healthWidth
        let healthColor = 0x33FF57 // Green
        if (health <= maxHealth * 0.2) {
          healthColor = 0xFF5733 // Red
        } else if (health <= maxHealth * 0.5) {
          healthColor = 0xF3FF33 // Yellow
        }
        
        healthFill.beginFill(healthColor)
        healthFill.drawRect(healthX, healthY, healthFillWidth, healthHeight)
        healthFill.endFill()
      }
    }
    
    // Remove sprites for entities that no longer exist
    this.entitySprites.forEach((sprite, entity) => {
      if (!existingEntities.has(entity)) {
        if (this.app && this.app.stage) {
          this.app.stage.removeChild(sprite)
          sprite.destroy({ children: true })
          this.entitySprites.delete(entity)
        }
      }
    })
  }
  
  /**
   * Get canvas element
   */
  public getView(): HTMLCanvasElement | null {
    // Safely return the view, or null if not available
    if (!this.app) return null
    
    try {
      return this.app.view as HTMLCanvasElement || null
    } catch (error) {
      console.error('Failed to get canvas view:', error)
      return null
    }
  }
  
  /**
   * Resize renderer
   */
  public resize(width: number, height: number): void {
    if (!this.app || !this.app.renderer) {
      console.error('Cannot resize: PIXI renderer not available')
      return
    }
    
    try {
      this.app.renderer.resize(width, height)
      
      // Update stage hit area
      if (this.app.stage) {
        this.app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height)
      }
    } catch (error) {
      console.error('Failed to resize renderer:', error)
    }
  }
  
  /**
   * Destroy renderer
   */
  public destroy(): void {
    if (!this.app) return
    
    try {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true })
      this.app = null
    } catch (error) {
      console.error('Failed to destroy renderer:', error)
    }
  }
}
