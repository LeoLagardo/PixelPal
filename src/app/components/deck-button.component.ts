import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonConfig } from '../models';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-deck-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="deck-button-element"
      [ngClass]="{ 'is-active': isPressed }"

      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerCancel($event)"
    >
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

    .button-inner {
      display: flex;
      flex-direction: column;

      align-items: center;
      justify-content: center;

      height: 100%;
      width: 100%;

      gap: 6px;

      pointer-events: none;
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
  `]
})
export class DeckButtonComponent implements OnInit {

  @Input()
  button!: ButtonConfig;

  @Input()
  color?: string | null = '#b1b1b1';

  @Output()
  triggerAction = new EventEmitter<ButtonConfig>();

  public isPressed = false;

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

  constructor() { }

  ngOnInit(): void {}

  /**
   * Pointer has touched/clicked the button.
   *
   * IMPORTANT:
   * We do NOT activate here.
   *
   * The action happens only inside onPointerUp().
   */
  public onPointerDown(event: PointerEvent): void {
    event.preventDefault();

    this.startX = event.clientX;
    this.startY = event.clientY;

    this.hasMoved = false;

    // Show pressed state immediately.
    this.isPressed = true;

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
      this.hasMoved = true;
      this.isPressed = false;
    }
  }

  /**
   * Pointer/finger released.
   *
   * This is where the actual action happens.
   */
  public onPointerUp(event: PointerEvent): void {
    event.preventDefault();

    const shouldActivate =
      !this.hasMoved && this.isPressed;

    this.isPressed = false;

    /*
     * IMPORTANT:
     *
     * Only activate when the user released without
     * moving the pointer.
     */
    if (shouldActivate) {
      this.activate();
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
   *
   * For example:
   * - system gesture
   * - another application takes control
   * - touch interaction gets cancelled
   */
  public onPointerCancel(event: PointerEvent): void {
    this.isPressed = false;
    this.hasMoved = true;
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
     * Haptic feedback.
     *
     * This happens at the same time as the actual action,
     * i.e. after the finger has been released.
     */
    try {
      await Haptics.impact({
        style: ImpactStyle.Medium
      });
    } catch (e) {
      console.warn(
        'Haptics not supported in this environment'
      );
    }

    /*
     * Notify the parent component.
     */
    this.triggerAction.emit(this.button);
  }
}