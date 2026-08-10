import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
import { qrCodeOutline, keypadOutline, serverOutline, closeOutline } from 'ionicons/icons';
import jsQR from 'jsqr';

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

              <!-- QR Scanning Button -->
              <ion-button expand="block" color="secondary" (click)="startScanning()" class="ion-margin-bottom" style="--border-radius: 8px; font-weight: bold;">
                <ion-icon name="qr-code-outline" slot="start"></ion-icon>
                Scan QR Code
              </ion-button>

              <ion-button expand="block" (click)="pairWithJson()" color="primary" class="action-btn">
                Pair using JSON
              </ion-button>
            </div>

            <!-- Manual Input Fields -->
            @if (mode === 'manual') {
              <div>
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
            }
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

      <!-- QR Scanner Overlay -->
      <div *ngIf="scanning" class="scanner-overlay">
        <div class="scanner-header">
          <span class="scanner-title">Scan QR Code</span>
          <ion-button fill="clear" color="light" (click)="stopScanning()" class="scanner-close-btn">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
        <div class="scanner-viewport">
          <video #videoElement autoplay playsinline muted class="scanner-video"></video>
          <canvas #canvasElement style="display: none;"></canvas>

          <!-- Animated Laser overlay -->
          <div class="scanner-box">
            <div class="scanner-laser"></div>
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>
        </div>
        <div class="scanner-instructions">
          Align the QR code from the desktop app within the square to scan.
        </div>
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

    /* Scanner Full Screen Overlay styles */
    .scanner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #000000;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #ffffff;
    }
    .scanner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: rgba(0, 0, 0, 0.8);
    }
    .scanner-title {
      font-size: 18px;
      font-weight: bold;
    }
    .scanner-close-btn {
      --padding-end: 0;
      --padding-start: 0;
      margin: 0;
    }
    .scanner-viewport {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #000;
    }
    .scanner-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
    }
    .scanner-box {
      position: relative;
      width: 250px;
      height: 250px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      box-shadow: 0 0 0 4000px rgba(0, 0, 0, 0.6);
      z-index: 10;
      box-sizing: border-box;
    }
    .scanner-laser {
      width: 100%;
      height: 2px;
      background-color: #3880ff;
      position: absolute;
      top: 0;
      left: 0;
      box-shadow: 0 0 8px 2px #3880ff;
      animation: laser-scan 2.5s infinite linear;
    }
    @keyframes laser-scan {
      0% { top: 0; }
      50% { top: 100%; }
      100% { top: 0; }
    }
    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border-color: #3880ff;
      border-style: solid;
    }
    .top-left {
      top: -2px;
      left: -2px;
      border-width: 4px 0 0 4px;
      border-top-left-radius: 10px;
    }
    .top-right {
      top: -2px;
      right: -2px;
      border-width: 4px 4px 0 0;
      border-top-right-radius: 10px;
    }
    .bottom-left {
      bottom: -2px;
      left: -2px;
      border-width: 0 0 4px 4px;
      border-bottom-left-radius: 10px;
    }
    .bottom-right {
      bottom: -2px;
      right: -2px;
      border-width: 0 4px 4px 0;
      border-bottom-right-radius: 10px;
    }
    .scanner-instructions {
      padding: 24px;
      text-align: center;
      background: rgba(0, 0, 0, 0.8);
      font-size: 14px;
      color: #cccccc;
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
export class PairingPage implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  public mode: 'json' | 'manual' = 'json';
  public rawJson = '';
  public ip = '';
  public port: number | null = null;
  public token = '';

  public showToast = false;
  public toastMsg = '';

  // QR Scanning variables
  public scanning = false;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  constructor(private companionService: CompanionService, private router: Router) {
    addIcons({ qrCodeOutline, keypadOutline, serverOutline, closeOutline });
  }

  ngOnInit() {
    // If already paired, we can redirect or let the user decide.
    // For this flow we just stay unless explicitly redirecting.
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  public setMode(mode: 'json' | 'manual') {
    this.mode = mode;
  }

  public async startScanning() {
    this.scanning = true;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Wait a moment for the component update to render videoElement
      setTimeout(() => {
        if (this.videoElement && this.mediaStream) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
          this.videoElement.nativeElement.setAttribute('playsinline', 'true'); // required to tell iOS safari we don't want fullscreen
          this.videoElement.nativeElement.play();
          this.animationFrameId = requestAnimationFrame(() => this.scanFrame());
        }
      }, 100);

    } catch (err) {
      console.error('Error accessing camera:', err);
      this.triggerToast('Unable to access camera. Please verify camera permissions.');
      this.scanning = false;
    }
  }

  public stopScanning() {
    this.scanning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  private scanFrame() {
    if (!this.scanning || !this.videoElement || !this.canvasElement) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        this.handleScannedCode(code.data);
        return; // stop scanning after successful scan
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.scanFrame());
  }

  private handleScannedCode(codeData: string) {
    this.stopScanning();
    try {
      const parsed = JSON.parse(codeData.trim());
      const ip = parsed.ip || parsed.host || parsed.address;
      const port = Number(parsed.port);
      const token = parsed.token;

      if (!ip || !port || !token) {
        this.triggerToast('Scanned QR code invalid. Must include "ip", "port", and "token".');
        return;
      }

      this.companionService.pair(ip, port, token, parsed.name || `PC at ${ip}`);
      this.triggerToast('Successfully Paired with PC!');
      setTimeout(() => {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      }, 1000);
    } catch (e) {
      this.triggerToast('Failed to parse QR code. Invalid JSON format.');
    }
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
