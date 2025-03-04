import * as PIXI from 'pixi.js'

// Monster type constants
export enum MonsterType {
  FIRE = 0,
  WATER = 1,
  EARTH = 2,
  AIR = 3
}

// Monster names
export const MONSTER_NAMES = [
  'Ember',    // Fire level 1
  'Aqua',     // Water level 1
  'Pebble',   // Earth level 1
  'Breeze'    // Air level 1
]

// SVG paths for each monster type
const SVG_PATHS = {
  [MonsterType.FIRE]: '/monsters/fire.svg',
  [MonsterType.WATER]: '/monsters/water.svg',
  [MonsterType.EARTH]: '/monsters/earth.svg',
  [MonsterType.AIR]: '/monsters/air.svg'
}

// Monster colors for fallback rendering
export const MONSTER_COLORS = {
  [MonsterType.FIRE]: 0xef5350,   // Red
  [MonsterType.WATER]: 0x42a5f5,  // Blue
  [MonsterType.EARTH]: 0x8d6e63,  // Brown
  [MonsterType.AIR]: 0xb3e5fc     // Light blue
}

// Class to manage monster sprites
export class MonsterSpriteManager {
  private textures: Map<string, PIXI.Texture> = new Map()
  private fallbackTextures: Map<string, PIXI.Texture> = new Map()
  private isLoaded: boolean = false
  private app: PIXI.Application
  
  constructor(app: PIXI.Application) {
    this.app = app
    this.generateFallbackTextures()
  }
  
  /**
   * Load all monster SVG textures
   */
  public async loadTextures(): Promise<void> {
    try {
      // Load all SVG textures
      const promises = Object.entries(SVG_PATHS).map(async ([typeStr, path]) => {
        const type = parseInt(typeStr)
        const key = `monster_${type}`
        
        try {
          // Load SVG as texture
          const texture = await PIXI.Assets.load(path)
          this.textures.set(key, texture)
          console.log(`Loaded texture for monster type ${type}`)
        } catch (error) {
          console.error(`Failed to load SVG for monster type ${type}:`, error)
          // Use fallback texture
          const fallbackTexture = this.fallbackTextures.get(key)
          if (fallbackTexture) {
            this.textures.set(key, fallbackTexture)
            console.log(`Using fallback texture for monster type ${type}`)
          }
        }
      })
      
      await Promise.all(promises)
      this.isLoaded = true
      console.log('All monster textures loaded')
    } catch (error) {
      console.error('Error loading monster textures:', error)
      // Use all fallback textures
      this.useFallbackTextures()
    }
  }
  
  /**
   * Generate fallback textures for each monster type
   */
  private generateFallbackTextures(): void {
    if (!this.app || !this.app.renderer) {
      console.error('Cannot generate fallback textures: PIXI renderer not available')
      return
    }
    
    try {
      // Create circle textures for each monster type
      Object.values(MonsterType).forEach(type => {
        if (typeof type === 'number') {
          const graphics = new PIXI.Graphics()
          graphics.beginFill(MONSTER_COLORS[type])
          graphics.drawCircle(0, 0, 50) // Base size, will be scaled
          graphics.endFill()
          
          // Add eyes
          graphics.beginFill(0xFFFFFF)
          graphics.drawCircle(-15, -15, 10)
          graphics.drawCircle(15, -15, 10)
          graphics.endFill()
          
          graphics.beginFill(0x000000)
          graphics.drawCircle(-15, -15, 5)
          graphics.drawCircle(15, -15, 5)
          graphics.endFill()
          
          // Add mouth
          graphics.lineStyle(2, 0x000000)
          graphics.moveTo(-10, 10)
          graphics.quadraticCurveTo(0, 20, 10, 10)
          
          try {
            const texture = this.app.renderer.generateTexture(graphics)
            this.fallbackTextures.set(`monster_${type}`, texture)
          } catch (error) {
            console.error(`Failed to generate fallback texture for monster type ${type}:`, error)
          }
        }
      })
    } catch (error) {
      console.error('Failed to generate fallback textures:', error)
    }
  }
  
  /**
   * Use fallback textures for all monster types
   */
  private useFallbackTextures(): void {
    this.fallbackTextures.forEach((texture, key) => {
      this.textures.set(key, texture)
    })
    this.isLoaded = true
  }
  
  /**
   * Get texture for a monster type
   */
  public getTexture(type: MonsterType): PIXI.Texture | null {
    const key = `monster_${type}`
    
    // If textures aren't loaded yet, use fallback
    if (!this.isLoaded) {
      return this.fallbackTextures.get(key) || null
    }
    
    return this.textures.get(key) || this.fallbackTextures.get(key) || null
  }
  
  /**
   * Check if textures are loaded
   */
  public areTexturesLoaded(): boolean {
    return this.isLoaded
  }
}
