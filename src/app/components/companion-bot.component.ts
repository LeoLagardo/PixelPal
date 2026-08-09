import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RobotExpression = 'neutral' | 'happy' | 'surprised' | 'sad' | 'sleepy' | 'angry';

@Component({
  selector: 'app-companion-robot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stage">
      <div class="device">
        <div class="screen">
          <div class="face" [attr.data-state]="currentState">
            
            <!-- Eyes -->
            <div class="eyes" [class.blinking]="isBlinking">
              <div class="eye left">
                <div class="pupil"></div>
                <div class="highlight"></div>
              </div>
              <div class="eye right">
                <div class="pupil"></div>
                <div class="highlight"></div>
              </div>
            </div>
            
            <!-- Angry glyph -->
            <div class="glyph" [class.visible]="currentState === 'angry'">
              <svg width="100" height="70" viewBox="0 0 100 70">
                <path d="M 8 8 L 30 26 L 8 44" />
                <path d="M 92 8 L 70 26 L 92 44" />
                <path d="M 35 58 L 65 58" />
              </svg>
            </div>
            
            <!-- Mouth -->
            <div class="mouth" [class.visible]="showMouth">
              <div class="mouth-shape" [attr.data-mouth]="mouthShape"></div>
            </div>
            
            <!-- Cheeks -->
            <div class="cheeks" [class.visible]="showCheeks">
              <div class="cheek left"></div>
              <div class="cheek right"></div>
            </div>
            
            <!-- Sleep Zzz -->
            <div class="sleep-particles" *ngIf="currentState === 'sleepy'">
              <span *ngFor="let z of sleepZs" 
                    class="sleep-z"
                    [style.--delay]="z.delay + 's'"
                    [style.--x]="z.x + 'px'"
                    [style.--y]="z.y + 'px'">Z</span>
            </div>
            
            <!-- Happy sparkles -->
            <div class="sparkles" *ngIf="currentState === 'happy'">
              <div *ngFor="let s of sparkles" class="sparkle" 
                   [style.--sx]="s.x + '%'" 
                   [style.--sy]="s.y + '%'"
                   [style.--delay]="s.delay + 's'"></div>
            </div>
            
            <!-- Surprised shock lines -->
            <div class="shock-lines" *ngIf="currentState === 'surprised'">
              <div class="shock shock-1"></div>
              <div class="shock shock-2"></div>
              <div class="shock shock-3"></div>
              <div class="shock shock-4"></div>
            </div>
            
            <!-- Sad tear -->
            <div class="tear" *ngIf="currentState === 'sad'">
              <div class="tear-drop"></div>
            </div>
            
            <!-- Screen ambient glow -->
            <div class="screen-glow" [class.active]="glowActive"></div>
          </div>
        </div>
      </div>
      
      <div class="label">{{ currentState }}</div>
      <div class="controls">
        <button 
          *ngFor="let state of allStates" 
          [class.active]="currentState === state"
          (click)="setState(state)">
          {{ state }}
        </button>
        <button class="random-btn" (click)="toggleRandomizer()" [class.active]="isRandomizing">
          {{ isRandomizing ? 'stop' : 'random' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --bg: #0d0d0f;
      --shell-1: #f4f1ea;
      --shell-2: #d9d4c8;
      --screen: #0a0d12;
      --glow: #35e6e0;
      --glow-dim: #1a8a85;
      --ink-dim: #8b8f97;
      --ink: #eee;
      --ease: cubic-bezier(.4,0,.2,1);
      display: block;
      width: 100%;
      height: 100%;
    }

    .stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 26px;
      padding: 40px 20px;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 30%, #1a1b1f, var(--bg) 70%);
    }

    /* ===== DEVICE SHELL ===== */
    .device {
      width: 220px;
      height: 210px;
      background: linear-gradient(160deg, var(--shell-1), var(--shell-2));
      border-radius: 48% 48% 42% 42% / 58% 58% 34% 34%;
      padding: 16px;
      box-shadow: 0 22px 44px -16px rgba(0,0,0,.55), inset 0 2px 3px rgba(255,255,255,.6);
      animation: deviceFloat 4s ease-in-out infinite;
    }

    @keyframes deviceFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .screen {
      width: 100%;
      height: 100%;
      background: var(--screen);
      border-radius: 48% 48% 42% 42% / 58% 58% 34% 34%;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .face {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ===== EYES ===== */
    .eyes {
      display: flex;
      gap: 10px;
      align-items: center;
      transition: opacity .3s var(--ease), transform .3s var(--ease);
      position: relative;
      z-index: 5;
    }

    .eye {
      position: relative;
      width: 30px;
      height: 66px;
      background: var(--glow);
      border-radius: 50%;
      box-shadow: 0 0 16px var(--glow), 0 0 32px var(--glow);
      transition: all .4s var(--ease);
      overflow: hidden;
    }

    .eye .pupil {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 12px;
      background: var(--screen);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all .3s var(--ease);
      opacity: 0;
    }

    .eye .highlight {
      position: absolute;
      top: 10px;
      left: 7px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #fff;
      opacity: .9;
      transition: opacity .3s var(--ease);
    }

    /* Blink */
    .eyes.blinking .eye {
      animation: blink 3.5s ease-in-out infinite;
    }
    .eyes.blinking .eye.right {
      animation-delay: 0.05s;
    }
    @keyframes blink {
      0%, 45%, 55%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(0.05); }
    }

    /* ===== EXPRESSIONS ===== */

    /* NEUTRAL */
    .face[data-state="neutral"] .eye {
      animation: neutralPulse 2s ease-in-out infinite;
    }
    .face[data-state="neutral"] .eye.right {
      animation-delay: 0.2s;
    }
    @keyframes neutralPulse {
      0%, 100% { box-shadow: 0 0 16px var(--glow), 0 0 32px var(--glow); }
      50% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow), 0 0 60px rgba(53, 230, 224, 0.2); }
    }

    /* HAPPY - squinted arcs */
    .face[data-state="happy"] .eye {
      height: 30px;
      width: 34px;
      clip-path: polygon(0% 100%, 20% 20%, 50% 0%, 80% 20%, 100% 100%);
      border-radius: 0;
      animation: happyWiggle 0.6s ease-in-out infinite;
    }
    .face[data-state="happy"] .eye.right {
      animation-delay: 0.1s;
    }
    .face[data-state="happy"] .eye .highlight {
      opacity: 0;
    }
    @keyframes happyWiggle {
      0%, 100% { transform: translateY(0) scaleY(1); }
      25% { transform: translateY(-3px) scaleY(1.1); }
      75% { transform: translateY(1px) scaleY(0.95); }
    }

    /* SLEEPY - thin bars */
    .face[data-state="sleepy"] .eye {
      height: 6px;
      width: 32px;
      border-radius: 4px;
      animation: sleepyDim 3s ease-in-out infinite;
    }
    .face[data-state="sleepy"] .eye .highlight {
      opacity: 0;
    }
    @keyframes sleepyDim {
      0%, 100% { opacity: 0.4; box-shadow: 0 0 8px var(--glow-dim); }
      50% { opacity: 0.7; box-shadow: 0 0 12px var(--glow); }
    }

    /* SURPRISED - big round eyes */
    .face[data-state="surprised"] .eye {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      animation: surprisedPop 0.5s ease-out;
    }
    .face[data-state="surprised"] .eye .pupil {
      opacity: 1;
      width: 16px;
      height: 16px;
      animation: pupilShake 0.3s ease-in-out infinite;
    }
    @keyframes surprisedPop {
      0% { transform: scale(0.3); }
      60% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    @keyframes pupilShake {
      0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
      25% { transform: translate(-50%, -50%) translate(-2px, 1px); }
      75% { transform: translate(-50%, -50%) translate(2px, -1px); }
    }

    /* SAD - droopy, rotated outward */
    .face[data-state="sad"] .eye {
      opacity: 0.7;
      transform-origin: bottom center;
      animation: sadFlicker 4s ease-in-out infinite;
    }
    .face[data-state="sad"] .eye:first-child {
      transform: rotate(-10deg);
      border-radius: 50% 50% 50% 20%;
    }
    .face[data-state="sad"] .eye:last-child {
      transform: rotate(10deg);
      border-radius: 50% 50% 20% 50%;
    }
    .face[data-state="sad"] .eye .highlight {
      opacity: 0.4;
    }
    @keyframes sadFlicker {
      0%, 90%, 100% { opacity: 0.7; }
      92% { opacity: 0.3; }
      94% { opacity: 0.7; }
      96% { opacity: 0.2; }
    }

    /* ANGRY - hide eyes, show glyph */
    .face[data-state="angry"] .eyes {
      opacity: 0;
      transform: scale(0.8);
    }

    /* ===== GLYPH ===== */
    .glyph {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity .3s var(--ease);
      z-index: 10;
    }
    .glyph.visible {
      opacity: 1;
      animation: angryShake 0.15s ease-in-out infinite;
    }
    .glyph svg {
      filter: drop-shadow(0 0 6px var(--glow));
    }
    .glyph path {
      fill: none;
      stroke: var(--glow);
      stroke-width: 7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    @keyframes angryShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-1px); }
      75% { transform: translateX(1px); }
    }

    /* ===== MOUTH ===== */
    .mouth {
      position: absolute;
      bottom: 28%;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity .3s var(--ease);
      z-index: 6;
    }
    .mouth.visible {
      opacity: 1;
    }
    .mouth-shape {
      width: 24px;
      height: 8px;
      background: var(--glow);
      border-radius: 4px;
      box-shadow: 0 0 8px var(--glow);
      transition: all .4s var(--ease);
    }
    .mouth-shape[data-mouth="happy"] {
      width: 28px;
      height: 14px;
      border-radius: 0 0 14px 14px;
      animation: mouthBounce 0.6s ease-in-out infinite;
    }
    .mouth-shape[data-mouth="sad"] {
      width: 20px;
      height: 10px;
      border-radius: 10px 10px 0 0;
      background: var(--glow-dim);
      box-shadow: 0 0 6px var(--glow-dim);
    }
    .mouth-shape[data-mouth="surprised"] {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--screen);
      border: 3px solid var(--glow);
      box-shadow: 0 0 12px var(--glow), inset 0 0 8px var(--glow);
      animation: mouthPulse 0.8s ease-in-out infinite;
    }
    @keyframes mouthBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    @keyframes mouthPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    /* ===== CHEEKS ===== */
    .cheeks {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity .4s var(--ease);
      z-index: 4;
    }
    .cheeks.visible {
      opacity: 1;
    }
    .cheek {
      position: absolute;
      width: 20px;
      height: 12px;
      background: rgba(255, 100, 150, 0.3);
      border-radius: 50%;
      filter: blur(4px);
      top: 55%;
      animation: cheekGlow 2s ease-in-out infinite;
    }
    .cheek.left { left: 18%; }
    .cheek.right { right: 18%; animation-delay: 0.5s; }
    @keyframes cheekGlow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }

    /* ===== SLEEP Zzz ===== */
    .sleep-particles {
      position: absolute;
      top: 20%;
      right: 15%;
      z-index: 15;
      pointer-events: none;
    }
    .sleep-z {
      position: absolute;
      color: var(--glow);
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      opacity: 0;
      text-shadow: 0 0 8px var(--glow);
      animation: sleepFloat 3s ease-out var(--delay) infinite;
    }
    @keyframes sleepFloat {
      0% { opacity: 0; transform: translate(0, 0) scale(0.5) rotate(0deg); }
      20% { opacity: 0.8; }
      100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(1.3) rotate(15deg); }
    }

    /* ===== SPARKLES ===== */
    .sparkles {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 3;
    }
    .sparkle {
      position: absolute;
      left: var(--sx);
      top: var(--sy);
      width: 4px;
      height: 4px;
      background: var(--glow);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--glow), 0 0 16px var(--glow);
      opacity: 0;
      animation: sparklePop 1.5s ease-out var(--delay) infinite;
    }
    @keyframes sparklePop {
      0% { opacity: 0; transform: scale(0) rotate(0deg); }
      30% { opacity: 1; transform: scale(1.5) rotate(45deg); }
      60% { opacity: 0.5; transform: scale(1) rotate(90deg); }
      100% { opacity: 0; transform: scale(0) rotate(180deg); }
    }

    /* ===== SHOCK LINES ===== */
    .shock-lines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 2;
    }
    .shock {
      position: absolute;
      width: 2px;
      height: 16px;
      background: var(--glow);
      border-radius: 1px;
      box-shadow: 0 0 6px var(--glow);
      opacity: 0;
      animation: shockFlash 0.6s ease-out infinite;
    }
    .shock-1 { top: 15%; left: 20%; transform: rotate(-30deg); animation-delay: 0s; }
    .shock-2 { top: 12%; right: 22%; transform: rotate(30deg); animation-delay: 0.15s; }
    .shock-3 { bottom: 25%; left: 18%; transform: rotate(20deg); animation-delay: 0.3s; }
    .shock-4 { bottom: 22%; right: 20%; transform: rotate(-20deg); animation-delay: 0.45s; }
    @keyframes shockFlash {
      0%, 100% { opacity: 0; transform: scale(0.5); }
      50% { opacity: 0.8; transform: scale(1.2); }
    }

    /* ===== TEAR ===== */
    .tear {
      position: absolute;
      top: 45%;
      right: 28%;
      z-index: 12;
      pointer-events: none;
    }
    .tear-drop {
      width: 6px;
      height: 10px;
      background: linear-gradient(to bottom, var(--glow), var(--glow-dim));
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      box-shadow: 0 0 6px var(--glow);
      opacity: 0;
      animation: tearFall 2.5s ease-in infinite;
    }
    @keyframes tearFall {
      0% { opacity: 0; transform: translateY(0) scale(0.5); }
      15% { opacity: 0.8; transform: translateY(5px) scale(1); }
      80% { opacity: 0.6; }
      100% { opacity: 0; transform: translateY(50px) scale(0.3); }
    }

    /* ===== SCREEN GLOW ===== */
    .screen-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(53, 230, 224, 0.05) 0%, transparent 70%);
      opacity: 0;
      transition: opacity .5s var(--ease);
      pointer-events: none;
      z-index: 1;
    }
    .screen-glow.active {
      opacity: 1;
      animation: screenPulse 2s ease-in-out infinite;
    }
    @keyframes screenPulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.7; }
    }

    /* ===== CONTROLS ===== */
    .label {
      color: var(--ink-dim);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .12em;
      font-family: 'Segoe UI', system-ui, sans-serif;
      min-height: 18px;
      transition: color .3s var(--ease);
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      max-width: 460px;
    }
    button {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      letter-spacing: .02em;
      padding: 9px 16px;
      border-radius: 999px;
      border: 1px solid #333;
      background: #17181c;
      color: var(--ink-dim);
      cursor: pointer;
      transition: all .25s var(--ease);
      text-transform: lowercase;
    }
    button:hover {
      color: var(--ink);
      border-color: #666;
    }
    button.active {
      background: var(--ink);
      color: #111;
      border-color: var(--ink);
      font-weight: 600;
    }
    button.random-btn {
      border-color: var(--glow-dim);
      color: var(--glow);
    }
    button.random-btn:hover {
      border-color: var(--glow);
      box-shadow: 0 0 12px rgba(53, 230, 224, 0.2);
    }
    button.random-btn.active {
      background: var(--glow);
      color: #000;
      border-color: var(--glow);
      animation: randomPulse 1s ease-in-out infinite;
    }
    @keyframes randomPulse {
      0%, 100% { box-shadow: 0 0 0 rgba(53, 230, 224, 0); }
      50% { box-shadow: 0 0 20px rgba(53, 230, 224, 0.4); }
    }
  `]
})
export class CompanionRobotComponent implements OnInit, OnDestroy {
  public currentState: RobotExpression = 'neutral';
  public allStates: RobotExpression[] = ['neutral', 'happy', 'surprised', 'sad', 'sleepy', 'angry'];
  public isBlinking = true;
  public isRandomizing = false;
  public glowActive = true;
  
  public showMouth = false;
  public mouthShape: 'happy' | 'sad' | 'surprised' | 'neutral' = 'neutral';
  public showCheeks = false;
  
  public sleepZs: { delay: number; x: number; y: number }[] = [];
  public sparkles: { x: number; y: number; delay: number }[] = [];
  
  private randomizerId: any = null;
  private expressionDurations: Record<RobotExpression, number> = {
    neutral: 3000,
    happy: 2500,
    surprised: 2000,
    sad: 3500,
    sleepy: 4000,
    angry: 2200
  };

  ngOnInit() {
    this.generateSleepZs();
    this.generateSparkles();
    this.updateExpressionFeatures();
  }

  ngOnDestroy() {
    this.stopRandomizer();
  }

  setState(state: RobotExpression) {
    this.currentState = state;
    this.updateExpressionFeatures();
  }

  toggleRandomizer() {
    if (this.isRandomizing) {
      this.stopRandomizer();
    } else {
      this.isRandomizing = true;
      this.pickRandomState();
    }
  }

  stopRandomizer() {
    this.isRandomizing = false;
    if (this.randomizerId) {
      clearTimeout(this.randomizerId);
      this.randomizerId = null;
    }
  }

  private pickRandomState() {
    if (!this.isRandomizing) return;
    
    const available = this.allStates.filter(s => s !== this.currentState);
    const nextState = available[Math.floor(Math.random() * available.length)];
    
    this.setState(nextState);
    
    const baseDuration = this.expressionDurations[nextState];
    const randomDuration = baseDuration + (Math.random() * 1000 - 500);
    
    this.randomizerId = setTimeout(() => {
      this.pickRandomState();
    }, randomDuration);
  }

  private updateExpressionFeatures() {
    this.showMouth = false;
    this.showCheeks = false;
    this.glowActive = true;
    
    switch (this.currentState) {
      case 'happy':
        this.showMouth = true;
        this.mouthShape = 'happy';
        this.showCheeks = true;
        break;
      case 'sad':
        this.showMouth = true;
        this.mouthShape = 'sad';
        this.glowActive = false;
        break;
      case 'surprised':
        this.showMouth = true;
        this.mouthShape = 'surprised';
        break;
      case 'sleepy':
        this.glowActive = false;
        break;
      case 'angry':
        this.glowActive = true;
        break;
      default:
        break;
    }
  }

  private generateSleepZs() {
    this.sleepZs = [];
    for (let i = 0; i < 4; i++) {
      this.sleepZs.push({
        delay: i * 0.8,
        x: 15 + Math.random() * 20,
        y: -30 - Math.random() * 20
      });
    }
  }

  private generateSparkles() {
    this.sparkles = [];
    for (let i = 0; i < 8; i++) {
      this.sparkles.push({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 60,
        delay: Math.random() * 2
      });
    }
  }
}