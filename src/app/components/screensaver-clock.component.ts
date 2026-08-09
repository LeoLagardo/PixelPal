import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Pixel font for authentic LED look
const PIXEL_FONT = `
  @font-face {
    font-family: 'LED7';
    src: url('https://fonts.cdnfonts.com/s/14890/LED Display7.woff') format('woff');
    font-display: swap;
  }
`;

@Component({
  selector: 'app-screensaver-clock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="screensaver-clock-container">
      <!-- Scanlines overlay -->
      <div class="scanlines"></div>
      
      <!-- Subtle grid background -->
      <div class="led-grid"></div>

      <div class="clock-display">
        <!-- Weather Section -->
        <div class="weather-section">
          <div class="pixel-icon" [class]="weatherCondition">
            <div class="pixel-grid"></div>
          </div>
          <div class="weather-info">
            <span class="temp">{{ temperature }}°C</span>
            <span class="condition">{{ weatherCondition }}</span>
          </div>
        </div>

        <!-- Time Section -->
        <div class="time-wrapper">
          <span class="time-string">{{ timeString }}</span>
          <!-- <span class="colon-blink" [class.active]="colonVisible">:</span> -->
        </div>
        
        <!-- Date Section -->
        <div class="date-section">
          <span class="date-string">{{ dateString }}</span>
        </div>

        <!-- Decorative bottom dots -->
        <!-- <div class="status-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot blink"></span>
        </div> -->
      </div>
    </div>
  `,
  styles: [`
    /* Inject pixel font */
    ${PIXEL_FONT}

    .screensaver-clock-container {
      width: 100%;
      height: 100%;
      background: #050505;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ff3333;
      user-select: none;
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
        linear-gradient(rgba(20, 0, 0, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(20, 0, 0, 0.3) 1px, transparent 1px);
      background-size: 8px 8px;
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
        rgba(0,0,0,0.2) 50%,
        rgba(0,0,0,0.2)
      );
      background-size: 100% 4px;
      pointer-events: none;
      z-index: 10;
      animation: scanlineMove 10s linear infinite;
    }

    @keyframes scanlineMove {
      0% { transform: translateY(0); }
      100% { transform: translateY(4px); }
    }

    .clock-display {
      text-align: center;
      font-family: 'LED7', 'Courier New', monospace;
      position: relative;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
      background: rgba(0, 0, 0, 0.8);
    }

    /* Weather Section */
    .weather-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 10px;
      padding: 12px 24px;
      border: 2px solid #1a1a1a;
      background: rgba(10, 10, 10, 0.9);
    }

    .pixel-icon {
      width: 48px;
      height: 48px;
      position: relative;
      image-rendering: pixelated;
    }

    /* Pixel Art Icons using box-shadow */
    .pixel-grid {
      width: 4px;
      height: 4px;
      position: absolute;
      top: 0;
      left: 0;
    }

    /* CLOUD Icon */
    .cloud .pixel-grid {
      background: transparent;
      box-shadow: 
        /* Row 1 */
        16px 4px #888, 20px 4px #888, 24px 4px #888,
        /* Row 2 */
        12px 8px #888, 16px 8px #aaa, 20px 8px #aaa, 24px 8px #aaa, 28px 8px #888,
        /* Row 3 */
        8px 12px #888, 12px 12px #aaa, 16px 12px #ccc, 20px 12px #ccc, 24px 12px #ccc, 28px 12px #aaa, 32px 12px #888,
        /* Row 4 */
        8px 16px #aaa, 12px 16px #ccc, 16px 16px #eee, 20px 16px #eee, 24px 16px #eee, 28px 16px #ccc, 32px 16px #aaa,
        /* Row 5 */
        4px 20px #888, 8px 20px #ccc, 12px 20px #eee, 16px 20px #eee, 20px 20px #eee, 24px 20px #eee, 28px 20px #eee, 32px 20px #ccc, 36px 20px #888,
        /* Row 6 */
        4px 24px #888, 8px 24px #ccc, 12px 24px #eee, 16px 24px #eee, 20px 24px #eee, 24px 24px #eee, 28px 24px #eee, 32px 24px #ccc, 36px 24px #888,
        /* Row 7 */
        8px 28px #aaa, 12px 28px #ccc, 16px 28px #ccc, 20px 28px #ccc, 24px 28px #ccc, 28px 28px #aaa, 32px 28px #aaa,
        /* Row 8 */
        12px 32px #888, 16px 32px #888, 20px 32px #888, 24px 32px #888, 28px 32px #888;
    }

    /* SUN Icon */
    .sunny .pixel-grid {
      background: transparent;
      box-shadow:
        /* Center */
        20px 16px #ffdd00, 24px 16px #ffdd00,
        16px 20px #ffdd00, 20px 20px #ffff00, 24px 20px #ffff00, 28px 20px #ffdd00,
        16px 24px #ffdd00, 20px 24px #ffff00, 24px 24px #ffff00, 28px 24px #ffdd00,
        20px 28px #ffdd00, 24px 28px #ffdd00,
        /* Rays */
        20px 4px #ff8800, 24px 4px #ff8800,
        20px 8px #ffaa00, 24px 8px #ffaa00,
        8px 20px #ff8800, 12px 20px #ffaa00, 32px 20px #ffaa00, 36px 20px #ff8800,
        8px 24px #ff8800, 12px 24px #ffaa00, 32px 24px #ffaa00, 36px 24px #ff8800,
        20px 36px #ffaa00, 24px 36px #ffaa00,
        20px 40px #ff8800, 24px 40px #ff8800,
        /* Corner rays */
        12px 8px #ff6600, 32px 8px #ff6600,
        12px 36px #ff6600, 32px 36px #ff6600;
    }

    /* RAIN Icon */
    .rainy .pixel-grid {
      background: transparent;
      box-shadow:
        /* Cloud top */
        16px 4px #666, 20px 4px #666, 24px 4px #666,
        12px 8px #666, 16px 8px #888, 20px 8px #888, 24px 8px #888, 28px 8px #666,
        8px 12px #666, 12px 12px #888, 16px 12px #aaa, 20px 12px #aaa, 24px 12px #aaa, 28px 12px #888, 32px 12px #666,
        /* Cloud body */
        8px 16px #888, 12px 16px #aaa, 16px 16px #ccc, 20px 16px #ccc, 24px 16px #ccc, 28px 16px #aaa, 32px 16px #888,
        4px 20px #666, 8px 20px #aaa, 12px 20px #ccc, 16px 20px #ccc, 20px 20px #ccc, 24px 20px #ccc, 28px 20px #ccc, 32px 20px #aaa, 36px 20px #666,
        4px 24px #666, 8px 24px #aaa, 12px 24px #ccc, 16px 24px #ccc, 20px 24px #ccc, 24px 24px #ccc, 28px 24px #ccc, 32px 24px #aaa, 36px 24px #666,
        /* Rain drops */
        12px 28px #4488ff, 24px 28px #4488ff,
        8px 32px #4488ff, 20px 32px #4488ff, 32px 32px #4488ff,
        12px 36px #2266dd, 24px 36px #2266dd,
        16px 40px #2266dd, 28px 40px #2266dd;
    }

    .weather-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .temp {
      font-size: 28px;
      color: #ff3333;
      text-shadow: 0 0 10px rgba(255, 51, 51, 0.8);
      letter-spacing: 2px;
    }

    .condition {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 3px;
    }

    /* Time Section */
    .time-wrapper {
      position: relative;
      display: inline-block;
    }

    .time-string {
      display: block;
      font-size: 72px;
      font-weight: bold;
      color: #ff3333;
      text-shadow: 
        0 0 10px rgba(255, 51, 51, 0.9),
        0 0 20px rgba(255, 51, 51, 0.6),
        0 0 40px rgba(255, 51, 51, 0.3);
      letter-spacing: 8px;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .colon-blink {
      position: absolute;
      right: -20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 72px;
      color: #ff3333;
      text-shadow: 0 0 10px rgba(255, 51, 51, 0.9);
      opacity: 0.3;
      transition: opacity 0.1s;
    }

    .colon-blink.active {
      opacity: 1;
    }

    /* Date Section */
    .date-section {
      border-top: 2px dashed #333;
      padding-top: 12px;
      margin-top: 4px;
      width: 100%;
    }

    .date-string {
      display: block;
      font-size: 16px;
      color: #cc0000;
      text-transform: uppercase;
      letter-spacing: 4px;
      text-shadow: 0 0 5px rgba(204, 0, 0, 0.5);
    }

    /* Status Dots */
    .status-dots {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: #333;
      box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
    }

    .dot.blink {
      background: #ff3333;
      box-shadow: 0 0 6px rgba(255, 51, 51, 0.8);
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Pixelated text rendering */
    * {
      -webkit-font-smoothing: none;
      -moz-osx-font-smoothing: unset;
      text-rendering: geometricPrecision;
    }
  `]
})
export class ScreensaverClockComponent implements OnInit, OnDestroy {
  public timeString = '';
  public dateString = '';
  public colonVisible = true;
  
  // Hardcoded weather values
  public temperature = 24;
  public weatherCondition: 'cloud' | 'sunny' | 'rainy' = 'cloud'; // Change to 'sunny' or 'rainy'

  private timerId: any = null;
  private colonTimerId: any = null;

  ngOnInit() {
    this.updateClock();
    this.timerId = setInterval(() => {
      this.updateClock();
    }, 1000);

    // Blinking colon effect
    this.colonTimerId = setInterval(() => {
      this.colonVisible = !this.colonVisible;
    }, 500);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    if (this.colonTimerId) {
      clearInterval(this.colonTimerId);
    }
  }

  private updateClock() {
    const now = new Date();
    // Remove colons from time string since we handle them separately for blinking effect
    const rawTime = now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    });
    this.timeString = rawTime.replace(/:/g, ' ');
    
    this.dateString = now.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}