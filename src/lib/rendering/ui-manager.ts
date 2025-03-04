import { Subject } from 'rxjs';

export interface UIEvent {
  type: string;
  data: any;
}

export interface GameStats {
  score: number;
  time: number;
}

export class UIManager {
  private container: HTMLElement;
  private uiContainer: HTMLElement | null = null;
  private statsElement: HTMLElement | null = null;
  private gameOverElement: HTMLElement | null = null;
  
  // Observable for UI events
  public events$ = new Subject<UIEvent>();
  
  constructor(container: HTMLElement) {
    this.container = container;
  }
  
  /**
   * Create UI elements
   */
  public createUI(): void {
    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'ui-container';
    this.container.appendChild(this.uiContainer);
    
    // Create stats display
    this.statsElement = document.createElement('div');
    this.statsElement.className = 'stats';
    this.statsElement.innerHTML = `
      <div class="score">Score: 0</div>
      <div class="time">Time: 0s</div>
    `;
    this.uiContainer.appendChild(this.statsElement);
    
    // Create control buttons
    const controlsElement = document.createElement('div');
    controlsElement.className = 'controls';
    
    // Spawn button
    const spawnButton = document.createElement('button');
    spawnButton.textContent = 'Spawn Monster';
    spawnButton.addEventListener('click', () => {
      this.events$.next({
        type: 'SPAWN_MONSTER',
        data: {}
      });
    });
    
    // Pause button
    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause';
    pauseButton.addEventListener('click', () => {
      this.events$.next({
        type: 'PAUSE_GAME',
        data: {}
      });
    });
    
    // Resume button
    const resumeButton = document.createElement('button');
    resumeButton.textContent = 'Resume';
    resumeButton.addEventListener('click', () => {
      this.events$.next({
        type: 'RESUME_GAME',
        data: {}
      });
    });
    
    // Add buttons to controls
    controlsElement.appendChild(spawnButton);
    controlsElement.appendChild(pauseButton);
    controlsElement.appendChild(resumeButton);
    
    // Add controls to UI
    this.uiContainer.appendChild(controlsElement);
    
    // Create game over screen (hidden initially)
    this.gameOverElement = document.createElement('div');
    this.gameOverElement.className = 'game-over';
    this.gameOverElement.style.display = 'none';
    this.gameOverElement.innerHTML = `
      <h2>Game Over</h2>
      <p>Your score: <span class="final-score">0</span></p>
      <button class="restart-button">Restart</button>
    `;
    
    // Add restart button event
    const restartButton = this.gameOverElement.querySelector('.restart-button');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        this.events$.next({
          type: 'RESTART_GAME',
          data: {}
        });
      });
    }
    
    // Add game over screen to container
    this.container.appendChild(this.gameOverElement);
    
    // Add CSS styles
    this.addStyles();
  }
  
  /**
   * Update UI with game stats
   */
  public updateUI(stats: GameStats): void {
    if (!this.statsElement) return;
    
    const scoreElement = this.statsElement.querySelector('.score');
    const timeElement = this.statsElement.querySelector('.time');
    
    if (scoreElement) {
      scoreElement.textContent = `Score: ${stats.score}`;
    }
    
    if (timeElement) {
      timeElement.textContent = `Time: ${Math.floor(stats.time)}s`;
    }
  }
  
  /**
   * Show game over screen
   */
  public showGameOver(score: number): void {
    if (!this.gameOverElement) return;
    
    const finalScoreElement = this.gameOverElement.querySelector('.final-score');
    if (finalScoreElement) {
      finalScoreElement.textContent = score.toString();
    }
    
    this.gameOverElement.style.display = 'flex';
  }
  
  /**
   * Hide game over screen
   */
  public hideGameOver(): void {
    if (!this.gameOverElement) return;
    this.gameOverElement.style.display = 'none';
  }
  
  /**
   * Add CSS styles for UI
   */
  private addStyles(): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .ui-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
      }
      
      .stats {
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
      }
      
      .controls {
        display: flex;
        gap: 10px;
        pointer-events: auto;
      }
      
      .controls button {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 8px 16px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 14px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 4px;
      }
      
      .game-over {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: Arial, sans-serif;
      }
      
      .game-over h2 {
        font-size: 32px;
        margin-bottom: 20px;
      }
      
      .game-over p {
        font-size: 20px;
        margin-bottom: 30px;
      }
      
      .restart-button {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 4px;
      }
    `;
    
    document.head.appendChild(styleElement);
  }
}
