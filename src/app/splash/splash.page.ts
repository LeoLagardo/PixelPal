import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanionService } from '../services/companion.service';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  template: `
    <ion-content class="splash-screen" [fullscreen]="true">
      <!-- Background Cyber/Scanline Grid Overlays -->
      <div class="cyber-bg">
        <div class="ambient-glow"></div>
        <div class="scanlines"></div>
        <div class="grid-overlay"></div>
      </div>

      <div class="splash-container">
        <!-- Center Icon Deck Card -->
        <div class="deck-card">
          <div class="deck-grid">
            <!-- App / Grid Icon (Top-Left) -->
            <div class="deck-key key-grid">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="key-icon icon-cyan">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>

            <!-- Mic Icon - Active Purple Glow (Top-Right) -->
            <div class="deck-key key-mic key-active">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="key-icon icon-purple">
                <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" stroke-width="2"/>
                <path d="M5 10V11C5 14.866 8.13401 18 12 18C15.866 18 19 14.866 19 11V10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 18V21M9 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>

            <!-- Video / Camera Icon (Bottom-Left) -->
            <div class="deck-key key-video">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="key-icon icon-cyan-subtle">
                <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M15 10L20 7V17L15 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <!-- Speaker / Volume Icon (Bottom-Right) -->
            <div class="deck-key key-volume">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="key-icon icon-cyan-subtle">
                <path d="M4 14H7L12 18V6L7 10H4V14Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M16 9C16.8 9.8 17.5 10.8 17.5 12C17.5 13.2 16.8 14.2 16 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.5 6.5C20.2 8 21 9.9 21 12C21 14.1 20.2 16 18.5 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Brand Title & Tagline -->
        <div class="brand-section">
          <div class="brand-title-wrap">
            <h1 class="brand-title">PIXELPAL</h1>
            <span class="brand-dot"></span>
          </div>
          <p class="brand-subtitle">CONTROL YOUR WORLD.</p>
        </div>

        <!-- Glowing Neon Progress Bar -->
        <div class="progress-section">
          <div class="progress-track">
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .splash-screen {
      --background: #0d1017;
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 100%;
    }

    /* Background Cybernetic Elements */
    .cyber-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      background: radial-gradient(circle at 50% 45%, #181d2c 0%, #0d1017 65%, #080a0f 100%);
    }

    .ambient-glow {
      position: absolute;
      top: 40%;
      left: 50%;
      width: 320px;
      height: 320px;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, rgba(34, 211, 238, 0.08) 40%, transparent 70%);
      filter: blur(40px);
      animation: pulse-ambient 4s ease-in-out infinite alternate;
    }

    .scanlines {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.35) 0px,
        rgba(0, 0, 0, 0.35) 1px,
        transparent 1px,
        transparent 3px
      );
      opacity: 0.85;
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      background-size: 32px 32px;
      opacity: 0.7;
    }

    /* Splash Foreground Container */
    .splash-container {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      box-sizing: border-box;
      gap: 36px;
    }

    /* Deck Icon Card */
    .deck-card {
      width: 172px;
      height: 172px;
      background: rgba(22, 26, 38, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 26px;
      border: 1px solid rgba(255, 255, 255, 0.09);
      box-shadow: 
        0 20px 40px -10px rgba(0, 0, 0, 0.7),
        0 0 25px rgba(147, 51, 234, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.12);
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: card-float 3s ease-in-out infinite alternate;
    }

    .deck-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      width: 100%;
      height: 100%;
    }

    .deck-key {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: #121520;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .key-active {
      background: rgba(147, 51, 234, 0.18);
      border: 1.5px solid rgba(192, 132, 252, 0.65);
      box-shadow: 
        0 0 16px rgba(168, 85, 247, 0.35),
        inset 0 0 12px rgba(168, 85, 247, 0.25);
    }

    .key-icon {
      width: 26px;
      height: 26px;
    }

    .icon-cyan {
      color: #00f0ff;
      filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.5));
    }

    .icon-purple {
      color: #e879f9;
      filter: drop-shadow(0 0 6px rgba(232, 121, 249, 0.7));
    }

    .icon-cyan-subtle {
      color: #94a3b8;
    }

    /* Brand Section */
    .brand-section {
      text-align: center;
      margin-top: 10px;
    }

    .brand-title-wrap {
      display: inline-flex;
      align-items: flex-start;
      position: relative;
    }

    .brand-title {
      font-family: 'Rajdhani', 'Orbitron', 'Inter', -apple-system, sans-serif;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #ffffff;
      margin: 0;
      line-height: 1;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00f0ff;
      box-shadow: 
        0 0 8px #00f0ff,
        0 0 16px rgba(0, 240, 255, 0.8);
      position: absolute;
      top: -2px;
      right: -12px;
      animation: dot-pulse 2s infinite alternate;
    }

    .brand-subtitle {
      font-family: 'Rajdhani', 'Inter', -apple-system, monospace;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 5px;
      color: #00e5ff;
      margin: 14px 0 0 0;
      text-shadow: 0 0 10px rgba(0, 229, 255, 0.6);
      text-transform: uppercase;
    }

    /* Progress Bar */
    .progress-section {
      width: 100%;
      max-width: 240px;
      margin-top: 20px;
    }

    .progress-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #c026d3, #a855f7, #e879f9);
      border-radius: 999px;
      box-shadow: 
        0 0 10px rgba(192, 38, 211, 0.9),
        0 0 20px rgba(168, 85, 247, 0.6);
      animation: fill-bar 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }

    /* Keyframes */
    @keyframes fill-bar {
      0% {
        width: 0%;
      }
      40% {
        width: 45%;
      }
      70% {
        width: 78%;
      }
      100% {
        width: 100%;
      }
    }

    @keyframes card-float {
      0% {
        transform: translateY(0px);
      }
      100% {
        transform: translateY(-4px);
      }
    }

    @keyframes dot-pulse {
      0% {
        transform: scale(0.9);
        box-shadow: 0 0 6px #00f0ff, 0 0 12px rgba(0, 240, 255, 0.6);
      }
      100% {
        transform: scale(1.15);
        box-shadow: 0 0 10px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.95);
      }
    }

    @keyframes pulse-ambient {
      0% {
        opacity: 0.6;
        transform: translate(-50%, -50%) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.05);
      }
    }
  `],
  imports: [IonContent]
})
export class SplashPage implements OnInit {
  constructor(private companionService: CompanionService, private router: Router) {}

  ngOnInit() {
    // 2.0s duration allows the neon progress bar animation to complete smoothly
    setTimeout(() => {
      const device = this.companionService.pairedDevice$.value;
      if (device) {
        console.log('Device is already paired. Launching home screen directly...');
        this.companionService.connect();
        this.router.navigateByUrl('/home', { replaceUrl: true });
      } else {
        console.log('No paired device found. Navigating to pairing screen...');
        this.router.navigateByUrl('/pairing', { replaceUrl: true });
      }
    }, 2000);
  }
}
