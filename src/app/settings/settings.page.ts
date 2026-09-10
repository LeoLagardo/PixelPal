import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CompanionService } from '../services/companion.service';
import { SoundService, SOUND_PRESETS } from '../services/sound.service';
import { EntitlementService } from '../services/entitlement.service';
import { BillingService } from '../services/billing.service';
import { ProModalComponent } from '../components/pro-modal/pro-modal.component';
import { PairedDevice, SoundPreset, SoundSettings, SoundTuneId } from '../models';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonToast,
  IonBadge,
  IonToggle,
  IonRange,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  trashOutline,
  globeOutline,
  mailOutline,
  informationCircleOutline,
  refreshOutline,
  radioOutline,
  searchOutline,
  desktopOutline,
  checkmarkCircleOutline,
  volumeHighOutline,
  volumeMuteOutline,
  volumeMediumOutline,
  musicalNotesOutline,
  playOutline,
  sparklesOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonSpinner,
    IonToast,
    IonBadge,
    IonToggle,
    IonRange
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar color="dark">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title>Settings & Preferences</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" style="--background: #121212;">
      <div class="settings-container">
        <!-- Button Audio Feedback Card -->
        <ion-card color="dark" class="settings-card audio-card">
          <ion-card-content>
            <div class="section-header">
              <div class="header-with-icon">
                <ion-icon name="musical-notes-outline" class="header-icon"></ion-icon>
                <h3 class="section-title">Button Click Tunes</h3>
              </div>
              <ion-badge [color]="soundSettings.enabled ? 'success' : 'medium'">
                {{ soundSettings.enabled ? 'Active' : 'Muted' }}
              </ion-badge>
            </div>

            <!-- Master Toggle -->
            <div class="sound-toggle-row">
              <div class="toggle-info">
                <span class="toggle-title">Play Audio on Click</span>
                <span class="toggle-subtitle">Audible feedback when pressing deck buttons</span>
              </div>
              <ion-toggle
                [checked]="soundSettings.enabled"
                (ionChange)="onToggleSound($event)"
                color="primary"
              ></ion-toggle>
            </div>

            @if (soundSettings.enabled) {
              <div class="audio-controls-container">
                <!-- Tune Selection Header -->
                <div class="tune-section-label">
                  <span>SELECT TUNE / SOUND PROFILE</span>
                </div>

                <!-- Tunes List Grid -->
                <div class="tunes-grid">
                  @for (preset of presets; track preset.id) {
                    <div
                      class="tune-card"
                      [class.is-selected]="soundSettings.tune === preset.id"
                      (click)="selectTune(preset.id)"
                    >
                      <div class="tune-info">
                        <div class="tune-title-row">
                          <span class="tune-name">{{ preset.name }}</span>
                          <span class="category-tag" [attr.data-category]="preset.category">
                            {{ preset.category }}
                          </span>
                        </div>
                        <span class="tune-desc">{{ preset.description }}</span>
                      </div>

                      <div class="tune-actions">
                        <button
                          type="button"
                          class="tune-preview-btn"
                          [class.is-active-tune]="soundSettings.tune === preset.id"
                          (click)="previewTune(preset.id, $event)"
                          title="Preview Tune"
                        >
                          <ion-icon name="play-outline"></ion-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <!-- Volume Slider Control -->
                <div class="volume-container">
                  <div class="volume-header">
                    <span class="volume-label">
                      <ion-icon name="volume-medium-outline" style="vertical-align: middle; margin-right: 4px;"></ion-icon>
                      Volume Level
                    </span>
                    <span class="volume-value">{{ volumePercent }}%</span>
                  </div>

                  <div class="volume-slider-row">
                    <ion-icon name="volume-mute-outline" class="vol-icon"></ion-icon>
                    <ion-range
                      [min]="0"
                      [max]="100"
                      [step]="1"
                      [value]="volumePercent"
                      (ionChange)="onVolumeChange($event)"
                      color="primary"
                      class="custom-range"
                    ></ion-range>
                    <ion-icon name="volume-high-outline" class="vol-icon"></ion-icon>
                  </div>
                </div>

                <!-- Test Sound Quick Action -->
                <div class="test-sound-action">
                  <ion-button
                    expand="block"
                    fill="outline"
                    color="primary"
                    size="small"
                    (click)="testCurrentTune()"
                  >
                    <ion-icon name="play-outline" slot="start"></ion-icon>
                    Test Active Tune
                  </ion-button>
                </div>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Entitlement & License Tier Card -->
        <ion-card color="dark" class="settings-card license-card">
          <ion-card-content>
            <div class="section-header">
              <div class="header-with-icon">
                <ion-icon name="sparkles-outline" class="header-icon" style="color: #a855f7;"></ion-icon>
                <h3 class="section-title" style="color: #a855f7;">Membership & Entitlements</h3>
              </div>
              <ion-badge [color]="isProTier ? 'tertiary' : 'medium'">
                {{ isProTier ? 'PRO MEMBER' : 'FREE TIER' }}
              </ion-badge>
            </div>

            <p style="color: #bbbbbb; font-size: 13px; margin-bottom: 14px;">
              {{ isProTier 
                ? '⭐ Lifetime PRO unlocked! Unlimited screens, multi-device support, custom media & all themes active.' 
                : 'Free tier active (Limit: 2 screens, 1 connected device). Upgrade once to unlock all capabilities forever.' }}
            </p>

            @if (!isProTier) {
              <div class="pro-upgrade-card" (click)="openProModal()">
                <div class="upgrade-card-content">
                  <div class="upgrade-card-title-row">
                    <span class="upgrade-title">Upgrade to Lifetime PRO</span>
                    <span class="upgrade-price-badge">{{ formattedPrice }}</span>
                  </div>
                  <span class="upgrade-subtitle">One-time payment • No subscriptions • Lifetime access</span>
                </div>
              </div>
            }

            <div class="license-footer-row">
              <button type="button" class="restore-link-btn" (click)="restorePurchases()">
                <ion-icon name="refresh-outline"></ion-icon>
                <span>Restore Purchase</span>
              </button>

              <button type="button" class="dev-toggle-link" (click)="toggleDevTier()">
                <span>{{ isProTier ? 'Switch to Free (Test)' : 'Switch to Pro (Test)' }}</span>
              </button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Paired Devices Card -->
        <ion-card color="dark" class="settings-card">
          <ion-card-content>
            <div class="section-header">
              <h3 class="section-title">Paired PC</h3>
              @if (device) {
                <ion-badge color="success">Saved</ion-badge>
              }
            </div>

            @if (device) {
              <div class="device-card-content">
                <div class="device-info">
                  <div class="device-details">
                    <span class="device-name">{{ device.device_name || device.name || 'PC Connection' }}</span>
                    <span class="device-address">ws://{{ device.ip }}:{{ device.port || 53535 }}</span>
                    <span class="device-ports">UDP: {{ device.udp_port || 53537 }} | Media: {{ device.media_port || 53536 }}</span>
                    <span class="device-token">Token: {{ device.token }}</span>
                  </div>
                </div>

                <div class="device-actions">
                  <ion-button
                    color="primary"
                    fill="outline"
                    size="small"
                    [disabled]="isRediscovering"
                    (click)="rediscoverPC()"
                  >
                    @if (isRediscovering) {
                      <ion-spinner name="crescent" slot="start"></ion-spinner>
                      Discovering...
                    } @else {
                      <ion-icon name="radio-outline" slot="start"></ion-icon>
                      Rediscover PC (UDP)
                    }
                  </ion-button>

                  <ion-button color="danger" fill="outline" size="small" (click)="forgetDevice()">
                    <ion-icon name="trash-outline" slot="start"></ion-icon>
                    Forget
                  </ion-button>
                </div>
              </div>
            } @else {
              <div class="no-device-state">
                <p>No PC paired currently.</p>
                <ion-button size="small" color="primary" (click)="goToPairing()">
                  Pair a Device
                </ion-button>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Network Discovery Quick Action -->
        <ion-card color="dark" class="settings-card">
          <ion-card-content>
            <h3 class="section-title">Network Discovery</h3>
            <p style="color: #a0a0a0; font-size: 13px; margin-bottom: 14px;">
              Scan your Wi-Fi network to detect running PixelPal PC servers without manual configuration.
            </p>
            <ion-button expand="block" color="secondary" fill="outline" (click)="goToPairing()">
              <ion-icon name="search-outline" slot="start"></ion-icon>
              Open Server Scanner
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- App Information Card -->
        <ion-card color="dark" class="settings-card">
          <ion-card-content>
            <h3 class="section-title">About App</h3>
            <ion-list lines="none" class="info-list">
              <ion-item class="info-item">
                <ion-label>
                  <h2>Application Version</h2>
                  <p>1.0.0 (Build 240)</p>
                </ion-label>
              </ion-item>

              <ion-item class="info-item">
                <ion-label>
                  <h2>Support & Contact</h2>
                  <p>Get assistance or request custom integrations.</p>
                </ion-label>
              </ion-item>
            </ion-list>

            <div class="support-buttons">
              <ion-button fill="outline" color="light" href="https://github.com" target="_blank" size="small">
                <ion-icon name="globe-outline" slot="start"></ion-icon>
                Website
              </ion-button>
              <ion-button fill="outline" color="light" href="mailto:support@companionapp.io" size="small">
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                Email Support
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <ion-toast
        [isOpen]="showToast"
        [message]="toastMsg"
        [duration]="3000"
        (didDismiss)="showToast = false"
      ></ion-toast>
    </ion-content>
  `,
  styles: [`
    .settings-container {
      max-width: 540px;
      margin: 0 auto;
    }
    .settings-card {
      margin-bottom: 20px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: #1a1a1a;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .header-with-icon {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-icon {
      color: #3880ff;
      font-size: 18px;
    }
    .section-title {
      color: #3880ff;
      font-size: 15px;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Sound Settings Styles */
    .sound-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #222222;
      border-radius: 10px;
      margin-bottom: 16px;
    }

    /* Pro Upgrade Card in Settings */
    .pro-upgrade-card {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%);
      border: 1px solid rgba(168, 85, 247, 0.5);
      border-radius: 12px;
      padding: 14px 16px;
      cursor: pointer;
      margin-bottom: 14px;
      transition: all 0.2s ease;
    }
    .pro-upgrade-card:active {
      transform: scale(0.98);
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(99, 102, 241, 0.35) 100%);
    }
    .upgrade-card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .upgrade-card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .upgrade-title {
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.2px;
    }
    .upgrade-price-badge {
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.3px;
    }
    .upgrade-subtitle {
      font-size: 12px;
      color: #cbd5e1;
    }
    .license-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .restore-link-btn {
      background: transparent;
      border: none;
      color: #a855f7;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 4px 0;
    }
    .dev-toggle-link {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 11px;
      font-family: monospace;
      cursor: pointer;
      padding: 4px 0;
    }
    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .toggle-title {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
    }
    .toggle-subtitle {
      color: #999999;
      font-size: 12px;
    }
    .audio-controls-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
      animation: fadeIn 0.2s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .tune-section-label {
      color: #777777;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      margin-top: 4px;
    }
    .tunes-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .tune-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #242424;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    .tune-card:hover {
      background: #2a2a2a;
      border-color: rgba(56, 128, 255, 0.3);
    }
    .tune-card.is-selected {
      background: rgba(56, 128, 255, 0.12);
      border-color: #3880ff;
    }
    .tune-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .tune-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tune-name {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
    }
    .category-tag {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      background: #333333;
      color: #bbbbbb;
    }
    .category-tag[data-category='tactile'] {
      background: rgba(0, 180, 216, 0.2);
      color: #00b4d8;
    }
    .category-tag[data-category='retro'] {
      background: rgba(255, 170, 0, 0.2);
      color: #ffaa00;
    }
    .category-tag[data-category='modern'] {
      background: rgba(46, 204, 113, 0.2);
      color: #2ecc71;
    }
    .category-tag[data-category='scifi'] {
      background: rgba(168, 85, 247, 0.2);
      color: #c084fc;
    }
    .tune-desc {
      color: #888888;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tune-actions {
      margin-left: 10px;
    }
    .tune-preview-btn {
      background: #333333;
      border: none;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .tune-preview-btn:hover {
      background: #3880ff;
      transform: scale(1.08);
    }
    .tune-preview-btn.is-active-tune {
      background: #3880ff;
    }

    /* Volume Slider */
    .volume-container {
      background: #222222;
      padding: 12px;
      border-radius: 10px;
      margin-top: 4px;
    }
    .volume-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .volume-label {
      color: #ffffff;
      font-size: 13px;
      font-weight: 500;
    }
    .volume-value {
      color: #3880ff;
      font-size: 13px;
      font-weight: bold;
      font-family: monospace;
    }
    .volume-slider-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .vol-icon {
      color: #888888;
      font-size: 18px;
    }
    .custom-range {
      flex: 1;
      padding-top: 0;
      padding-bottom: 0;
    }
    .test-sound-action {
      margin-top: 2px;
    }

    /* Device styles */
    .device-card-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .device-info {
      background: #1e1e1e;
      padding: 12px;
      border-radius: 8px;
    }
    .device-details {
      display: flex;
      flex-direction: column;
    }
    .device-name {
      color: #ffffff;
      font-weight: bold;
      font-size: 15px;
    }
    .device-address {
      color: #3880ff;
      font-size: 13px;
      margin-top: 3px;
      font-family: monospace;
    }
    .device-ports {
      color: #888888;
      font-size: 11px;
      margin-top: 2px;
    }
    .device-token {
      color: #555555;
      font-size: 11px;
      margin-top: 4px;
      font-family: monospace;
    }
    .device-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    .no-device-state {
      text-align: center;
      padding: 16px 0;
      color: #a0a0a0;
    }
    .info-list {
      background: transparent;
      padding: 0;
    }
    .info-item {
      --background: transparent;
      --padding-start: 0;
      --inner-padding-end: 0;
      margin-bottom: 12px;
    }
    .info-item h2 {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
    }
    .info-item p {
      color: #a0a0a0;
      font-size: 13px;
    }
    .support-buttons {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
  `]
})
export class SettingsPage implements OnInit, OnDestroy {
  public device: PairedDevice | null = null;
  public isRediscovering = false;

  public showToast = false;
  public toastMsg = '';

  // Entitlement
  public isProTier = false;
  public formattedPrice = '$4.99';

  // Sound settings
  public soundSettings: SoundSettings = {
    enabled: true,
    tune: 'mechanical',
    volume: 0.7
  };
  public presets: SoundPreset[] = [];
  public volumePercent = 70;

  private subs = new Subscription();

  constructor(
    private companionService: CompanionService,
    private soundService: SoundService,
    private entitlementService: EntitlementService,
    private billingService: BillingService,
    private modalCtrl: ModalController,
    private router: Router
  ) {
    addIcons({
      arrowBackOutline,
      trashOutline,
      globeOutline,
      mailOutline,
      informationCircleOutline,
      refreshOutline,
      radioOutline,
      searchOutline,
      desktopOutline,
      checkmarkCircleOutline,
      volumeHighOutline,
      volumeMuteOutline,
      volumeMediumOutline,
      musicalNotesOutline,
      playOutline,
      sparklesOutline
    });

    this.presets = this.soundService.getPresets();
    this.isProTier = this.entitlementService.isPro();
    this.formattedPrice = this.billingService.getFormattedPrice();
  }

  ngOnInit() {
    this.subs.add(
      this.companionService.pairedDevice$.subscribe((device) => {
        this.device = device;
      })
    );

    this.subs.add(
      this.entitlementService.tier$.subscribe((tier) => {
        this.isProTier = tier === 'pro';
      })
    );

    this.subs.add(
      this.billingService.productDetails$.subscribe((details) => {
        if (details?.formattedPrice) {
          this.formattedPrice = details.formattedPrice;
        }
      })
    );

    this.subs.add(
      this.soundService.settings$.subscribe((settings) => {
        this.soundSettings = settings;
        this.volumePercent = Math.round(settings.volume * 100);
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
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

  public async restorePurchases() {
    const res = await this.billingService.restorePurchases();
    this.triggerToast(res.message);

    if (res.restored && this.companionService.connectionState$.value === 'connected') {
      this.companionService.disconnect(true);
      setTimeout(() => this.companionService.connect(), 200);
    }
  }

  public toggleDevTier() {
    const nextTier = this.isProTier ? 'free' : 'pro';
    this.entitlementService.setTier(nextTier);
    this.triggerToast(`Simulated tier switched to ${nextTier.toUpperCase()}`);

    if (this.companionService.connectionState$.value === 'connected') {
      this.companionService.disconnect(true);
      setTimeout(() => this.companionService.connect(), 200);
    }
  }

  public onToggleSound(event: any) {
    const isChecked = Boolean(event.detail.checked);
    this.soundService.setEnabled(isChecked);
    if (isChecked) {
      this.soundService.previewTune(this.soundSettings.tune);
    }
  }

  public selectTune(tuneId: SoundTuneId) {
    this.soundService.setTune(tuneId);
    this.soundService.previewTune(tuneId);
  }

  public previewTune(tuneId: SoundTuneId, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.soundService.previewTune(tuneId);
  }

  public onVolumeChange(event: any) {
    const val = event.detail.value;
    if (typeof val === 'number') {
      this.volumePercent = val;
      this.soundService.setVolume(val / 100);
    }
  }

  public testCurrentTune() {
    this.soundService.previewTune(this.soundSettings.tune);
    this.triggerToast(`Playing "${this.soundSettings.tune}" tune preview.`);
  }

  public async rediscoverPC() {
    if (!this.device) return;

    this.isRediscovering = true;
    try {
      const found = await this.companionService.discoverAndReconnect(this.device.token);
      if (found) {
        this.triggerToast('Discovered and reconnected to PC successfully!');
      } else {
        this.triggerToast('Could not find PC via UDP broadcast. Please check if PC is running.');
      }
    } catch (e: any) {
      this.triggerToast('Discovery error: ' + (e?.message || e));
    } finally {
      this.isRediscovering = false;
    }
  }

  public forgetDevice() {
    this.companionService.forgetDevice();
    this.router.navigateByUrl('/pairing', { replaceUrl: true });
  }

  public goToPairing() {
    this.router.navigateByUrl('/pairing');
  }

  private triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
  }
}


