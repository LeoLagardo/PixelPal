import { Pipe, PipeTransform } from '@angular/core';
import { ScreenConfig } from '../models';
import { THEMES } from '../constants/themes.constant';

@Pipe({
  name: 'gridTheme',
  standalone: true,
  pure: true
})
export class GridThemePipe implements PipeTransform {
  transform(screen: ScreenConfig | null | undefined): string | null {
    if (!screen || screen.type !== 'grid') {
      return null;
    }

    const theme = screen.config.theme;
    if (theme && THEMES.includes(theme)) {
      console.log(theme);
      
      return `theme-${theme}`;
    }

    return null;
  }
}
