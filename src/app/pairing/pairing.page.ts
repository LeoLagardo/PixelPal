import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CompanionService } from '../services/companion.service';
import { DiscoveredDevice, PairedDevice } from '../models';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonTextarea,
  IonToast,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonAccordion,
  IonAccordionGroup
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  qrCodeOutline,
  serverOutline,
  closeOutline,
  radioOutline,
  searchOutline,
  refreshOutline,
  checkmarkCircleOutline,
  desktopOutline,
  flashOutline,
  arrowBackOutline,
  wifiOutline,
  keyOutline,
  clipboardOutline,
  helpCircleOutline,
  codeSlashOutline,
  chevronForwardOutline,
  informationCircleOutline,
  laptopOutline,
  hardwareChipOutline,
  scanOutline,
  alertCircleOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import jsQR from 'jsqr';

@Component({
  selector: 'app-pairing',
  templateUrl: 'pairing.page.html',
  styleUrls: ['pairing.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonButtons,
    IonBackButton,
    IonTextarea,
    IonToast,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonAccordion,
    IonAccordionGroup
  ]
})
export class PairingPage implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  public mode: 'qr' | 'scan' | 'manual' = 'qr';
  public rawJson = '';
  public ip = '';
  public port: number | null = 53535;
  public udpPort: number | null = 53537;
  public deviceName = '';
  public token = '';

  // Network Scan states
  public isScanning = false;
  public hasScanned = false;
  public discoveredDevices: DiscoveredDevice[] = [];
  public selectedDeviceForPairing: DiscoveredDevice | null = null;
  public scanPairToken = '';

  public showToast = false;
  public toastMsg = '';

  // QR Scanning variables
  public scanning = false;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  constructor(private companionService: CompanionService, private router: Router) {
    addIcons({
      qrCodeOutline,
      serverOutline,
      closeOutline,
      radioOutline,
      searchOutline,
      refreshOutline,
      checkmarkCircleOutline,
      desktopOutline,
      flashOutline,
      arrowBackOutline,
      wifiOutline,
      keyOutline,
      clipboardOutline,
      helpCircleOutline,
      codeSlashOutline,
      chevronForwardOutline,
      informationCircleOutline,
      laptopOutline,
      hardwareChipOutline,
      scanOutline,
      alertCircleOutline,
      shieldCheckmarkOutline
    });
  }

  ngOnInit() {
    // On native devices default to scan or qr; on web default to qr
    if (Capacitor.isNativePlatform()) {
      this.mode = 'scan';
      this.triggerNetworkScan();
    } else {
      this.mode = 'qr';
    }
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  public setMode(mode: 'qr' | 'scan' | 'manual') {
    this.mode = mode;
    if (mode === 'scan' && !this.hasScanned) {
      this.triggerNetworkScan();
    }
  }

  public onSegmentChange(event: any) {
    const val = event?.detail?.value;
    if (val === 'qr' || val === 'scan' || val === 'manual') {
      this.setMode(val);
    }
  }

  public onJsonInput(event: any) {
    if (event?.detail?.value !== undefined) {
      this.rawJson = event.detail.value;
    }
  }

  public async pasteFromClipboard() {
    try {
      if (!navigator?.clipboard?.readText) {
        this.triggerToast('Clipboard API not available in this browser environment.');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        this.triggerToast('Clipboard is empty.');
        return;
      }
      const clean = text.trim();
      if (clean.includes('{') && clean.includes('}')) {
        this.rawJson = clean;
        this.parseAndPair(clean);
      } else if (clean.length === 4 && /^\d+$/.test(clean)) {
        this.token = clean;
        this.mode = 'manual';
        this.triggerToast(`Pasted PIN: ${clean}. Enter your PC IP address to pair.`);
      } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(clean)) {
        this.ip = clean;
        this.mode = 'manual';
        this.triggerToast(`Pasted PC IP: ${clean}. Enter your 4-digit PIN to pair.`);
      } else {
        this.rawJson = clean;
        this.parseAndPair(clean);
      }
    } catch (err: any) {
      this.triggerToast('Unable to read clipboard. You can paste into the fields manually.');
    }
  }

  public async triggerNetworkScan() {
    this.isScanning = true;
    this.hasScanned = true;
    this.selectedDeviceForPairing = null;

    try {
      this.discoveredDevices = await this.companionService.scanNetwork(2500, 53537);
      if (this.discoveredDevices.length === 0 && Capacitor.isNativePlatform()) {
        this.triggerToast('No active PCs found on local Wi-Fi. Make sure PixelPal is open on your PC.');
      }
    } catch (e: any) {
      this.triggerToast('Network scan error: ' + (e?.message || e));
    } finally {
      this.isScanning = false;
    }
  }

  public selectDiscoveredDevice(dev: DiscoveredDevice) {
    const existingToken = this.token.trim() || this.companionService.pairedDevice$.value?.token || '';
    if (existingToken && dev.token_matched) {
      this.executePairing({
        ip: dev.ip,
        port: dev.port || 53535,
        token: existingToken,
        name: dev.device_name || dev.name,
        device_name: dev.device_name || dev.name,
        media_port: dev.media_port || 53536,
        udp_port: dev.udp_port || 53537
      });
    } else {
      this.selectedDeviceForPairing = dev;
      this.scanPairToken = existingToken;
    }
  }

  public confirmDiscoveredPairing() {
    if (!this.selectedDeviceForPairing) return;
    if (!this.scanPairToken.trim()) {
      this.triggerToast('Please enter the 4-digit PIN shown in PixelPal on your PC.');
      return;
    }

    const dev = this.selectedDeviceForPairing;
    this.executePairing({
      ip: dev.ip,
      port: dev.port || 53535,
      token: this.scanPairToken.trim(),
      name: dev.device_name || dev.name,
      device_name: dev.device_name || dev.name,
      media_port: dev.media_port || 53536,
      udp_port: dev.udp_port || 53537
    });
  }

  public async startScanning() {
    this.scanning = true;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      setTimeout(() => {
        if (this.videoElement && this.mediaStream) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
          this.videoElement.nativeElement.setAttribute('playsinline', 'true');
          this.videoElement.nativeElement.play();
          this.animationFrameId = requestAnimationFrame(() => this.scanFrame());
        }
      }, 100);

    } catch (err) {
      console.error('Error accessing camera:', err);
      this.triggerToast('Unable to access camera. Please check camera permissions or use Auto-Detect.');
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
        return;
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.scanFrame());
  }

  private handleScannedCode(codeData: string) {
    this.stopScanning();
    this.parseAndPair(codeData);
  }

  public pairWithJson() {
    if (!this.rawJson || !this.rawJson.trim()) {
      this.triggerToast('Please paste a pairing JSON string.');
      return;
    }
    this.parseAndPair(this.rawJson);
  }

  public parseAndPair(inputStr: string) {
    if (!inputStr) {
      this.triggerToast('Pairing data is empty.');
      return;
    }

    try {
      let cleanStr = inputStr.trim();

      // 1. Remove markdown code fences ```json ... ``` or ``` ... ```
      cleanStr = cleanStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      // 2. Remove leading "json" if pasted without quotes
      if (cleanStr.toLowerCase().startsWith('json')) {
        cleanStr = cleanStr.substring(4).trim();
      }

      // 3. Extract JSON object substring between first '{' and last '}'
      const firstBrace = cleanStr.indexOf('{');
      const lastBrace = cleanStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanStr = cleanStr.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleanStr);

      // Support all schema variations (ip, host, address, hostname, url)
      let ip = parsed.ip || parsed.host || parsed.address || parsed.hostname;
      if (!ip && parsed.url) {
        try {
          const u = new URL(parsed.url);
          ip = u.hostname;
        } catch (_) {}
      }

      const port = Number(parsed.port) || 53535;
      const token = parsed.token || parsed.auth_token || parsed.secret || parsed.key || parsed.pin;
      const mediaPort = parsed.media_port ? Number(parsed.media_port) : 53536;
      const udpPort = parsed.udp_port ? Number(parsed.udp_port) : 53537;
      const deviceName = parsed.device_name || parsed.name || parsed.hostname || `PC at ${ip}`;

      if (!ip || !token) {
        this.triggerToast('Invalid pairing data. Missing PC IP address or pairing PIN.');
        return;
      }

      this.executePairing({
        ip: String(ip).trim(),
        port,
        token: String(token).trim(),
        name: deviceName,
        device_name: deviceName,
        media_port: mediaPort,
        udp_port: udpPort
      });
    } catch (e: any) {
      console.error('[PairingPage] JSON parse error:', e, inputStr);
      this.triggerToast('Failed to parse pairing data. Please check code or try manual PIN.');
    }
  }

  public pairWithManual() {
    if (!this.ip.trim() || !this.token.trim()) {
      this.triggerToast('Please fill out both the PC IP address and pairing PIN.');
      return;
    }

    const port = this.port || 53535;
    const udpPort = this.udpPort || 53537;
    const name = this.deviceName.trim() || `PC at ${this.ip.trim()}`;

    this.executePairing({
      ip: this.ip.trim(),
      port,
      token: this.token.trim(),
      name,
      device_name: name,
      media_port: 53536,
      udp_port: udpPort
    });
  }

  public pairWithLocalhost() {
    this.executePairing({
      ip: '127.0.0.1',
      port: 53535,
      token: 'demo-token',
      name: 'Localhost PC',
      device_name: 'Localhost PC',
      media_port: 53536,
      udp_port: 53537
    });
  }

  private executePairing(device: PairedDevice) {
    this.companionService.pairDevice(device);
    this.triggerToast('Paired with ' + (device.name || device.ip) + '!');
    setTimeout(() => {
      this.router.navigateByUrl('/home', { replaceUrl: true });
    }, 600);
  }

  public triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
  }
}
