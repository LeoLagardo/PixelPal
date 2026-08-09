import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonConfig, CompanionService } from '../../services/companion.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logoChrome,
  logoDiscord,
  logoGoogle,
  logoYoutube,
  logoSteam,
  playCircleOutline,
  ellipseOutline,
  squareOutline,
  triangleOutline,
  helpCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-deck-button',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <button
      #btnElement
      class="deck-button-element"
      [ngClass]="{ 'is-active': isPressed }"
      (mousedown)="onMouseDown($event)"
      (mouseup)="onMouseUp($event)"
      (mouseleave)="onMouseLeave($event)"
      (touchstart)="onTouchStart($event)"
      (touchend)="onTouchEnd($event)"
    >
      <div class="button-inner">
        <div class="icon-container">
          <ion-icon [name]="getIconName()"></ion-icon>
        </div>
        <span class="button-label" *ngIf="button.label">{{ button.label }}</span>
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
      background: #1e1e1e;
      border-radius: 12px;
      padding: 8px;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1);
      cursor: pointer;
      user-select: none;
      transition: transform 0.08s ease, box-shadow 0.08s ease, background-color 0.1s ease;
      position: relative;
      overflow: hidden;
    }
    .deck-button-element:active,
    .deck-button-element.is-active {
      transform: scale(0.92);
      background-color: #292929;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(0, 0, 0, 0.2);
    }
    .button-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      gap: 6px;
    }
    .icon-container {
      font-size: 28px;
      color: #3880ff;
      display: flex;
      align-items: center;
      justify-content: center;
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
    }
  `]
})
export class DeckButtonComponent implements OnInit {
  @Input() button!: ButtonConfig;
  @Output() triggerAction = new EventEmitter<ButtonConfig>();

  public isPressed = false;

  constructor() {
    addIcons({
      logoChrome,
      logoDiscord,
      logoGoogle,
      logoYoutube,
      logoSteam,
      playCircleOutline,
      ellipseOutline,
      squareOutline,
      triangleOutline,
      helpCircleOutline
    });
  }

  ngOnInit() {}

  public getIconName(): string {
    const lookup = (this.button.image || this.button.label || '').toLowerCase();
    if (lookup.includes('chrome') || lookup.includes('browser')) {
      return 'logo-chrome';
    } else if (lookup.includes('discord')) {
      return 'logo-discord';
    } else if (lookup.includes('spotify') || lookup.includes('music')) {
      return 'play-circle-outline';
    } else if (lookup.includes('youtube')) {
      return 'logo-youtube';
    } else if (lookup.includes('steam')) {
      return 'logo-steam';
    } else {
      // Fallback or use glyph if single character matches or defaults
      if (this.button.icon === '▫') {
        return 'square-outline';
      } else if (this.button.icon === '○') {
        return 'ellipse-outline';
      } else if (this.button.icon === '△') {
        return 'triangle-outline';
      }
      return 'help-circle-outline';
    }
  }

  // Handle tap / press haptics & styling
  public async activate() {
    this.isPressed = true;
    setTimeout(() => {
      this.isPressed = false;
    }, 150);

    // Haptics plugin trigger
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('Haptics not supported in this environment');
    }

    this.triggerAction.emit(this.button);
  }

  // Mouse event handlers for desktop preview / testing
  public onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.activate();
  }

  public onMouseUp(event: MouseEvent) {
    event.preventDefault();
  }

  public onMouseLeave(event: MouseEvent) {
    event.preventDefault();
    this.isPressed = false;
  }

  // Touch event handlers for native mobile feel
  public onTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.activate();
  }

  public onTouchEnd(event: TouchEvent) {
    event.preventDefault();
  }
}
