import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanionService } from '../services/companion.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonTextarea,
  IonToast,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCodeOutline, keypadOutline, serverOutline } from 'ionicons/icons';

@Component({
  selector: 'app-pairing',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar color="dark">
        <ion-title>Pair with PC</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" style="--background: #121212;">
      <div class="pairing-container">
        <!-- Main instructions card -->
        <ion-card color="dark">
          <ion-card-header>
            <ion-card-title>Pair Device</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p style="margin-bottom: 16px; color: #a0a0a0;">
              Pair your phone with the StreamDeck Companion desktop application. You can either paste the raw JSON string from your PC settings or enter the IP, Port, and Token manually.
            </p>

            <!-- Mode selector tabs/buttons -->
            <div class="mode-selector">
              <ion-button
                fill="clear"
                [color]="mode === 'json' ? 'primary' : 'medium'"
                (click)="setMode('json')"
                class="mode-btn"
              >
                <ion-icon name="qr-code-outline" slot="start"></ion-icon>
                JSON/QR String
              </ion-button>
              <ion-button
                fill="clear"
                [color]="mode === 'manual' ? 'primary' : 'medium'"
                (click)="setMode('manual')"
                class="mode-btn"
              >
                <ion-icon name="server-outline" slot="start"></ion-icon>
                Manual Entry
              </ion-button>
            </div>

            <!-- JSON String Input Area -->
            <div *ngIf="mode === 'json'">
              <ion-item fill="outline" mode="md" class="input-item ion-margin-bottom">
                <ion-textarea
                  [(ngModel)]="rawJson"
                  placeholder='Paste the pairing JSON string here: {"token": "...", "port": 8080, "ip": "192.168.1.100"}'
                  rows="4"
                ></ion-textarea>
              </ion-item>
              <ion-button expand="block" (click)="pairWithJson()" color="primary" class="action-btn">
                Pair using JSON
              </ion-button>
            </div>

            <!-- Manual Input Fields -->
            <div *ngIf="mode === 'manual'">
              <ion-item fill="outline" mode="md" class="input-item ion-margin-bottom">
                <ion-input
                  [(ngModel)]="ip"
                  placeholder="PC IP Address (e.g., 192.168.1.50)"
                  type="text"
                ></ion-input>
              </ion-item>

              <ion-item fill="outline" mode="md" class="input-item ion-margin-bottom">
                <ion-input
                  [(ngModel)]="port"
                  placeholder="Port (e.g., 8080)"
                  type="number"
                ></ion-input>
              </ion-item>

              <ion-item fill="outline" mode="md" class="input-item ion-margin-bottom">
                <ion-input
                  [(ngModel)]="token"
                  placeholder="Pairing Token (secret)"
                  type="text"
                ></ion-input>
              </ion-item>

              <ion-button expand="block" (click)="pairWithManual()" color="primary" class="action-btn">
                Pair Manually
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Quick Connect Mock / Demo Help -->
        <ion-card color="dark" style="margin-top: 16px;">
          <ion-card-header>
            <ion-card-title style="font-size: 16px;">Localhost Demo Hook</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p style="color: #8a8a8a; font-size: 13px; margin-bottom: 12px;">
              For testing in sandboxed browser environments or localhost web servers.
            </p>
            <ion-button expand="block" fill="outline" color="secondary" (click)="pairWithLocalhost()">
              Pair with Localhost (Port 8080)
            </ion-button>
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
    .pairing-container {
      max-width: 500px;
      margin: 0 auto;
      padding-top: 20px;
    }
    .mode-selector {
      display: flex;
      justify-content: space-around;
      background: #1e1e1e;
      border-radius: 8px;
      margin-bottom: 20px;
      padding: 4px;
    }
    .mode-btn {
      --padding-start: 12px;
      --padding-end: 12px;
      font-weight: 600;
      font-size: 13px;
    }
    .input-item {
      --background: #1a1a1a;
      --color: #ffffff;
      --border-radius: 8px;
    }
    .action-btn {
      margin-top: 10px;
      --border-radius: 8px;
      font-weight: bold;
    }
  `],
  imports: [
    FormsModule,
    NgIf,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonTextarea,
    IonToast,
    IonIcon
  ]
})
export class PairingPage implements OnInit {
  public mode: 'json' | 'manual' = 'json';
  public rawJson = '';
  public ip = '';
  public port: number | null = null;
  public token = '';

  public showToast = false;
  public toastMsg = '';

  constructor(private companionService: CompanionService, private router: Router) {
    addIcons({ qrCodeOutline, keypadOutline, serverOutline });
  }

  ngOnInit() {
    // If already paired, we can redirect or let the user decide.
    // For this flow we just stay unless explicitly redirecting.
  }

  public setMode(mode: 'json' | 'manual') {
    this.mode = mode;
  }

  public pairWithJson() {
    if (!this.rawJson.trim()) {
      this.triggerToast('Please paste a raw JSON pairing string.');
      return;
    }

    try {
      const parsed = JSON.parse(this.rawJson.trim());
      const ip = parsed.ip || parsed.host || parsed.address;
      const port = Number(parsed.port);
      const token = parsed.token;

      if (!ip || !port || !token) {
        this.triggerToast('Invalid JSON. Must include "ip", "port", and "token".');
        return;
      }

      this.companionService.pair(ip, port, token, parsed.name || `PC at ${ip}`);
      this.triggerToast('Successfully Paired with PC!');
      setTimeout(() => {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      }, 1000);
    } catch (e) {
      this.triggerToast('Failed to parse JSON. Please check formatting.');
    }
  }

  public pairWithManual() {
    if (!this.ip.trim() || !this.port || !this.token.trim()) {
      this.triggerToast('Please fill out IP, Port, and Pairing Token.');
      return;
    }

    this.companionService.pair(this.ip.trim(), this.port, this.token.trim());
    this.triggerToast('Successfully Paired with PC!');
    setTimeout(() => {
      this.router.navigateByUrl('/home', { replaceUrl: true });
    }, 1000);
  }

  public pairWithLocalhost() {
    this.companionService.pair('localhost', 8080, 'demo-token', 'Local PC');
    this.triggerToast('Successfully Paired with Localhost!');
    setTimeout(() => {
      this.router.navigateByUrl('/home', { replaceUrl: true });
    }, 1000);
  }

  private triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
  }
}
