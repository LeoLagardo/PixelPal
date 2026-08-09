import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Pixel heart color data: 15x15 grid
// null = transparent, string = hex color
const HEART_PIXELS: (string | null)[][] = [
  [null, null, null, "#2b0000", "#2a0000", null, null, null, null, null, "#2a0000", "#2b0000", null, null, null],
  [null, "#2a0000", "#540000", "#800000", "#800000", "#550000", "#540000", null, "#540000", "#540000", "#800000", "#800000", "#540000", "#2a0000", null],
  [null, "#540000", "#d30000", "#fe0000", "#fe0000", "#d30000", "#d30000", "#540000", "#d30000", "#d30000", "#fe0000", "#fe0000", "#d30000", "#540000", null],
  ["#2a0000", "#800000", "#fe0000", "#fe2929", "#fe2929", "#fe0000", "#fe0000", "#800000", "#fe0000", "#fe0000", "#fe2929", "#fe2929", "#fe0000", "#800000", "#2a0000"],
  ["#2b0000", "#800000", "#fe0000", "#fe2929", "#fe8080", "#fe5454", "#fe5454", "#fe0000", "#fe5454", "#fe5454", "#fe8080", "#fe2929", "#fe0000", "#800000", "#2a0000"],
  ["#2a0000", "#800000", "#fe0000", "#fe2929", "#fe8080", "#fe8080", "#fe8080", "#fe5454", "#fe8080", "#fe8080", "#fe8080", "#fe2929", "#fe0000", "#800000", "#2b0000"],
  [null, "#540000", "#d30000", "#fe0000", "#fe5454", "#fe8080", "#fea9a9", "#fe8080", "#fea9a9", "#fe8080", "#fe5454", "#fe0000", "#d30000", "#540000", null],
  [null, "#540000", "#d30000", "#fe0000", "#fe5454", "#fe8080", "#fea9a9", "#fea9a9", "#fea9a9", "#fe8080", "#fe5454", "#fe0000", "#d30000", "#540000", null],
  [null, null, "#540000", "#800000", "#fe0000", "#fe5454", "#fe8080", "#fea9a9", "#fe8080", "#fe5454", "#fe0000", "#800000", "#540000", null, null],
  [null, null, "#540000", "#800000", "#fe0000", "#fe5454", "#fe8080", "#fea9a9", "#fe8080", "#fe5555", "#fe0000", "#800000", "#540000", null, null],
  [null, null, null, "#2a0000", "#800000", "#fe0000", "#fe2929", "#fe8080", "#fe2929", "#fe0000", "#800000", "#2a0000", null, null, null],
  [null, null, null, null, "#2b0000", "#800000", "#d30000", "#fe2a2a", "#d30000", "#800000", "#2a0000", null, null, null, null],
  [null, null, null, null, null, "#540000", "#800000", "#fe0000", "#800000", "#540000", null, null, null, null, null],
  [null, null, null, null, null, null, "#2a0000", "#800000", "#2a0000", null, null, null, null, null, null],
  [null, null, null, null, null, null, null, "#2a0000", null, null, null, null, null, null, null],
];

const CENTER_ROW = 7;
const CENTER_COL = 7;

