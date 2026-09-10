import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonAction, ButtonConfig } from '../models';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SoundService } from '../services/sound.service';

@Component({
  selector: 'app-deck-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="deck-button-element"
      [ngClass]="{
        'is-active': isPressed,
        'is-long-press-triggered': isLongPressTriggered
      }"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerCancel($event)"
    >
      @if (button.long_press?.enabled) {
        <div class="long-press-dot" title="Hold action available"></div>
        <div
          class="long-press-progress"
          [class.is-animating]="isLongPressing"
          [style.animation-duration.ms]="button.long_press?.duration_ms || 500"
        ></div>
      }

      <div class="button-inner">
        <div class="icon-container">
          <i [class]="button.icon" [ngStyle]="color ? { 'color': color } : null"></i>
        </div>

        @if (button.label) {
          <span class="button-label">
            {{ button.label }}
          </span>
        }
      </div>
    </button>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .deck-button-element {
      width: 100%;
      height: 100%;

      border: none;
      outline: none;

      background: #1e1e1e;
      border-radius: 12px;

      padding: 8px;

      color: #ffffff;

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      box-shadow:
        0 4px 6px rgba(0, 0, 0, 0.3),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);

      cursor: pointer;

      /*
       * Prevent the browser from interpreting the gesture
       * as scrolling/zooming while interacting with this button.
       */
      touch-action: none;

      /*
       * Prevent text/image selection while pressing.
       */
      user-select: none;
      -webkit-user-select: none;

      /*
       * Prevent the default tap highlight on mobile.
       */
      -webkit-tap-highlight-color: transparent;

      transition:
        transform 0.08s ease,
        box-shadow 0.08s ease,
        background-color 0.1s ease;

      position: relative;
      overflow: hidden;
    }

    .deck-button-element.is-active {
      transform: scale(0.92);

      background-color: #292929;

      box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(0, 0, 0, 0.2);
    }

    .deck-button-element.is-long-press-triggered {
      background-color: #2a3b50;
      box-shadow: 0 0 12px rgba(56, 128, 255, 0.6), inset 0 0 6px rgba(56, 128, 255, 0.4);
    }

    .button-inner {
      display: flex;
      flex-direction: column;

      align-items: center;
      justify-content: center;

      height: 100%;
      width: 100%;

      gap: 6px;

      pointer-events: none;
      z-index: 2;
    }

    .icon-container {
      font-size: 28px;

      color: #3880ff;

      display: flex;
      align-items: center;
      justify-content: center;

      pointer-events: none;
    }

    .button-label {
      font-size: 11px;
      font-weight: 500;

      color: #e0e0e0;

      text-align: center;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      width: 100%;

      pointer-events: none;
    }

    .long-press-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
      pointer-events: none;
      z-index: 3;
    }

    .long-press-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, #3880ff, #00e5ff);
      border-radius: 0 0 12px 12px;
      pointer-events: none;
      opacity: 0;
      z-index: 3;
    }

    .long-press-progress.is-animating {
      opacity: 1;
      animation-name: longPressProgressFill;
      animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
      animation-fill-mode: forwards;
    }

    @keyframes longPressProgressFill {
      0% {
        width: 0%;
      }
      100% {
        width: 100%;
      }
    }
  `]
})
export class DeckButtonComponent implements OnInit, OnDestroy {

  @Input()
  button!: ButtonConfig;

  @Input()
  color?: string | null = '#b1b1b1';

  @Output()
  triggerAction = new EventEmitter<ButtonAction>();

  public isPressed = false;
  public isLongPressing = false;
  public isLongPressTriggered = false;

  private longPressTimeout: any = null;

  /**
   * Starting position of the pointer.
   */
  private startX = 0;
  private startY = 0;

  /**
   * Whether the pointer moved far enough
   * to consider this a drag/swipe rather than a tap.
   */
  private hasMoved = false;

  /**
   * Maximum movement allowed while still
   * considering the interaction a tap.
   */
  private readonly MOVE_THRESHOLD = 10;

  constructor(private soundService: SoundService) { }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.cancelLongPress();
  }

  /**
   * Pointer has touched/clicked the button.
   */
  public onPointerDown(event: PointerEvent): void {
    event.preventDefault();

    this.startX = event.clientX;
    this.startY = event.clientY;

    this.hasMoved = false;
    this.isPressed = true;
    this.isLongPressTriggered = false;

    // Start long press timer if enabled on this button
    if (this.button?.long_press?.enabled) {
      this.isLongPressing = true;
      const duration = this.button.long_press.duration_ms || 500;
      this.longPressTimeout = setTimeout(() => {
        this.triggerLongPressAction();
      }, duration);
    }

    /*
     * Keep receiving pointer events even if the finger
     * moves outside the button.
     */
    const element = event.currentTarget as HTMLElement;

    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture isn't available in some environments.
    }
  }

  /**
   * Pointer/finger moved.
   */
  public onPointerMove(event: PointerEvent): void {
    if (!this.isPressed) {
      return;
    }

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    const distance = Math.sqrt(
      dx * dx + dy * dy
    );

    /*
     * Once the pointer has moved more than the threshold,
     * consider this a drag/swipe.
     */
    if (distance > this.MOVE_THRESHOLD) {
      this.cancelLongPress();
      this.hasMoved = true;
      this.isPressed = false;
    }
  }

  /**
   * Pointer/finger released.
   */
  public onPointerUp(event: PointerEvent): void {
    event.preventDefault();

    this.cancelLongPress();

    // If long press already fired, do not trigger the standard tap action
    if (this.isLongPressTriggered) {
      this.isPressed = false;
      this.isLongPressTriggered = false;
    } else {
      const shouldActivate = !this.hasMoved && this.isPressed;
      this.isPressed = false;

      if (shouldActivate) {
        this.activate();
      }
    }

    const element = event.currentTarget as HTMLElement;

    try {
      element.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already have been released.
    }
  }

  /**
   * Browser/native system cancelled the pointer interaction.
   */
  public onPointerCancel(event: PointerEvent): void {
    this.cancelLongPress();
    this.isPressed = false;
    this.hasMoved = true;
    this.isLongPressTriggered = false;
  }

  private cancelLongPress(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    this.isLongPressing = false;
  }

  /**
   * Fires when the user holds down the button for the duration.
   */
  private async triggerLongPressAction(): Promise<void> {
    if (!this.isPressed || this.hasMoved || !this.button?.long_press?.enabled) {
      return;
    }

    this.isLongPressTriggered = true;
    this.isLongPressing = false;

    // Audible feedback
    this.soundService.playButtonClick();

    // Haptic feedback for long press
    try {
      await Haptics.impact({
        style: ImpactStyle.Heavy
      });
    } catch (e) {
      console.warn('Haptics not supported in this environment');
    }

    // Emit long press action
    this.triggerAction.emit(this.button.long_press.action);
  }

  /**
   * Called only after a valid tap/release.
   */
  public async activate(): Promise<void> {
    // Visual feedback.
    this.isPressed = true;

    setTimeout(() => {
      this.isPressed = false;
    }, 150);

    /*
     * Audible feedback.
     */
    this.soundService.playButtonClick();

    /*
     * Haptic feedback.
     */
    try {
      await Haptics.impact({
        style: ImpactStyle.Medium
      });
    } catch (e) {
      console.warn('Haptics not supported in this environment');
    }

    /*
     * Notify the parent component with standard action.
     */
    this.triggerAction.emit(this.button.action);
  }
}
