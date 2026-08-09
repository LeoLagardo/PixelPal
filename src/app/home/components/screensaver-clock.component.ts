import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-screensaver-clock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="screensaver-clock-container">
      <div class="clock-display">
        <span class="time-string">{{ timeString }}</span>
        <span class="date-string">{{ dateString }}</span>
      </div>
    </div>
  `,
  styles: [`
    .screensaver-clock-container {
      width: 100%;
      height: 100%;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      user-select: none;
    }
    .clock-display {
      text-align: center;
      font-family: monospace, sans-serif;
    }
    .time-string {
      display: block;
      font-size: 64px;
      font-weight: bold;
      color: #00e676;
      text-shadow: 0 0 20px rgba(0, 230, 118, 0.6);
      letter-spacing: 2px;
    }
    .date-string {
      display: block;
      font-size: 18px;
      color: #888888;
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `]
})
export class ScreensaverClockComponent implements OnInit, OnDestroy {
  public timeString = '';
  public dateString = '';
  private timerId: any = null;

  ngOnInit() {
    this.updateClock();
    this.timerId = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private updateClock() {
    const now = new Date();
    this.timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    this.dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}
