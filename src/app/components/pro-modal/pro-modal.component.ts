import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonToast,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  sparklesOutline,
  checkmarkCircle,
  layersOutline,
  phonePortraitOutline,
  colorPaletteOutline,
  imageOutline,
  flashOutline,
  shieldCheckmarkOutline,
  refreshOutline
} from 'ionicons/icons';
import { BillingService } from '../../services/billing.service';
import { EntitlementService } from '../../services/entitlement.service';

@Component({
  selector: 'app-pro-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonSpinner,
    IonToast
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="modal-toolbar">
        <ion-buttons slot="end">
          <ion-button fill="clear" color="medium" (click)="dismiss()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="pro-modal-content">
      <div class="pro-container">
        <!-- Hero Header -->
        <div class="pro-hero">
          <div class="crown-badge">
            <ion-icon name="sparkles-outline"></ion-icon>
          </div>
          <h1 class="pro-title">PixelPal <span class="gradient-text">PRO</span></h1>
          <p class="pro-subtitle">One-Time Lifetime Unlock • No Subscriptions</p>
          <div class="hero-tags">
            <span class="pill-tag">Single Payment</span>
            <span class="pill-tag">Google Play Linked</span>
            <span class="pill-tag">No Accounts</span>
          </div>
        </div>

        <!-- Features List -->
        <div class="features-grid">
          <div class="feature-row">
            <div class="feature-icon-box bg-purple">
              <ion-icon name="layers-outline"></ion-icon>
            </div>
            <div class="feature-text">
              <span class="feature-heading">Unlimited Screens & Tabs</span>
              <span class="feature-desc">Build limitless control panels for gaming, streaming, editing & productivity (Free is capped at 2).</span>
            </div>
          </div>

          <div class="feature-row">
            <div class="feature-icon-box bg-indigo">
              <ion-icon name="phone-portrait-outline"></ion-icon>
            </div>
            <div class="feature-text">
              <span class="feature-heading">Multi-Device Companion</span>
              <span class="feature-desc">Connect phone and tablet simultaneously to the same desktop app at once.</span>
            </div>
          </div>

          <div class="feature-row">
            <div class="feature-icon-box bg-pink">
              <ion-icon name="color-palette-outline"></ion-icon>
            </div>
            <div class="feature-text">
              <span class="feature-heading">All Premium Themes</span>
              <span class="feature-desc">Unlock Cyberpunk, Synthwave 80s, Aurora Borealis, Obsidian Gold & Royal Matrix themes.</span>
            </div>
          </div>

          <div class="feature-row">
            <div class="feature-icon-box bg-cyan">
              <ion-icon name="image-outline"></ion-icon>
            </div>
            <div class="feature-text">
              <span class="feature-heading">Custom GIF & Image Backgrounds</span>
              <span class="feature-desc">Personalize any screen with custom animations, wallpapers, or transparent backgrounds.</span>
            </div>
          </div>

          <div class="feature-row">
            <div class="feature-icon-box bg-emerald">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
            </div>
            <div class="feature-text">
              <span class="feature-heading">100% Private & Direct</span>
              <span class="feature-desc">Zero ads, zero telemetries. Operates completely offline over your local Wi-Fi network.</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-section">
          @if (isPro) {
            <div class="already-pro-box">
              <ion-icon name="checkmark-circle" class="check-icon"></ion-icon>
              <span>You own Lifetime PRO! All features unlocked.</span>
            </div>
          } @else {
            <button
              type="button"
              class="purchase-btn"
              [disabled]="isPurchasing || isRestoring"
              (click)="onPurchase()"
            >
              @if (isPurchasing) {
                <ion-spinner name="crescent"></ion-spinner>
                <span>Connecting to Google Play...</span>
              } @else {
                <span class="btn-main-text">Unlock Lifetime Pro</span>
                <span class="btn-price-badge">{{ formattedPrice }}</span>
              }
            </button>
          }

          <div class="restore-row">
            <button
              type="button"
              class="restore-btn"
              [disabled]="isPurchasing || isRestoring"
              (click)="onRestore()"
            >
              @if (isRestoring) {
                <ion-spinner name="dots" style="width: 16px; height: 16px;"></ion-spinner>
              } @else {
                <ion-icon name="refresh-outline"></ion-icon>
              }
              <span>Restore Prior Purchase</span>
            </button>
          </div>

          <p class="footer-guarantee">
            One-time purchase tied to your Google Play account. Restores automatically on new devices or reinstalls.
          </p>
        </div>
      </div>

      <ion-toast
        [isOpen]="showToast"
        [message]="toastMsg"
        [duration]="3200"
        (didDismiss)="showToast = false"
      ></ion-toast>
    </ion-content>
  `,
  styles: [`
    .modal-toolbar {
      --background: #111116;
      --border-width: 0;
      padding-top: 4px;
    }
    .pro-modal-content {
      --background: #111116;
    }
    .pro-container {
      max-width: 480px;
      margin: 0 auto;
      padding: 0 20px 32px 20px;
      display: flex;
      flex-direction: column;
    }
    .pro-hero {
      text-align: center;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .crown-badge {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(168, 85, 247, 0.35);
      margin-bottom: 12px;
    }
    .crown-badge ion-icon {
      font-size: 28px;
      color: #ffffff;
    }
    .pro-title {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }
    .gradient-text {
      background: linear-gradient(90deg, #c084fc 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .pro-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 0 0 14px 0;
      font-weight: 500;
    }
    .hero-tags {
      display: flex;
      gap: 6px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .pill-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .features-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 28px;
    }
    .feature-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 12px 14px;
      border-radius: 12px;
    }
    .feature-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .feature-icon-box ion-icon {
      font-size: 20px;
      color: #ffffff;
    }
    .bg-purple  { background: linear-gradient(135deg, #9333ea, #7e22ce); }
    .bg-indigo  { background: linear-gradient(135deg, #4f46e5, #4338ca); }
    .bg-pink    { background: linear-gradient(135deg, #db2777, #be185d); }
    .bg-cyan    { background: linear-gradient(135deg, #0284c7, #0369a1); }
    .bg-emerald { background: linear-gradient(135deg, #059669, #047857); }

    .feature-text {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .feature-heading {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .feature-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.35;
    }
    .actions-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }
    .purchase-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-radius: 14px;
      border: none;
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
      color: #ffffff;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4);
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    .purchase-btn:active {
      transform: scale(0.98);
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
    }
    .purchase-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-price-badge {
      background: rgba(0, 0, 0, 0.25);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .already-pro-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-weight: 600;
      font-size: 14px;
    }
    .check-icon {
      font-size: 20px;
    }
    .restore-row {
      display: flex;
      justify-content: center;
    }
    .restore-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 6px 12px;
    }
    .restore-btn:hover {
      color: #cbd5e1;
    }
    .footer-guarantee {
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin: 4px 0 0 0;
      line-height: 1.4;
    }
  `]
})
export class ProModalComponent implements OnInit, OnDestroy {
  public formattedPrice = '$4.99';
  public isPurchasing = false;
  public isRestoring = false;
  public isPro = false;

  public showToast = false;
  public toastMsg = '';

  private subs = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private billingService: BillingService,
    private entitlementService: EntitlementService
  ) {
    addIcons({
      closeOutline,
      sparklesOutline,
      checkmarkCircle,
      layersOutline,
      phonePortraitOutline,
      colorPaletteOutline,
      imageOutline,
      flashOutline,
      shieldCheckmarkOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    this.isPro = this.entitlementService.isPro();
    this.formattedPrice = this.billingService.getFormattedPrice();

    this.subs.add(
      this.entitlementService.tier$.subscribe((tier) => {
        this.isPro = tier === 'pro';
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
      this.billingService.isPurchasing$.subscribe((val) => {
        this.isPurchasing = val;
      })
    );

    this.subs.add(
      this.billingService.isRestoring$.subscribe((val) => {
        this.isRestoring = val;
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  public async onPurchase() {
    const res = await this.billingService.purchasePro();
    if (res.success) {
      this.triggerToast('🎉 Welcome to PixelPal PRO! All features unlocked.');
      setTimeout(() => this.dismiss(), 1500);
    } else if (res.cancelled) {
      // User dismissed Google Play sheet - no toast needed
    } else if (res.error) {
      this.triggerToast(res.error);
    }
  }

  public async onRestore() {
    const res = await this.billingService.restorePurchases();
    this.triggerToast(res.message);
    if (res.restored) {
      setTimeout(() => this.dismiss(), 1500);
    }
  }

  public dismiss() {
    this.modalCtrl.dismiss();
  }

  private triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
  }
}
