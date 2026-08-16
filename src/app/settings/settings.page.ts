import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanionService } from '../services/companion.service';
import { PairedDevice } from '../models';
import { NgIf } from '@angular/common';
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
  IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  trashOutline,
  globeOutline,
  mailOutline,
  informationCircleOutline
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
            <h3 class="section-title">Paired Device</h3>

            <div *ngIf="device; else noDevice" class="device-info">
              <div class="device-details">
                <span class="device-name">{{ device.name || 'PC Connection' }}</span>
                <span class="device-address">ws://{{ device.ip }}:{{ device.port }}</span>
                <span class="device-token">Token: {{ device.token }}</span>
              </div>
              <ion-button color="danger" fill="outline" size="small" (click)="forgetDevice()">
                <ion-icon name="trash-outline" slot="start"></ion-icon>
                Forget
              </ion-button>
            </div>

            <ng-template #noDevice>
              <div class="no-device-state">
                <p>No PC paired currently.</p>
                <ion-button size="small" color="primary" (click)="goToPairing()">
                  Pair a Device
                </ion-button>
              </div>
            </ng-template>
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
    .section-title {
      color: #3880ff;
      font-size: 16px;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .device-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
      color: #a0a0a0;
      font-size: 13px;
      margin-top: 2px;
    }
    .device-token {
      color: #666666;
      font-size: 11px;
      margin-top: 4px;
      font-family: monospace;
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
    NgIf,
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
    IonCardContent
  ]
})
export class SettingsPage implements OnInit {
  public device: PairedDevice | null = null;

  constructor(private companionService: CompanionService, private router: Router) {
    addIcons({ arrowBackOutline, trashOutline, globeOutline, mailOutline, informationCircleOutline });
  }

  ngOnInit() {
    this.companionService.pairedDevice$.subscribe((device) => {
      this.device = device;
    });
  }

  public forgetDevice() {
    this.companionService.forgetDevice();
    this.router.navigateByUrl('/pairing', { replaceUrl: true });
  }

  public goToPairing() {
    this.router.navigateByUrl('/pairing');
  }
}
