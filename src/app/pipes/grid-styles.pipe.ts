import { Pipe, PipeTransform } from '@angular/core';
import { ScreenConfig } from '../models';
import { GRADIENT_THEMES } from '../constants/themes.constant';

@Pipe({
  name: 'gridStyles',
  standalone: true,
  pure: true
})
export class GridStylesPipe implements PipeTransform {
  transform(screen: ScreenConfig | null | undefined): Record<string, string> {
    if (!screen || screen.type !== 'grid') {
      return {};
    }

    const size = screen.config.grid_size || '4x4';
    const [cols, rows] = size.split('x').map(Number);
    const validCols = isNaN(cols) ? 4 : cols;
    const validRows = isNaN(rows) ? 4 : rows;
    const bgConf = screen.config.background;
    const styles: Record<string, string> = {
      'grid-template-columns': `repeat(${validCols}, 1fr)`,
      'grid-template-rows': `repeat(${validRows}, 1fr)`
    };

    if (screen.config.theme) {
      return styles;
    }

    if (bgConf?.type === 'image' && bgConf?.name && Object.prototype.hasOwnProperty.call(GRADIENT_THEMES, bgConf.name)) {
      styles['background'] = GRADIENT_THEMES[bgConf.name];
    } else if (bgConf?.type === 'color') {
      styles['background-color'] = bgConf.value;
    } else if (bgConf?.type === 'url' && bgConf.url) {
      styles['background-image'] = `url('${bgConf.url}')`;
      styles['background-size'] = 'cover';
      styles['background-position'] = 'center';
      styles['background-repeat'] = 'no-repeat';
    }

    return styles;
  }
}
