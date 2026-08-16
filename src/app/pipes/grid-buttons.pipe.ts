import { Pipe, PipeTransform } from '@angular/core';
import { ScreenConfig, ButtonConfig } from '../models';

@Pipe({
  name: 'gridButtons',
  standalone: true,
  pure: true
})
export class GridButtonsPipe implements PipeTransform {
  transform(screen: ScreenConfig | null | undefined): (ButtonConfig | null)[] {
    if (!screen || screen.type !== 'grid') {
      return [];
    }

    const size = screen.config.grid_size || '4x4';
    const [cols, rows] = size.split('x').map(Number);
    const validCols = isNaN(cols) ? 4 : cols;
    const validRows = isNaN(rows) ? 4 : rows;
    const totalSlots = validCols * validRows;

    const sourceButtons = screen.config.buttons || [];
    const buttons: (ButtonConfig | null)[] = [];

    for (let i = 0; i < totalSlots; i++) {
      if (i < sourceButtons.length) {
        buttons.push(sourceButtons[i]);
      } else {
        buttons.push(null);
      }
    }

    return buttons;
  }
}
