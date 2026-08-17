import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

const HEART_PIXELS: (string | null)[][] = [
  [null, null, '#b00000', '#b00000', null, null, null, '#b00000', '#b00000', null, null],
  [null, '#d00000', '#ff2020', '#ff2020', '#d00000', null, '#d00000', '#ff2020', '#ff2020', '#d00000', null],
  ['#b00000', '#ff2020', '#ff4040', '#ff4040', '#ff2020', '#d00000', '#ff2020', '#ff4040', '#ff4040', '#ff2020', '#b00000'],
  ['#b00000', '#ff2020', '#ff4040', '#ff6060', '#ff4040', '#ff2020', '#ff4040', '#ff6060', '#ff4040', '#ff2020', '#b00000'],
  [null, '#d00000', '#ff4040', '#ff6060', '#ff6060', '#ff4040', '#ff6060', '#ff6060', '#ff4040', '#d00000', null],
  [null, '#d00000', '#ff4040', '#ff6060', '#ff8080', '#ff6060', '#ff8080', '#ff6060', '#ff4040', '#d00000', null],
  [null, null, '#d00000', '#ff4040', '#ff6060', '#ff8080', '#ff6060', '#ff4040', '#d00000', null, null],
  [null, null, '#b00000', '#d00000', '#ff4040', '#ff6060', '#ff4040', '#d00000', '#b00000', null, null],
  [null, null, null, '#b00000', '#d00000', '#ff4040', '#d00000', '#b00000', null, null, null],
  [null, null, null, null, '#b00000', '#d00000', '#b00000', null, null, null, null],
  [null, null, null, null, null, '#b00000', null, null, null, null, null]
];

const CENTER_ROW = 5;
const CENTER_COL = 5;

@Component({
  selector: 'app-pixel-heart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heart-container">
      <div class="pixel-heart">
        @for (row of pixelRows; track $index; let r = $index) {
          <div class="pixel-row">
            @for (pixel of row; track $index; let c = $index) {
              <div
                class="pixel"
                [class.active]="pixel !== null"
                [style.--base-color]="pixel"
                [style.--delay]="getWaveDelay(r, c) + 's'"
              ></div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .heart-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #050505;
    }

    .pixel-heart {
      display: flex;
      flex-direction: column;
      gap: 3px;
      image-rendering: pixelated;
    }

    .pixel-row {
      display: flex;
      gap: 3px;
    }

    .pixel {
      width: 22px;
      height: 22px;
      background: transparent;
    }

    .pixel.active {
      background: var(--base-color);

      animation: wave 1.8s ease-in-out var(--delay) infinite;

      transform-origin: center;
    }

    /*
     * A single brightness wave travels:
     * center → surrounding pixels → outer edge
     */
    @keyframes wave {
      0% {
        filter: brightness(1);
        transform: scale(1);
        box-shadow: none;
      }

      12% {
        filter: brightness(1.8);
        transform: scale(1.08);
        box-shadow:
          0 0 8px rgba(255, 70, 70, 0.8);
      }

      25% {
        filter: brightness(2.3);
        transform: scale(1.12);
        box-shadow:
          0 0 12px rgba(255, 80, 80, 0.9);
      }

      40% {
        filter: brightness(1);
        transform: scale(1);
        box-shadow: none;
      }

      100% {
        filter: brightness(1);
        transform: scale(1);
        box-shadow: none;
      }
    }
  `]
})
export class PixelHeartComponent {
  public pixelRows = HEART_PIXELS;

  /*
   * Distance from the center controls the delay.
   * Center pixels light first, then the wave moves outward.
   */
  getWaveDelay(row: number, col: number): number {
    const distance = Math.sqrt(
      Math.pow(row - CENTER_ROW, 2) +
      Math.pow(col - CENTER_COL, 2)
    );

    return distance * 0.10;
  }
}
