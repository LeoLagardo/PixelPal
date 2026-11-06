import { Injectable, inject } from '@angular/core';
import { driver, Driver } from 'driver.js';

const STORAGE_KEY_PAIRING_TOUR = 'pixelpal_tour_pairing_completed';
const STORAGE_KEY_DECK_TOUR = 'pixelpal_tour_deck_completed';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private activeDriver: Driver | null = null;

  public isPairingTourCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEY_PAIRING_TOUR) === 'true';
  }

  public isDeckTourCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEY_DECK_TOUR) === 'true';
  }

  public resetTours(): void {
    localStorage.removeItem(STORAGE_KEY_PAIRING_TOUR);
    localStorage.removeItem(STORAGE_KEY_DECK_TOUR);
  }

  public markPairingTourCompleted(): void {
    localStorage.setItem(STORAGE_KEY_PAIRING_TOUR, 'true');
  }

  public markDeckTourCompleted(): void {
    localStorage.setItem(STORAGE_KEY_DECK_TOUR, 'true');
  }

  public stopActiveTour(): void {
    if (this.activeDriver) {
      try {
        this.activeDriver.destroy();
      } catch (e) {
        console.warn('[TutorialService] Error destroying driver instance:', e);
      }
      this.activeDriver = null;
    }
  }

  /**
   * Interactive guided tour for the Pairing & Desktop setup screen
   */
  public startPairingTour(force = false): void {
    if (!force && this.isPairingTourCompleted()) {
      return;
    }

    this.stopActiveTour();

    // Verify at least one target element is in the DOM
    const downloadEl = document.querySelector('#tour-pc-download');
    if (!downloadEl) {
      // If elements are not rendered yet, retry shortly
      setTimeout(() => {
        if (document.querySelector('#tour-pc-download')) {
          this.startPairingTour(force);
        }
      }, 350);
      return;
    }

    this.activeDriver = driver({
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: 'rgba(5, 8, 15, 0.85)',
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'pixelpal-tour-popover',
      showProgress: true,
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Got It!',
      onDestroyed: () => {
        this.markPairingTourCompleted();
        this.activeDriver = null;
      },
      steps: [
        {
          element: '#tour-pc-download',
          popover: {
            title: '💻 Step 1: Get the PC App',
            description: 'PixelPal requires the companion desktop app running on your Windows PC. Tap here to download the installer or copy the link to open on your computer.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-pairing-modes',
          popover: {
            title: '⚡ Step 2: Choose Connection Mode',
            description: 'Connect via <b>Scan QR</b> (fastest), <b>Auto-Detect</b> (finds PCs on the same Wi-Fi), or <b>Manual PIN</b> if you have custom network ports.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#tour-qr-card',
          popover: {
            title: '📷 Step 3: Scan & Pair',
            description: 'In your PC companion app, open <i>Settings → Pair a Device</i> to view your QR code. Tap here to scan with your camera or paste the code.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#tour-faq-section',
          popover: {
            title: '🛡️ Step 4: Network & Firewall Help',
            description: 'Both devices must be connected to the same Wi-Fi or local network. Open this guide anytime for troubleshooting firewall or port issues.',
            side: 'top',
            align: 'center'
          }
        }
      ]
    });

    this.activeDriver.drive();
  }

  /**
   * Interactive guided tour for the Home Stream Deck display
   */
  public startDeckTour(force = false): void {
    if (!force && this.isDeckTourCompleted()) {
      return;
    }

    this.stopActiveTour();

    // Verify home layout elements exist
    const gridEl = document.querySelector('#tour-deck-grid');
    if (!gridEl) {
      setTimeout(() => {
        if (document.querySelector('#tour-deck-grid')) {
          this.startDeckTour(force);
        }
      }, 400);
      return;
    }

    this.activeDriver = driver({
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: 'rgba(5, 8, 15, 0.85)',
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'pixelpal-tour-popover',
      showProgress: true,
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Start Controlling!',
      onDestroyed: () => {
        this.markDeckTourCompleted();
        this.activeDriver = null;
      },
      steps: [
        {
          element: '#tour-deck-grid',
          popover: {
            title: '🎮 Your Stream Deck Canvas',
            description: 'Tap any active tile to trigger macros, hotkeys, launch apps, or control OBS/media directly on your PC in real-time.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#tour-deck-nav',
          popover: {
            title: '📑 Multi-Screen Profiles',
            description: 'Swipe left/right or use the pagination dots and arrows to seamlessly switch between different decks and layout pages.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#tour-deck-settings',
          popover: {
            title: '⚙️ Settings & Audio Feedback',
            description: 'Tweak tactile button click tunes, adjust volume, view your active PC server connection, or unlock Lifetime Pro.',
            side: 'top',
            align: 'end'
          }
        }
      ]
    });

    this.activeDriver.drive();
  }
}

