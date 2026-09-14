import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { Router } from '@angular/router';
import { CompanionService } from '../services/companion.service';
import { OrientationService } from '../services/orientation.service';
import { ScreenConfig, ButtonConfig, ButtonAction, PairedDevice } from '../models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeckButtonComponent } from '../components/deck-button.component';
import { RetroClockComponent } from '../components/retro-clock.component';
import { StandbyClockComponent } from '../components/standby-clock.component';
import { fromEvent, merge, startWith, Subscription, switchMap, tap, timer } from 'rxjs';
import {
  IonButton,
  IonIcon,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAlert,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline,
  refreshOutline,
  unlinkOutline,
  wifiOutline,
  qrCodeOutline,
  chevronBackOutline,
  chevronForwardOutline,
  sparklesOutline
} from 'ionicons/icons';
import { PixelHeartComponent } from '../components/pixel-heart.component';
import { CompanionRobotComponent } from '../components/companion-bot.component';
import { ProModalComponent } from '../components/pro-modal/pro-modal.component';
import { EntitlementService } from '../services/entitlement.service';
import { GridStylesPipe, GridButtonsPipe, GridThemePipe } from '../pipes';

import { GRADIENT_THEMES } from '../constants/themes.constant';
export { GRADIENT_THEMES };

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GridStylesPipe,
    GridButtonsPipe,
    GridThemePipe,
    DeckButtonComponent,
    RetroClockComponent,
    StandbyClockComponent,
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

  public isInactive = false;
  public isPro = false;
  private readonly INACTIVITY_MS = 5000;

  public getMediaType(screen: any): 'retro-clock' | 'standby-clock' | 'companion' | 'heart' | 'unknown' {
    const name = screen?.config?.source?.name;
    const id = screen?.id;
    if (name === 'standby-clock' || id === 'tpl-media-standby-clock') return 'standby-clock';
    if (name === 'companion' || id === 'tpl-media-companion' || id === 'app-companion-robot') return 'companion';
    if (name === 'retro-clock' || name === 'clock' || id === 'tpl-media-clock' || id === 'tpl-media-retro-clock') return 'retro-clock';
    if (name === 'heart' || id === 'app-heart-animation') return 'heart';
    return 'unknown';
  }

  constructor(
    public companionService: CompanionService,
    private entitlementService: EntitlementService,
    private modalCtrl: ModalController,
    private router: Router,
    private orientationService: OrientationService
  ) {
    addIcons({ settingsOutline, refreshOutline, unlinkOutline, wifiOutline, qrCodeOutline, chevronBackOutline, chevronForwardOutline, sparklesOutline });
  }

  ngOnInit() {
    this.orientationService.lockLandscape();

    this.isPro = this.entitlementService.isPro();

    this.subs.add(
      this.entitlementService.tier$.subscribe((tier) => {
        this.isPro = tier === 'pro';
      })
    );

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

  public async openProModal() {
    const modal = await this.modalCtrl.create({
      component: ProModalComponent,
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95,
      handle: true,
    });
    await modal.present();
  }

  ionViewWillEnter() {
    this.orientationService.lockLandscape();
  }

  ionViewWillLeave() {
    this.orientationService.unlock();
  }

  ngAfterViewInit() {
    // this.setupActivityListener();
  }

  ngOnDestroy() {
    this.orientationService.unlock();
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


  public getMediaSourceName(screen: ScreenConfig): string | null {
    if (screen.type !== 'media') {
      return null;
    }
    return screen.config.source?.name ?? null;
  }

  // Button Action Handler
  public onButtonTrigger(event: ButtonAction | ButtonConfig) {
    const action: ButtonAction = 'action' in event && event.action ? event.action : (event as ButtonAction);
    console.log('Button action triggered:', action);
    if (action && action.type && action.payload !== undefined) {
      this.companionService.sendAction(action.type, action.payload);
    }
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
      fromEvent(document, 'touchstart', { passive: true }),
      fromEvent(document, 'click', { passive: true }),
      fromEvent(document, 'mousemove', { passive: true }),
      fromEvent(document, 'keydown', { passive: true })
    );

    const inactivitySub = activityEvents$.pipe(
      // Show immediately on any activity
      tap(() => this.showElements()),
      // Reset timer on every activity event (5 seconds)
      switchMap(() => timer(this.INACTIVITY_MS)),
      // Start timer immediately on init
      startWith(0),
      // Dim when timer fires
      tap(() => this.hideElements())
    ).subscribe();

    this.subs.add(inactivitySub);
  }

  private hideElements() {
    this.isInactive = true;
    this.hideableDivs?.forEach(div =>
      div.nativeElement.classList.add('is-dimmed')
    );
  }

  private showElements() {
    this.isInactive = false;
    this.hideableDivs?.forEach(div =>
      div.nativeElement.classList.remove('is-dimmed')
    );
  }
}
