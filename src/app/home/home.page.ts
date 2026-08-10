import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { Router } from '@angular/router';
import { CompanionService, ScreenConfig, ButtonConfig, PairedDevice } from '../services/companion.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeckButtonComponent } from '../components/deck-button.component';
import { ScreensaverClockComponent } from '../components/screensaver-clock.component';
import { fromEvent, merge, startWith, Subscription, switchMap, tap, timer } from 'rxjs';
import {
  IonButton,
  IonIcon,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAlert
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, refreshOutline, unlinkOutline, wifiOutline, qrCodeOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { PixelHeartComponent } from '../components/pixel-heart.component';
import { CompanionRobotComponent } from '../components/companion-bot.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DeckButtonComponent,
    ScreensaverClockComponent,
    PixelHeartComponent,
    CompanionRobotComponent,
    IonButton,
    IonIcon,
    IonToast,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonAlert
  ],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('carouselContainer', { static: false }) carouselContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('hideable', { read: ElementRef }) hideableDivs!: QueryList<ElementRef>;

  public pairedDevice: PairedDevice | null = null;
  public connectionState: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  public screens: ScreenConfig[] = [];
  public currentScreenIndex = 0;

  // Toast for errors
  public showToast = false;
  public toastMsg = '';

  public alertButtons = [
    {
      text: 'Connect to new PC',
      handler: () => {
        this.forgetDevice();
      }
    },
    {
      text: 'Reconnect',
      handler: () => {
        this.forceReconnect();
      }
    }
  ];

  private subs = new Subscription();

  private readonly INACTIVITY_MS = 2000;

  constructor(public companionService: CompanionService, private router: Router) {
    addIcons({ settingsOutline, refreshOutline, unlinkOutline, wifiOutline, qrCodeOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit() {
    this.subs.add(
      this.companionService.pairedDevice$.subscribe((device) => {
        this.pairedDevice = device;
      })
    );

    this.subs.add(
      this.companionService.connectionState$.subscribe((state) => {
        this.connectionState = state;
      })
    );

    this.subs.add(
      this.companionService.screens$.subscribe((screens) => {
        this.screens = screens || [];
        // Ensure index doesn't go out of bounds
        if (this.currentScreenIndex >= this.screens.length) {
          this.currentScreenIndex = Math.max(0, this.screens.length - 1);
        }
      })
    );

    this.subs.add(
      this.companionService.lastError$.subscribe((error) => {
        if (error) {
          this.triggerToast(error);
        }
      })
    );
  }

  ngAfterViewInit() {
    this.setupActivityListener();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  // Navigation
  public goToSettings() {
    this.router.navigateByUrl('/settings');
  }

  public goToPairing() {
    this.router.navigateByUrl('/pairing');
  }

  public forceReconnect() {
    this.companionService.connect();
  }

  public forgetDevice() {
    this.companionService.forgetDevice();
    this.router.navigateByUrl('/pairing', { replaceUrl: true });
  }

  // Toast
  private triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
  }

  // Grid columns and rows style generator
  public getGridStyles(screen: ScreenConfig) {
    const size = screen.grid_size || '4x4';
    const [cols, rows] = size.split('x').map(Number);
    const validCols = isNaN(cols) ? 4 : cols;
    const validRows = isNaN(rows) ? 4 : rows;

    return {
      'grid-template-columns': `repeat(${validCols}, 1fr)`,
      'grid-template-rows': `repeat(${validRows}, 1fr)`
    };
  }

  // Get list of buttons padded with empty placeholders to fill grid size
  public getGridButtons(screen: ScreenConfig): (ButtonConfig | null)[] {
    const size = screen.grid_size || '4x4';
    const [cols, rows] = size.split('x').map(Number);
    const validCols = isNaN(cols) ? 4 : cols;
    const validRows = isNaN(rows) ? 4 : rows;
    const totalSlots = validCols * validRows;

    const sourceButtons = screen.buttons || [];
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

  // Button Action Handler
  public onButtonTrigger(button: ButtonConfig) {
    console.log('Button action triggered:', button);
    this.companionService.sendAction(button.type, button.payload);
  }

  // Custom Carousel Touch/Scroll Tracking
  public onCarouselScroll(event: Event) {
    const container = event.target as HTMLElement;
    if (container) {
      const scrollLeft = container.scrollLeft;
      const width = container.clientWidth;
      if (width > 0) {
        // Calculate the nearest page
        this.currentScreenIndex = Math.round(scrollLeft / width);
      }
    }
  }

  public scrollToScreen(index: number) {
    if (this.carouselContainer && this.carouselContainer.nativeElement) {
      const container = this.carouselContainer.nativeElement;
      const width = container.clientWidth;
      container.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
      this.currentScreenIndex = index;
    }
  }

  public goToPrevScreen() {
    if (this.currentScreenIndex > 0) {
      this.scrollToScreen(this.currentScreenIndex - 1);
    }
  }

  public goToNextScreen() {
    if (this.currentScreenIndex < this.screens.length - 1) {
      this.scrollToScreen(this.currentScreenIndex + 1);
    }
  }

  private setupActivityListener() {
    const activityEvents$ = merge(
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'click'),
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown')
    );

    // ✅ FIX 1 & 3: Single subscription handles both show AND hide
    // ✅ FIX 2: Runs in AfterViewInit so @ViewChildren is populated
    const inactivitySub = activityEvents$.pipe(
      // Show immediately on any activity
      tap(() => this.showElements()),
      // Reset timer on every activity event
      switchMap(() => timer(this.INACTIVITY_MS)),
      // Start timer immediately on init
      startWith(0),
      // Hide when timer fires
      tap(() => this.hideElements())
    ).subscribe();

    // ✅ All subscriptions tracked in one place
    this.subs.add(inactivitySub);
  }

  private hideElements() {
    this.hideableDivs.forEach(div =>
      div.nativeElement.classList.add('hidden')
    );
    this.setCarouselPadding('0')
  }

  private showElements() {
    this.hideableDivs.forEach(div =>
      div.nativeElement.classList.remove('hidden')
    );
    this.setCarouselPadding('12px 16px')
  }

  private setCarouselPadding(padding: string) {
    const carousels = document.querySelectorAll<HTMLElement>('.carousel-slide');
    if (carousels) {
      carousels.forEach(carousel => {
        carousel.style.padding = `${padding}`;
      });
    }
  }
}
