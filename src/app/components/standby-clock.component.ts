import { Component, OnInit, OnDestroy, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-standby-clock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stage" [style.color]="color">
      <div>
        <div class="clock">
          <span
            class="digit h1"
            [class.pop]="h1Pop()"
            (animationend)="h1Pop.set(false)"
          >{{ h1() }}</span>
          <span
            class="digit h2"
            [class.pop]="h2Pop()"
            (animationend)="h2Pop.set(false)"
          >{{ h2() }}</span>
          <span class="colon">:</span>
          <span
            class="digit m1"
            [class.pop]="m1Pop()"
            (animationend)="m1Pop.set(false)"
          >{{ m1() }}</span>
          <span
            class="digit m2"
            [class.pop]="m2Pop()"
            (animationend)="m2Pop.set(false)"
          >{{ m2() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
    }

    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #ff453a;
    }

    .stage {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #000;
      user-select: none;
    }

    .clock {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Arial Rounded MT Bold", "Arial Rounded MT", ui-rounded, "Trebuchet MS", sans-serif;
      font-size: clamp(170px, 30vw, 500px);
      font-weight: 900;
      line-height: .62;
      white-space: nowrap;
      letter-spacing: -.13em;
      transform: scaleX(.92);
    }

    .digit {
      display: block;
      width: .48em;
      position: relative;
      transform-origin: 50% 65%;
      transition: transform .7s cubic-bezier(.22, 1, .36, 1);
      opacity: .4;
    }

    .digit:first-child,
    .digit.h1 {
      margin-left: 0;
    }

    .digit:nth-child(2),
    .digit.h2 {
      transform: rotate(-2deg) translateY(.01em);
      z-index: 2;
    }

    .colon {
      display: block;
      width: .20em;
      margin: 0 -.115em;
      position: relative;
      z-index: 3;
      transform: translateY(-.015em) scaleX(.8);
      opacity: .2;
    }

    .digit:nth-child(4),
    .digit.m1 {
      transform: rotate(1.5deg) translateY(-.015em);
      z-index: 1;
    }

    .digit:nth-child(5),
    .digit.m2 {
      transform: rotate(-14.58deg) translateY(0.01em);
      z-index: 2;
    }

    .pop {
      animation: digitIn .62s cubic-bezier(.22, 1, .36, 1);
    }

    @keyframes digitIn {
      0% {
        transform: translateY(-.09em) rotate(-7deg) scale(.96);
        opacity: .25;
      }
      45% {
        transform: translateY(.025em) rotate(3deg) scale(1.015);
        opacity: 1;
      }
      100% {
        transform: translateY(0) rotate(0) scale(1);
        opacity: 1;
      }
    }

    .date {
      text-align: center;
      margin-top: 32px;
      font-size: clamp(18px, 2vw, 32px);
      font-weight: 650;
      letter-spacing: -.02em;
      opacity: .88;
    }

    @media (max-width: 700px) {
      .clock {
        font-size: min(29vw, 230px);
        transform: scaleX(.9);
      }
      .date {
        margin-top: 20px;
        font-size: 17px;
      }
    }
  `]
})
export class StandbyClockComponent implements OnInit, OnDestroy {
  @Input() color = '#ff453a';

  readonly h1 = signal('0');
  readonly h2 = signal('0');
  readonly m1 = signal('0');
  readonly m2 = signal('0');
  readonly dateString = signal('');

  readonly h1Pop = signal(false);
  readonly h2Pop = signal(false);
  readonly m1Pop = signal(false);
  readonly m2Pop = signal(false);

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateClock(true);
    this.timerId = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateClock(isInitial = false): void {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    if (this.h1() !== hh[0] || isInitial) {
      this.h1.set(hh[0]);
      this.triggerPop('h1');
    }

    if (this.h2() !== hh[1] || isInitial) {
      this.h2.set(hh[1]);
      this.triggerPop('h2');
    }

    if (this.m1() !== mm[0] || isInitial) {
      this.m1.set(mm[0]);
      this.triggerPop('m1');
    }

    if (this.m2() !== mm[1] || isInitial) {
      this.m2.set(mm[1]);
      this.triggerPop('m2');
    }

    this.dateString.set(
      d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    );
  }

  private triggerPop(digit: 'h1' | 'h2' | 'm1' | 'm2'): void {
    switch (digit) {
      case 'h1':
        this.h1Pop.set(false);
        requestAnimationFrame(() => this.h1Pop.set(true));
        break;
      case 'h2':
        this.h2Pop.set(false);
        requestAnimationFrame(() => this.h2Pop.set(true));
        break;
      case 'm1':
        this.m1Pop.set(false);
        requestAnimationFrame(() => this.m1Pop.set(true));
        break;
      case 'm2':
        this.m2Pop.set(false);
        requestAnimationFrame(() => this.m2Pop.set(true));
        break;
    }
  }
}

// Backward compatibility alias
export { StandbyClockComponent as ClockTwoComponent };
