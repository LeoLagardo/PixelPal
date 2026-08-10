import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RobotExpression =
  | 'neutral'
  | 'happy'
  | 'surprised'
  | 'sad'
  | 'sleepy'
  | 'angry'
  | 'nervous'
  | 'relaxed'
  | 'laughing'
  | 'frustrated';

type MicroBehavior =
  | 'none'
  | 'blink'
  | 'double-blink'
  | 'slow-blink'
  | 'look-left'
  | 'look-right'
  | 'look-around'
  | 'tiny-smile'
  | 'smile-fade'
  | 'eye-pulse'
  | 'startle'
  | 'settle'
  | 'doze';

type TransitionStyle = 'soft' | 'snap' | 'melt' | 'blink';

@Component({
  selector: 'app-companion-robot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stage">
      <div class="device">
        <div class="screen">
          <div
            class="face"
            [attr.data-state]="currentState"
            [attr.data-transition]="transitionStyle"
            [class.is-transitioning]="isTransitioning"
            [class.micro-active]="microBehavior !== 'none'"
            [class.micro-blink]="microBehavior === 'blink'"
            [class.micro-double-blink]="microBehavior === 'double-blink'"
            [class.micro-slow-blink]="microBehavior === 'slow-blink'"
            [class.micro-look-left]="microBehavior === 'look-left'"
            [class.micro-look-right]="microBehavior === 'look-right'"
            [class.micro-look-around]="microBehavior === 'look-around'"
            [class.micro-tiny-smile]="microBehavior === 'tiny-smile'"
            [class.micro-smile-fade]="microBehavior === 'smile-fade'"
            [class.micro-eye-pulse]="microBehavior === 'eye-pulse'"
            [class.micro-startle]="microBehavior === 'startle'"
            [class.micro-settle]="microBehavior === 'settle'"
            [class.micro-doze]="microBehavior === 'doze'"
            [style.--intensity]="expressionIntensity"
            [style.--attention]="attention"
            [style.--energy]="energy"
          >
            <!-- Eyes -->
            <div class="eyes">
              <div class="eye left">
                <div class="pupil"></div>
                <div class="highlight"></div>
              </div>
              <div class="eye right">
                <div class="pupil"></div>
                <div class="highlight"></div>
              </div>
            </div>

            <!-- Angry / frustrated glyph -->
            <div
              class="glyph"
              [class.visible]="currentState === 'angry' || currentState === 'frustrated'"
            >
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

            <!-- Nervous sweat -->
            <div class="sweat" *ngIf="currentState === 'nervous' || currentState === 'frustrated'">
              <span class="sweat-drop sweat-left"></span>
              <span class="sweat-drop sweat-right"></span>
            </div>

            <!-- Sleep Zzz -->
            <div class="sleep-particles" *ngIf="currentState === 'sleepy'">
              <span
                *ngFor="let z of sleepZs"
                class="sleep-z"
                [style.--delay]="z.delay + 's'"
                [style.--x]="z.x + 'px'"
                [style.--y]="z.y + 'px'"
              >Z</span>
            </div>

            <!-- Happy / laughing sparkles -->
            <div class="sparkles" *ngIf="currentState === 'happy' || currentState === 'laughing'">
              <div
                *ngFor="let s of sparkles"
                class="sparkle"
                [style.--sx]="s.x + '%'"
                [style.--sy]="s.y + '%'"
                [style.--delay]="s.delay + 's'"
              ></div>
            </div>

            <!-- Surprised shock lines -->
            <div class="shock-lines" *ngIf="currentState === 'surprised'">
              <div class="shock shock-1"></div>
              <div class="shock shock-2"></div>
              <div class="shock shock-3"></div>
              <div class="shock shock-4"></div>
            </div>

            <!-- Nervous / frustrated sweat flickers -->
            <div class="nervous-marks" *ngIf="currentState === 'nervous' || currentState === 'frustrated'">
              <span>•</span><span>•</span><span>•</span>
            </div>

            <!-- Sad tear -->
            <div class="tear" *ngIf="currentState === 'sad'">
              <div class="tear-drop"></div>
            </div>

            <!-- Expression transition shimmer -->
            <div class="transition-shimmer" [class.active]="isTransitioning"></div>

            <!-- Screen ambient glow -->
            <div class="screen-glow" [class.active]="glowActive"></div>
          </div>
        </div>
      </div>

      <!--
      <div class="label">{{ currentState }}</div>
      <div class="controls">
        <button
          *ngFor="let state of allStates"
          [class.active]="currentState === state"
          (click)="setState(state)"
        >
          {{ state }}
        </button>
        <button
          class="random-btn"
          (click)="toggleRandomizer()"
          [class.active]="isRandomizing"
        >
          {{ isRandomizing ? 'stop' : 'random' }}
        </button>
      </div>
      -->
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
      min-height: 100%;
      background: radial-gradient(circle at 50% 30%, #1a1b1f, var(--bg) 70%);
      justify-content: center;
    }

    /* ===== DEVICE ===== */
    .device {
      width: 220px;
      height: 210px;
      background: linear-gradient(160deg, var(--shell-1), var(--shell-2));
      border-radius: 48% 48% 42% 42% / 58% 58% 34% 34%;
      padding: 16px;
      box-shadow:
        0 22px 44px -16px rgba(0,0,0,.55),
        inset 0 2px 3px rgba(255,255,255,.6);
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
      --intensity: .5;
      --attention: .5;
      --energy: .5;
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: 50% 52%;
    }

    /* Expression changes should feel like a physical reaction,
       not a CSS state swap. */
    .face.is-transitioning {
      animation-duration: .38s;
      animation-timing-function: var(--ease);
      animation-fill-mode: both;
    }

    .face.is-transitioning[data-transition="soft"] {
      animation-name: transitionSoft;
    }

    .face.is-transitioning[data-transition="snap"] {
      animation-name: transitionSnap;
    }

    .face.is-transitioning[data-transition="melt"] {
      animation-name: transitionMelt;
    }

    .face.is-transitioning[data-transition="blink"] {
      animation-name: transitionBlink;
    }

    @keyframes transitionSoft {
      0% { opacity: .78; transform: scale(.975) translateY(1px); filter: blur(.2px); }
      45% { opacity: 1; transform: scale(1.015) translateY(-1px); }
      100% { opacity: 1; transform: scale(1); filter: blur(0); }
    }

    @keyframes transitionSnap {
      0% { transform: scale(.96); opacity: .65; }
      35% { transform: scale(1.035); opacity: 1; }
      62% { transform: scale(.99); }
      100% { transform: scale(1); }
    }

    @keyframes transitionMelt {
      0% { transform: scaleY(.94) scaleX(1.02); opacity: .72; }
      45% { transform: scaleY(1.025) scaleX(.99); opacity: 1; }
      100% { transform: scale(1); }
    }

    @keyframes transitionBlink {
      0% { transform: scaleY(1); opacity: .7; }
      28% { transform: scaleY(.88); opacity: 1; }
      58% { transform: scaleY(1.02); }
      100% { transform: scaleY(1); }
    }

    /* ===== EYES ===== */
    .eyes {
      display: flex;
      gap: 10px;
      align-items: center;
      position: relative;
      z-index: 5;
      transition:
        opacity .32s var(--ease),
        transform .32s var(--ease),
        filter .32s var(--ease);
    }

    .eye {
      position: relative;
      width: 30px;
      height: 66px;
      background: var(--glow);
      border-radius: 50%;
      box-shadow: 0 0 16px var(--glow), 0 0 32px var(--glow);
      transition:
        width .38s var(--ease),
        height .38s var(--ease),
        border-radius .38s var(--ease),
        opacity .38s var(--ease),
        transform .38s var(--ease),
        box-shadow .38s var(--ease),
        clip-path .38s var(--ease);
      overflow: hidden;
      transform-origin: center;
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
      transition: opacity .25s var(--ease);
    }

    /* ===== NATURAL MICRO BEHAVIORS ===== */
    .face.micro-blink .eye {
      animation: microBlink .18s ease-in-out both;
    }

    .face.micro-double-blink .eye {
      animation: microDoubleBlink .52s ease-in-out both;
    }

    .face.micro-slow-blink .eye {
      animation: microSlowBlink .75s ease-in-out both;
    }

    .face.micro-look-left .eyes {
      animation: lookLeft .48s cubic-bezier(.2,.8,.2,1) both;
    }

    .face.micro-look-right .eyes {
      animation: lookRight .48s cubic-bezier(.2,.8,.2,1) both;
    }

    .face.micro-look-around .eyes {
      animation: lookAround .85s ease-in-out both;
    }

    .face.micro-tiny-smile .mouth-shape {
      animation: tinySmile .65s ease-out both;
    }

    .face.micro-smile-fade .mouth-shape {
      animation: smileFade .7s ease-out both;
    }

    .face.micro-eye-pulse .eye {
      animation: eyePulse .6s ease-out both;
    }

    .face.micro-startle .eyes {
      animation: microStartle .32s cubic-bezier(.2,.9,.3,1) both;
    }

    .face.micro-settle {
      animation: settle .7s cubic-bezier(.2,.8,.2,1) both;
    }

    .face.micro-doze .eyes {
      animation: doze .9s ease-in-out both;
    }

    @keyframes microBlink {
      0%, 100% { transform: scaleY(1); }
      45%, 60% { transform: scaleY(.07); }
    }

    @keyframes microDoubleBlink {
      0%, 22%, 42%, 100% { transform: scaleY(1); }
      12%, 31% { transform: scaleY(.06); }
    }

    @keyframes microSlowBlink {
      0%, 100% { transform: scaleY(1); }
      42% { transform: scaleY(.05); }
      70% { transform: scaleY(.22); }
    }

    @keyframes lookLeft {
      0% { transform: translateX(0); }
      35% { transform: translateX(-4px); }
      70% { transform: translateX(-3px); }
      100% { transform: translateX(0); }
    }

    @keyframes lookRight {
      0% { transform: translateX(0); }
      35% { transform: translateX(4px); }
      70% { transform: translateX(3px); }
      100% { transform: translateX(0); }
    }

    @keyframes lookAround {
      0% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      55% { transform: translateX(4px); }
      78% { transform: translateX(2px); }
      100% { transform: translateX(0); }
    }

    @keyframes tinySmile {
      0% { transform: scaleX(.72) scaleY(.75); opacity: .65; }
      45% { transform: scaleX(1.08) scaleY(1.08); opacity: 1; }
      100% { transform: scaleX(.94) scaleY(.92); }
    }

    @keyframes smileFade {
      0% { transform: scale(1.04); opacity: 1; }
      100% { transform: scale(.78); opacity: .45; }
    }

    @keyframes eyePulse {
      0% { filter: brightness(1); }
      40% { filter: brightness(1.35); }
      100% { filter: brightness(1); }
    }

    @keyframes microStartle {
      0% { transform: scale(1); }
      25% { transform: scale(1.14); }
      55% { transform: scale(.98); }
      100% { transform: scale(1); }
    }

    @keyframes settle {
      0% { transform: translateY(-2px) scale(1.01); }
      45% { transform: translateY(1px) scale(.995); }
      100% { transform: translateY(0) scale(1); }
    }

    @keyframes doze {
      0% { transform: translateY(0); }
      50% { transform: translateY(3px) scaleY(.92); }
      100% { transform: translateY(0); }
    }

    /* ===== EXPRESSIONS ===== */

    /* Neutral: intentionally quiet. No infinite pulse. */
    .face[data-state="neutral"] .eye {
      box-shadow:
        0 0 13px var(--glow),
        0 0 26px rgba(53, 230, 224, .55);
    }

    /* Happy */
    .face[data-state="happy"] .eye,
    .face[data-state="laughing"] .eye {
      height: 30px;
      width: 34px;
      clip-path: polygon(0% 100%, 20% 20%, 50% 0%, 80% 20%, 100% 100%);
      border-radius: 0;
    }

    .face[data-state="happy"] .eye {
      transform: translateY(calc(-2px * var(--intensity)));
    }

    .face[data-state="happy"] .eye .highlight,
    .face[data-state="laughing"] .eye .highlight {
      opacity: 0;
    }

    /* Sleepy */
    .face[data-state="sleepy"] .eye {
      height: 6px;
      width: 32px;
      border-radius: 4px;
      opacity: calc(.35 + .35 * var(--intensity));
      box-shadow: 0 0 9px var(--glow-dim);
    }

    .face[data-state="sleepy"] .eye .highlight,
    .face[data-state="relaxed"] .eye .highlight {
      opacity: 0;
    }

    /* Surprised */
    .face[data-state="surprised"] .eye {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      box-shadow:
        0 0 18px var(--glow),
        0 0 42px rgba(53, 230, 224, .55);
    }

    .face[data-state="surprised"] .eye .pupil {
      opacity: 1;
      width: 16px;
      height: 16px;
    }

    /* Sad */
    .face[data-state="sad"] .eye {
      opacity: .62;
      transform-origin: bottom center;
      box-shadow: 0 0 10px var(--glow-dim);
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
      opacity: .35;
    }

    /* Angry */
    .face[data-state="angry"] .eyes {
      opacity: 0;
      transform: scale(.8);
    }

    /* Nervous — new screenshot: squeezed eyes + clenched little mouth + sweat */
    .face[data-state="nervous"] .eye {
      width: 34px;
      height: 16px;
      border-radius: 45% 45% 20% 20%;
      transform: rotate(var(--nervous-tilt, 0deg)) scaleY(.82);
      box-shadow: 0 0 12px var(--glow);
    }

    .face[data-state="nervous"] .eye:first-child {
      transform: rotate(10deg) scaleY(.82);
    }

    .face[data-state="nervous"] .eye:last-child {
      transform: rotate(-10deg) scaleY(.82);
    }

    .face[data-state="nervous"] .eye .highlight {
      opacity: 0;
    }

    /* Relaxed — new closed/half-moon eyes */
    .face[data-state="relaxed"] .eye {
      width: 34px;
      height: 17px;
      border-radius: 50% 50% 12px 12px;
      clip-path: inset(0 0 42% 0 round 50%);
      opacity: .85;
      box-shadow: 0 0 11px var(--glow);
    }

    .face[data-state="relaxed"] .eye:first-child {
      transform: rotate(3deg);
    }

    .face[data-state="relaxed"] .eye:last-child {
      transform: rotate(-3deg);
    }

    /* Laughing — new screenshot: tightly squeezed eyes + big open/teeth mouth */
    .face[data-state="laughing"] .eye {
      height: 18px;
      width: 38px;
      clip-path: polygon(0 85%, 18% 20%, 50% 0, 82% 20%, 100% 85%, 78% 62%, 50% 82%, 22% 62%);
      box-shadow: 0 0 18px var(--glow);
    }

    /* Frustrated — new screenshot: narrowed eyes + clenched teeth + sweat */
    .face[data-state="frustrated"] .eyes {
      transform: translateY(2px);
    }

    .face[data-state="frustrated"] .eye {
      width: 38px;
      height: 18px;
      border-radius: 4px;
      transform: rotate(9deg) skewX(-12deg);
      box-shadow: 0 0 14px var(--glow);
    }

    .face[data-state="frustrated"] .eye:last-child {
      transform: rotate(-9deg) skewX(12deg);
    }

    .face[data-state="frustrated"] .eye .highlight {
      opacity: 0;
    }

    /* ===== GLYPH ===== */
    .glyph {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity .28s var(--ease), transform .28s var(--ease);
      z-index: 10;
      pointer-events: none;
    }

    .glyph.visible {
      opacity: 1;
    }

    .face[data-state="frustrated"] .glyph {
      opacity: .25;
      transform: scale(.78);
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

    /* ===== MOUTH ===== */
    .mouth {
      position: absolute;
      bottom: 28%;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity .28s var(--ease), transform .28s var(--ease);
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
      transition:
        width .35s var(--ease),
        height .35s var(--ease),
        border-radius .35s var(--ease),
        background .35s var(--ease),
        box-shadow .35s var(--ease),
        transform .35s var(--ease);
    }

    .mouth-shape[data-mouth="happy"] {
      width: calc(26px + 8px * var(--intensity));
      height: calc(11px + 5px * var(--intensity));
      border-radius: 0 0 14px 14px;
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
    }

    /* New: nervous tiny clenched mouth */
    .mouth-shape[data-mouth="nervous"] {
      width: 28px;
      height: 7px;
      border-radius: 2px;
      background:
        repeating-linear-gradient(
          90deg,
          var(--glow) 0 4px,
          var(--screen) 4px 5px
        );
      box-shadow: 0 0 9px var(--glow);
    }

    /* New: relaxed small smile */
    .mouth-shape[data-mouth="relaxed"] {
      width: 22px;
      height: 7px;
      border-radius: 0 0 12px 12px;
      opacity: .65;
    }

    /* New: laughing open mouth with teeth */
    .mouth-shape[data-mouth="laughing"] {
      width: 42px;
      height: 25px;
      border-radius: 5px 5px 12px 12px;
      background:
        linear-gradient(
          to bottom,
          var(--glow) 0 38%,
          var(--screen) 38% 72%,
          var(--glow) 72% 100%
        );
      border: 2px solid var(--glow);
      box-shadow: 0 0 15px var(--glow);
    }

    /* New: frustrated gritted teeth */
    .mouth-shape[data-mouth="frustrated"] {
      width: 42px;
      height: 18px;
      border-radius: 3px;
      background:
        repeating-linear-gradient(
          90deg,
          var(--glow) 0 7px,
          var(--screen) 7px 9px
        );
      border: 2px solid var(--glow);
      box-shadow: 0 0 13px var(--glow);
    }

    /* ===== CHEEKS ===== */
    .cheeks {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity .3s var(--ease);
      z-index: 4;
    }

    .cheeks.visible {
      opacity: calc(.25 + .5 * var(--intensity));
    }

    .cheek {
      position: absolute;
      width: 20px;
      height: 12px;
      background: rgba(255, 100, 150, .3);
      border-radius: 50%;
      filter: blur(4px);
      top: 55%;
    }

    .cheek.left { left: 18%; }
    .cheek.right { right: 18%; }

    /* ===== SWEAT ===== */
    .sweat {
      position: absolute;
      inset: 0;
      z-index: 14;
      pointer-events: none;
    }

    .sweat-drop {
      position: absolute;
      width: 6px;
      height: 11px;
      background: var(--glow);
      border-radius: 60% 40% 65% 45%;
      box-shadow: 0 0 8px var(--glow);
      opacity: 0;
      animation: nervousSweat 1.6s ease-out both;
    }

    .sweat-left {
      left: 26%;
      top: 30%;
      transform: rotate(20deg);
    }

    .sweat-right {
      right: 25%;
      top: 25%;
      transform: rotate(-20deg);
      animation-delay: .42s;
    }

    @keyframes nervousSweat {
      0% { opacity: 0; transform: translateY(-4px) scale(.55) rotate(20deg); }
      25% { opacity: .9; }
      75% { opacity: .55; }
      100% { opacity: 0; transform: translateY(22px) scale(.8) rotate(20deg); }
    }

    /* ===== SLEEP ===== */
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
      0% { opacity: 0; transform: translate(0,0) scale(.5) rotate(0deg); }
      20% { opacity: .8; }
      100% {
        opacity: 0;
        transform: translate(var(--x),var(--y)) scale(1.3) rotate(15deg);
      }
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
      60% { opacity: .5; transform: scale(1) rotate(90deg); }
      100% { opacity: 0; transform: scale(0) rotate(180deg); }
    }

    /* ===== SHOCK ===== */
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
      animation: shockFlash .6s ease-out both;
    }

    .shock-1 { top: 15%; left: 20%; transform: rotate(-30deg); }
    .shock-2 { top: 12%; right: 22%; transform: rotate(30deg); animation-delay: .12s; }
    .shock-3 { bottom: 25%; left: 18%; transform: rotate(20deg); animation-delay: .24s; }
    .shock-4 { bottom: 22%; right: 20%; transform: rotate(-20deg); animation-delay: .36s; }

    @keyframes shockFlash {
      0% { opacity: 0; transform: scale(.5); }
      50% { opacity: .8; transform: scale(1.2); }
      100% { opacity: 0; transform: scale(.9); }
    }

    /* ===== NERVOUS MARKS ===== */
    .nervous-marks {
      position: absolute;
      inset: 0;
      z-index: 13;
      pointer-events: none;
      color: var(--glow);
      text-shadow: 0 0 6px var(--glow);
      font-size: 9px;
      font-weight: bold;
    }

    .nervous-marks span {
      position: absolute;
      opacity: 0;
      animation: nervousMarks 1.3s ease-out both;
    }

    .nervous-marks span:nth-child(1) { left: 21%; top: 38%; }
    .nervous-marks span:nth-child(2) { right: 21%; top: 34%; animation-delay: .25s; }
    .nervous-marks span:nth-child(3) { right: 15%; top: 50%; animation-delay: .5s; }

    @keyframes nervousMarks {
      0%, 100% { opacity: 0; transform: translateY(3px) scale(.6); }
      35% { opacity: .8; transform: translateY(0) scale(1); }
      70% { opacity: .35; }
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
      border-radius: 50%;
      box-shadow: 0 0 6px var(--glow);
      opacity: 0;
      animation: tearFall 2.5s ease-in both;
    }

    @keyframes tearFall {
      0% { opacity: 0; transform: translateY(0) scale(.5); }
      15% { opacity: .8; transform: translateY(5px) scale(1); }
      80% { opacity: .6; }
      100% { opacity: 0; transform: translateY(50px) scale(.3); }
    }

    /* ===== TRANSITION SHIMMER ===== */
    .transition-shimmer {
      position: absolute;
      inset: 8%;
      border-radius: 45%;
      pointer-events: none;
      z-index: 20;
      opacity: 0;
      background: radial-gradient(circle, rgba(53,230,224,.12), transparent 62%);
      mix-blend-mode: screen;
    }

    .transition-shimmer.active {
      animation: shimmer .42s ease-out both;
    }

    @keyframes shimmer {
      0% { opacity: 0; transform: scale(.72); }
      35% { opacity: .7; transform: scale(1.04); }
      100% { opacity: 0; transform: scale(1.12); }
    }

    /* ===== SCREEN GLOW ===== */
    .screen-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle at 50% 50%,
        rgba(53,230,224,.05) 0%,
        transparent 70%
      );
      opacity: 0;
      transition: opacity .45s var(--ease);
      pointer-events: none;
      z-index: 1;
    }

    .screen-glow.active {
      opacity: calc(.22 + .35 * var(--intensity));
    }

    /* ===== CONTROLS ===== */
    .label {
      color: var(--ink-dim);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .12em;
      font-family: 'Segoe UI', system-ui, sans-serif;
      min-height: 18px;
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
    }

    button.active {
      background: var(--ink);
      color: #111;
      border-color: var(--ink);
      font-weight: 600;
    }
  `]
})
export class CompanionRobotComponent implements OnInit, OnDestroy {
  public currentState: RobotExpression = 'neutral';
  public allStates: RobotExpression[] = [
    'neutral',
    'happy',
    'surprised',
    'sad',
    'sleepy',
    'angry',
    'nervous',
    'relaxed',
    'laughing',
    'frustrated'
  ];

  public isRandomizing = false;
  public glowActive = true;

  public showMouth = false;
  public mouthShape:
    | 'happy'
    | 'sad'
    | 'surprised'
    | 'nervous'
    | 'relaxed'
    | 'laughing'
    | 'frustrated'
    | 'neutral' = 'neutral';

  public showCheeks = false;

  public expressionIntensity = .45;

  // Internal "mood" model. These drift slowly, so randomness stays coherent.
  public mood = .55;
  public energy = .62;
  public attention = .58;

  public microBehavior: MicroBehavior = 'none';
  public transitionStyle: TransitionStyle = 'soft';
  public isTransitioning = false;

  public sleepZs: { delay: number; x: number; y: number }[] = [];
  public sparkles: { x: number; y: number; delay: number }[] = [];

  private randomizerId: ReturnType<typeof setTimeout> | null = null;
  private microBehaviorId: ReturnType<typeof setTimeout> | null = null;
  private transitionId: ReturnType<typeof setTimeout> | null = null;
  private moodId: ReturnType<typeof setTimeout> | null = null;

  private recentStates: RobotExpression[] = [];

  private readonly expressionRanges: Record<RobotExpression, [number, number]> = {
    // Neutral is deliberately dominant. Natural characters spend most time here.
    neutral: [2600, 8500],
    happy: [1200, 4200],
    surprised: [450, 1900],
    sad: [2200, 6000],
    sleepy: [3200, 9000],
    angry: [700, 2800],
    nervous: [900, 3600],
    relaxed: [2200, 7000],
    laughing: [800, 2600],
    frustrated: [800, 3000]
  };

  ngOnInit() {
    this.generateSleepZs();
    this.generateSparkles();
    this.updateExpressionFeatures();
    this.startMoodDrift();
    this.startMicroBehaviorLoop();
    this.toggleRandomizer();
  }

  ngOnDestroy() {
    this.stopRandomizer();

    if (this.microBehaviorId) {
      clearTimeout(this.microBehaviorId);
      this.microBehaviorId = null;
    }

    if (this.transitionId) {
      clearTimeout(this.transitionId);
      this.transitionId = null;
    }

    if (this.moodId) {
      clearTimeout(this.moodId);
      this.moodId = null;
    }
  }

  setState(state: RobotExpression) {
    this.applyExpression(state, true);
  }

  toggleRandomizer() {
    if (this.isRandomizing) {
      this.stopRandomizer();
    } else {
      this.isRandomizing = true;
      this.pickNaturalState(true);
    }
  }

  stopRandomizer() {
    this.isRandomizing = false;

    if (this.randomizerId) {
      clearTimeout(this.randomizerId);
      this.randomizerId = null;
    }
  }

  /**
   * Main behavioral loop.
   *
   * Instead of "randomly pick another face", this:
   * 1. drifts a mood/energy/attention model,
   * 2. weights expressions using that model,
   * 3. penalizes recent expressions,
   * 4. sometimes returns through neutral/relaxed,
   * 5. varies intensity and duration.
   */
  private pickNaturalState(firstPick = false) {
    if (!this.isRandomizing) return;

    let nextState = this.chooseWeightedExpression();

    // Avoid a constant emotional rollercoaster.
    if (!firstPick && this.shouldReturnToBaseline()) {
      nextState = this.energy < .3 ? 'sleepy' : 'neutral';
    }

    this.applyExpression(nextState, false);

    const [min, max] = this.expressionRanges[nextState];
    const duration = this.naturalDuration(min, max);

    this.randomizerId = setTimeout(() => {
      this.pickNaturalState();
    }, duration);
  }

  private chooseWeightedExpression(): RobotExpression {
    const candidates = this.allStates.map(state => ({
      state,
      weight: this.expressionWeight(state)
    }));

    const total = candidates.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;

    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) return candidate.state;
    }

    return 'neutral';
  }

  private expressionWeight(state: RobotExpression): number {
    // Base probabilities.
    let weight: number = {
      neutral: 42,
      happy: 14,
      surprised: 7,
      sad: 4,
      sleepy: 8,
      angry: 3,
      nervous: 5,
      relaxed: 9,
      laughing: 4,
      frustrated: 4
    }[state];

    // Mood biases.
    if (state === 'happy') weight += this.mood * 15;
    if (state === 'laughing') weight += this.mood * this.energy * 13;
    if (state === 'sad') weight += (1 - this.mood) * 8;
    if (state === 'angry') weight += (1 - this.mood) * this.energy * 5;
    if (state === 'frustrated') weight += (1 - this.mood) * this.attention * 5;
    if (state === 'nervous') weight += this.attention * (1 - this.mood) * 7;
    if (state === 'surprised') weight += this.attention * 7;
    if (state === 'relaxed') weight += this.mood * (1 - this.energy) * 12;
    if (state === 'sleepy') weight += (1 - this.energy) * 18;

    // Recent-memory penalty prevents repetitive loops.
    const recentIndex = this.recentStates.indexOf(state);
    if (recentIndex !== -1) {
      weight *= recentIndex === 0 ? .08 : recentIndex === 1 ? .25 : .55;
    }

    // Harder anti-repeat for the immediately previous expression.
    if (state === this.currentState) weight *= .02;

    return Math.max(.05, weight);
  }

  private shouldReturnToBaseline(): boolean {
    // Neutral/relaxed "breathing room" is more likely after a strong expression.
    const strongStates: RobotExpression[] = [
      'surprised',
      'angry',
      'laughing',
      'frustrated',
      'nervous'
    ];

    if (!strongStates.includes(this.currentState)) {
      return Math.random() < .28;
    }

    return Math.random() < .62;
  }

  private applyExpression(state: RobotExpression, manual: boolean) {
    const previous = this.currentState;

    this.currentState = state;
    this.expressionIntensity = this.randomIntensity(state);

    this.transitionStyle = this.chooseTransition(previous, state);

    this.triggerTransition();

    this.rememberState(state);
    this.updateExpressionFeatures();

    if (manual) {
      // Manual selection should still feel alive, but should not fight the user.
      this.clearMicroBehavior();
      this.stopRandomizer();
    }
  }

  private chooseTransition(
    from: RobotExpression,
    to: RobotExpression
  ): TransitionStyle {
    if (to === 'surprised' || to === 'frustrated') return 'snap';
    if (from === 'sleepy' || to === 'sleepy' || to === 'relaxed') return 'melt';
    if (from === 'neutral' || to === 'neutral') return 'soft';
    return Math.random() < .5 ? 'soft' : 'blink';
  }

  private triggerTransition() {
    this.isTransitioning = false;

    if (this.transitionId) {
      clearTimeout(this.transitionId);
    }

    // Let Angular remove the class before re-adding it, so the CSS animation
    // is retriggered even when the same expression is selected manually.
    requestAnimationFrame(() => {
      this.isTransitioning = true;

      this.transitionId = setTimeout(() => {
        this.isTransitioning = false;
      }, 430);
    });
  }

  private rememberState(state: RobotExpression) {
    this.recentStates = [
      state,
      ...this.recentStates.filter(item => item !== state)
    ].slice(0, 4);
  }

  private randomIntensity(state: RobotExpression): number {
    const baseByState: Record<RobotExpression, number> = {
      neutral: .25,
      happy: .55,
      surprised: .75,
      sad: .5,
      sleepy: .35,
      angry: .75,
      nervous: .6,
      relaxed: .35,
      laughing: .82,
      frustrated: .78
    };

    // Beta-like distribution: many subtle expressions, occasional strong ones.
    const variation = (Math.random() + Math.random() + Math.random()) / 3;
    const moodInfluence =
      state === 'happy' || state === 'laughing'
        ? this.mood * .18
        : state === 'sad' || state === 'angry'
          ? (1 - this.mood) * .12
          : 0;

    return Math.min(
      1,
      Math.max(.12, baseByState[state] * .72 + variation * .28 + moodInfluence)
    );
  }

  private naturalDuration(min: number, max: number): number {
    // Two random values makes durations cluster around the middle instead of
    // feeling like uniformly generated timers.
    const r = (Math.random() + Math.random()) / 2;
    const jitter = (Math.random() - .5) * 220;
    return Math.max(350, min + (max - min) * r + jitter);
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

      case 'nervous':
        this.showMouth = true;
        this.mouthShape = 'nervous';
        break;

      case 'relaxed':
        this.showMouth = true;
        this.mouthShape = 'relaxed';
        this.glowActive = true;
        break;

      case 'laughing':
        this.showMouth = true;
        this.mouthShape = 'laughing';
        this.showCheeks = true;
        break;

      case 'frustrated':
        this.showMouth = true;
        this.mouthShape = 'frustrated';
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

  /**
   * Micro-expression loop.
   *
   * These behaviors do NOT change the emotional state.
   * They make the robot feel like it is continuously alive between
   * major expression changes.
   */
  private startMicroBehaviorLoop() {
    const schedule = () => {
      const delay = this.naturalDuration(850, 3300);

      this.microBehaviorId = setTimeout(() => {
        this.runRandomMicroBehavior();
        schedule();
      }, delay);
    };

    schedule();
  }

  private runRandomMicroBehavior() {
    const choices: { behavior: MicroBehavior; weight: number }[] = [
      { behavior: 'blink', weight: 28 },
      { behavior: 'double-blink', weight: 7 },
      { behavior: 'slow-blink', weight: 8 },
      { behavior: 'look-left', weight: 13 },
      { behavior: 'look-right', weight: 13 },
      { behavior: 'look-around', weight: 5 },
      { behavior: 'eye-pulse', weight: 8 },
      { behavior: 'settle', weight: 8 },
      { behavior: 'tiny-smile', weight: this.mood > .58 ? 7 : 2 },
      { behavior: 'smile-fade', weight: this.currentState === 'happy' || this.currentState === 'laughing' ? 7 : 1 },
      { behavior: 'startle', weight: this.attention > .75 ? 4 : 1 },
      { behavior: 'doze', weight: this.energy < .35 ? 7 : 1 }
    ];

    const total = choices.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;

    for (const item of choices) {
      roll -= item.weight;
      if (roll <= 0) {
        this.setMicroBehavior(item.behavior);
        return;
      }
    }
  }

  private setMicroBehavior(behavior: MicroBehavior) {
    this.microBehavior = 'none';

    requestAnimationFrame(() => {
      this.microBehavior = behavior;

      const durations: Partial<Record<MicroBehavior, number>> = {
        blink: 220,
        'double-blink': 600,
        'slow-blink': 850,
        'look-left': 550,
        'look-right': 550,
        'look-around': 950,
        'tiny-smile': 700,
        'smile-fade': 750,
        'eye-pulse': 650,
        startle: 400,
        settle: 750,
        doze: 950
      };

      if (this.microBehaviorId) {
        // This timeout is only for the behavior itself; the loop schedules its
        // next decision independently.
      }

      setTimeout(() => {
        // Don't erase a newer behavior if one has already started.
        if (this.microBehavior === behavior) {
          this.microBehavior = 'none';
        }
      }, durations[behavior] ?? 500);
    });
  }

  private clearMicroBehavior() {
    this.microBehavior = 'none';
  }

  /**
   * Slowly changing internal variables stop the randomizer from looking like
   * a slot machine. The face has a "mood" and "energy" that influence choices.
   */
  private startMoodDrift() {
    const drift = () => {
      this.mood = this.clamp(this.mood + (Math.random() - .5) * .16);
      this.energy = this.clamp(this.energy + (Math.random() - .5) * .20);
      this.attention = this.clamp(this.attention + (Math.random() - .5) * .22);

      this.moodId = setTimeout(drift, this.naturalDuration(5500, 11000));
    };

    drift();
  }

  private clamp(value: number): number {
    return Math.max(.05, Math.min(.95, value));
  }

  private generateSleepZs() {
    this.sleepZs = [];

    for (let i = 0; i < 4; i++) {
      this.sleepZs.push({
        delay: i * .8,
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