@Component({
  selector: 'app-pixel-heart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heart-container">
      <!-- Background particles -->
      <div class="particle-field">
        <div *ngFor="let p of particles" class="particle" [style.--px]="p.x + '%'" [style.--py]="p.y + '%'" [style.--delay]="p.delay + 's'" [style.--duration]="p.duration + 's'"></div>
      </div>
      
      <!-- Scanlines overlay -->
      <div class="scanlines"></div>
      
      <!-- LED Grid Background -->
      <div class="led-grid"></div>

      <div class="heart-wrapper">
        <!-- Glow layers behind heart -->
        <div class="glow-layer glow-1"></div>
        <div class="glow-layer glow-2"></div>
        <div class="glow-layer glow-3"></div>
        
        <!-- The pixel heart -->
        <div class="pixel-heart">
          <div *ngFor="let row of pixelRows; let r = index" class="pixel-row">
            <div *ngFor="let pixel of row; let c = index"
                 class="pixel"
                 [class.active]="pixel !== null"
                 [style.--base-color]="pixel"
                 [style.--anim-delay]="getAnimDelay(r, c) + 's'"
                 [style.--anim-duration]="getAnimDuration(r, c) + 's'"
                 [style.--glow-color]="getGlowColor(r, c)">
            </div>
          </div>
        </div>
        
        <!-- Floating pixel fragments that emanate from heart -->
        <div class="fragments-container">
          <div *ngFor="let f of fragments" class="fragment" [style.--fx]="f.x + 'px'" [style.--fy]="f.y + 'px'" [style.--fdelay]="f.delay + 's'" [style.--fcolor]="f.color"></div>
        </div>
      </div>
      
      <!-- Bottom text -->
      <div class="heart-text">
        <span class="pulse-text">PIXEL HEART</span>
      </div>
    </div>
  `,
  styles: [`
    .heart-container {
      width: 100%;
      height: 100%;
      background: #050505;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      position: relative;
      overflow: hidden;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }

    /* LED Grid Background */
    .led-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(30, 0, 0, 0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(30, 0, 0, 0.15) 1px, transparent 1px);
      background-size: 12px 12px;
      pointer-events: none;
      z-index: 1;
    }

    /* CRT Scanlines */
    .scanlines {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(255,255,255,0),
        rgba(255,255,255,0) 50%,
        rgba(0,0,0,0.25) 50%,
        rgba(0,0,0,0.25)
      );
      background-size: 100% 4px;
      pointer-events: none;
      z-index: 20;
      animation: scanlineMove 8s linear infinite;
    }

    @keyframes scanlineMove {
      0% { transform: translateY(0); }
      100% { transform: translateY(4px); }
    }

    /* Background particles */
    .particle-field {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      left: var(--px);
      top: var(--py);
      width: 2px;
      height: 2px;
      background: #ff3333;
      opacity: 0;
      animation: particleFloat var(--duration) ease-in-out var(--delay) infinite;
    }

    @keyframes particleFloat {
      0% { opacity: 0; transform: translateY(0) scale(0); }
      20% { opacity: 0.6; }
      50% { opacity: 0.3; transform: translateY(-30px) scale(1); }
      80% { opacity: 0.1; }
      100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
    }

    /* Heart wrapper */
    .heart-wrapper {
      position: relative;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Glow layers */
    .glow-layer {
      position: absolute;
      width: 240px;
      height: 240px;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0;
      animation: glowPulse 2s ease-in-out infinite;
    }

    .glow-1 {
      background: radial-gradient(circle, rgba(255, 0, 0, 0.4) 0%, transparent 70%);
      animation-delay: 0s;
      width: 300px;
      height: 300px;
    }

    .glow-2 {
      background: radial-gradient(circle, rgba(255, 50, 50, 0.3) 0%, transparent 60%);
      animation-delay: 0.3s;
      width: 220px;
      height: 220px;
    }

    .glow-3 {
      background: radial-gradient(circle, rgba(255, 100, 100, 0.2) 0%, transparent 50%);
      animation-delay: 0.6s;
      width: 160px;
      height: 160px;
    }

    @keyframes glowPulse {
      0%, 100% { opacity: 0.3; transform: scale(0.9); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }

    /* Pixel Heart */
    .pixel-heart {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 20px;
      position: relative;
      z-index: 10;
      transform-origin: center;
      animation: heartBeat 1.5s ease-in-out infinite;
    }

    @keyframes heartBeat {
      0%, 100% { transform: scale(1); }
      14% { transform: scale(1.08); }
      28% { transform: scale(1); }
      42% { transform: scale(1.05); }
      70% { transform: scale(1); }
    }

    .pixel-row {
      display: flex;
      gap: 2px;
    }

    .pixel {
      width: 14px;
      height: 14px;
      background: transparent;
      position: relative;
    }

    .pixel.active {
      background: var(--base-color);
      animation: 
        colorFlow var(--anim-duration) ease-in-out var(--anim-delay) infinite,
        pixelGlow var(--anim-duration) ease-in-out var(--anim-delay) infinite;
      box-shadow: 
        0 0 4px var(--glow-color),
        0 0 8px var(--glow-color),
        0 0 16px rgba(255, 0, 0, 0.3);
    }

    /* Color flow: center to outward */
    @keyframes colorFlow {
      0% { 
        background: var(--base-color);
        filter: brightness(1);
      }
      25% { 
        background: #ff5555;
        filter: brightness(1.4);
      }
      50% { 
        background: #ff8888;
        filter: brightness(1.8);
      }
      75% { 
        background: #ff5555;
        filter: brightness(1.4);
      }
      100% { 
        background: var(--base-color);
        filter: brightness(1);
      }
    }

    @keyframes pixelGlow {
      0%, 100% { 
        box-shadow: 
          0 0 4px var(--glow-color),
          0 0 8px var(--glow-color),
          0 0 16px rgba(255, 0, 0, 0.2);
      }
      50% { 
        box-shadow: 
          0 0 6px var(--glow-color),
          0 0 12px var(--glow-color),
          0 0 24px rgba(255, 50, 50, 0.5),
          0 0 40px rgba(255, 0, 0, 0.2);
      }
    }

    /* Fragments that flow outward */
    .fragments-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 15;
    }

    .fragment {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 4px;
      height: 4px;
      background: var(--fcolor);
      opacity: 0;
      animation: fragmentFlow 3s ease-out var(--fdelay) infinite;
      box-shadow: 0 0 6px var(--fcolor);
    }

    @keyframes fragmentFlow {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) translate(0, 0) scale(1);
      }
      10% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) translate(var(--fx), var(--fy)) scale(0.2);
      }
    }

    /* Bottom text */
    .heart-text {
      position: relative;
      z-index: 10;
      margin-top: 40px;
    }

    .pulse-text {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #ff3333;
      letter-spacing: 8px;
      text-transform: uppercase;
      text-shadow: 
        0 0 10px rgba(255, 51, 51, 0.8),
        0 0 20px rgba(255, 51, 51, 0.4);
      animation: textPulse 2s ease-in-out infinite;
    }

    @keyframes textPulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; text-shadow: 0 0 15px rgba(255, 51, 51, 1), 0 0 30px rgba(255, 51, 51, 0.6); }
    }

    /* Pixelated text rendering */
    * {
      -webkit-font-smoothing: none;
      -moz-osx-font-smoothing: unset;
      text-rendering: geometricPrecision;
    }
  `]
})
export class PixelHeartComponent implements OnInit, OnDestroy {
  public pixelRows: (string | null)[][] = HEART_PIXELS;
  
  // Background particles
  public particles: { x: number; y: number; delay: number; duration: number }[] = [];
  
  // Fragments that emanate from heart
  public fragments: { x: number; y: number; delay: number; color: string }[] = [];
  
  private timerId: any = null;

  ngOnInit() {
    this.generateParticles();
    this.generateFragments();
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private generateParticles() {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4
      });
    }
  }

  private generateFragments() {
    const fragmentColors = ['#ff0000', '#ff3333', '#ff6666', '#ff9999', '#ffaaaa', '#d30000'];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 120;
      this.fragments.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        delay: Math.random() * 3,
        color: fragmentColors[Math.floor(Math.random() * fragmentColors.length)]
      });
    }
  }

  // Calculate animation delay based on distance from center
  // Pixels closer to center animate first (flow outward)
  getAnimDelay(row: number, col: number): number {
    const dist = Math.sqrt(Math.pow(row - CENTER_ROW, 2) + Math.pow(col - CENTER_COL, 2));
    return dist * 0.15;
  }

  getAnimDuration(row: number, col: number): number {
    const dist = Math.sqrt(Math.pow(row - CENTER_ROW, 2) + Math.pow(col - CENTER_COL, 2));
    return 2 + dist * 0.1;
  }

  getGlowColor(row: number, col: number): string {
    const dist = Math.sqrt(Math.pow(row - CENTER_ROW, 2) + Math.pow(col - CENTER_COL, 2));
    const maxDist = Math.sqrt(Math.pow(7, 2) + Math.pow(7, 2));
    const ratio = dist / maxDist;
    
    if (ratio < 0.2) return '#ffaaaa';
    if (ratio < 0.4) return '#ff8888';
    if (ratio < 0.6) return '#ff5555';
    if (ratio < 0.8) return '#ff0000';
    return '#aa0000';
  }
}