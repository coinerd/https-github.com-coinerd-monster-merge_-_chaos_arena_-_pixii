import * as PIXI from 'pixi.js'

interface ExtendedSprite extends PIXI.Sprite {
  vx?: number;
  vy?: number;
}

export class EffectsFactory {
  private app: PIXI.Application;
  
  constructor(app: PIXI.Application) {
    this.app = app;
  }
  
  /**
   * Create merge effect
   */
  public createMergeEffect(x: number, y: number, color: number = 0xFFFFFF): void {
    // Check if app and renderer are initialized
    if (!this.app || !this.app.renderer) {
      console.error('PIXI Application or renderer not initialized');
      return;
    }
    
    // Create particles
    const particles = new PIXI.ParticleContainer(100, {
      position: true,
      rotation: true,
      uvs: true,
      alpha: true
    });
    
    particles.position.set(x, y);
    this.app.stage.addChild(particles);
    
    // Create particle graphics and texture
    let particleTexture: PIXI.Texture;
    
    try {
      // Create particle graphics
      const particleGraphics = new PIXI.Graphics();
      particleGraphics.beginFill(color);
      particleGraphics.drawCircle(0, 0, 5);
      particleGraphics.endFill();
      
      // Generate texture safely
      particleTexture = this.app.renderer.generateTexture(particleGraphics);
    } catch (error) {
      console.error('Failed to generate particle texture:', error);
      // Create a fallback texture - 1x1 white pixel
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1, 1);
      }
      particleTexture = PIXI.Texture.from(canvas);
      
      // Clean up particles since we had an error
      this.app.stage.removeChild(particles);
      particles.destroy();
      return;
    }
    
    // Create particles
    const particleCount = 20;
    const particleSprites: ExtendedSprite[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Sprite(particleTexture) as ExtendedSprite;
      particle.anchor.set(0.5);
      particle.alpha = 1;
      particle.scale.set(0.5 + Math.random() * 0.5);
      
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      // Store velocity in sprite
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      
      particles.addChild(particle);
      particleSprites.push(particle);
    }
    
    // Animate particles
    let elapsed = 0;
    const tick = (delta: number) => {
      elapsed += delta;
      
      for (let i = 0; i < particleSprites.length; i++) {
        const particle = particleSprites[i];
        
        // Move particle
        if (particle.vx !== undefined && particle.vy !== undefined) {
          particle.position.x += particle.vx;
          particle.position.y += particle.vy;
        }
        
        // Fade out
        particle.alpha -= 0.01 * delta;
        
        // Remove if faded out
        if (particle.alpha <= 0) {
          particles.removeChild(particle);
          particleSprites.splice(i, 1);
          i--;
        }
      }
      
      // Remove ticker when all particles are gone
      if (particleSprites.length === 0) {
        this.app.ticker.remove(tick);
        particles.destroy();
      }
    };
    
    // Safely add ticker
    if (this.app.ticker) {
      this.app.ticker.add(tick);
    }
  }
  
  /**
   * Create spawn effect
   */
  public createSpawnEffect(x: number, y: number, color: number = 0xFFFFFF): void {
    // Check if app is initialized
    if (!this.app || !this.app.stage) {
      console.error('PIXI Application or stage not initialized');
      return;
    }
    
    // Create circle that expands and fades
    const circle = new PIXI.Graphics();
    circle.beginFill(color);
    circle.drawCircle(0, 0, 10);
    circle.endFill();
    circle.position.set(x, y);
    circle.alpha = 0.8;
    
    this.app.stage.addChild(circle);
    
    // Animate circle
    let elapsed = 0;
    const tick = (delta: number) => {
      elapsed += delta;
      
      // Expand circle
      circle.scale.set(circle.scale.x + 0.05 * delta);
      
      // Fade out
      circle.alpha -= 0.02 * delta;
      
      // Remove when faded out
      if (circle.alpha <= 0) {
        this.app.ticker.remove(tick);
        this.app.stage.removeChild(circle);
        circle.destroy();
      }
    };
    
    // Safely add ticker
    if (this.app.ticker) {
      this.app.ticker.add(tick);
    }
  }
  
  /**
   * Create damage effect
   */
  public createDamageEffect(x: number, y: number, damage: number): void {
    // Check if app is initialized
    if (!this.app || !this.app.stage) {
      console.error('PIXI Application or stage not initialized');
      return;
    }
    
    // Create text that floats up and fades
    const text = new PIXI.Text(damage.toString(), {
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xFF0000
    });
    
    text.anchor.set(0.5);
    text.position.set(x, y);
    
    this.app.stage.addChild(text);
    
    // Animate text
    let elapsed = 0;
    const tick = (delta: number) => {
      elapsed += delta;
      
      // Float up
      text.position.y -= 1 * delta;
      
      // Fade out
      text.alpha -= 0.02 * delta;
      
      // Remove when faded out
      if (text.alpha <= 0) {
        this.app.ticker.remove(tick);
        this.app.stage.removeChild(text);
        text.destroy();
      }
    };
    
    // Safely add ticker
    if (this.app.ticker) {
      this.app.ticker.add(tick);
    }
  }
}
