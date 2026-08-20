import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanionService } from '../services/companion.service';
import { PairedDevice, DiscoveredDevice } from '../models';
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
  IonBadge
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
  checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar color="dark">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title>Settings & Devices</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" style="--background: #121212;">
      <div class="settings-container">
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
              Scan your Wi-Fi network to detect running StreamDeck Companion PC servers without manual configuration.
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
      max-width: 500px;
      margin: 0 auto;
    }
    .settings-card {
      margin-bottom: 20px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-title {
      color: #3880ff;
      font-size: 15px;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
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
  `],
  imports: [
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
    IonBadge
  ]
})
export class SettingsPage implements OnInit {
  public device: PairedDevice | null = null;
  public isRediscovering = false;

  public showToast = false;
  public toastMsg = '';

  constructor(private companionService: CompanionService, private router: Router) {
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
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.companionService.pairedDevice$.subscribe((device) => {
      this.device = device;
    });
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

