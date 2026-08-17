import { Injectable } from '@angular/core';
import { ScreenOrientation, OrientationLockType } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class OrientationService {
  /**
   * Locks the screen orientation to landscape mode.
   * Safe to call on native mobile devices and web browsers.
   */
  public async lockLandscape(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } else if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
        // Fallback for modern web browsers supporting the Screen Orientation API
        await (screen.orientation as any).lock('landscape').catch(() => {
          // Ignored if user hasn't interacted or browser doesn't permit locking
        });
      }
    } catch (err) {
      console.warn('Could not lock orientation to landscape:', err);
    }
  }

  /**
   * Unlocks the screen orientation, allowing free rotation.
   */
  public async unlock(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await ScreenOrientation.unlock();
      } else if (typeof screen !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch (err) {
      console.warn('Could not unlock screen orientation:', err);
    }
  }

  /**
   * Locks the screen orientation to portrait mode.
   */
  public async lockPortrait(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await ScreenOrientation.lock({ orientation: 'portrait' });
      } else if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as any).lock('portrait').catch(() => {});
      }
    } catch (err) {
      console.warn('Could not lock orientation to portrait:', err);
    }
  }
}
