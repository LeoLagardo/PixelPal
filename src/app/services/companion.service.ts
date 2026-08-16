import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { App } from '@capacitor/app';
import { PairedDevice, ScreenConfig } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CompanionService {
  private ws: WebSocket | null = null;
  private reconnectTimeoutId: any = null;
  private reconnectDelay = 2000;
  private maxReconnectDelay = 30000;
  private isConnecting = false;

  // State Subjects
  public pairedDevice$ = new BehaviorSubject<PairedDevice | null>(null);
  public connectionState$ = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  public screens$ = new BehaviorSubject<ScreenConfig[]>([]);
  public lastError$ = new BehaviorSubject<string | null>(null);

  constructor(private ngZone: NgZone) {
    this.loadState();
    this.initAppListeners();
  }

  private loadState() {
    // Load device
    const deviceStr = localStorage.getItem('paired_device');
    if (deviceStr) {
      try {
        const device = JSON.parse(deviceStr);
        this.pairedDevice$.next(device);
      } catch (e) {
        console.error('Error parsing paired device from localStorage', e);
      }
    }

    // Load screens cache
    const screensStr = localStorage.getItem('cached_screens');
    if (screensStr) {
      try {
        const screens = JSON.parse(screensStr);
        this.screens$.next(screens);
      } catch (e) {
        console.error('Error parsing cached screens from localStorage', e);
      }
    }
  }

  private initAppListeners() {
    // Listen to background/foreground events
    App.addListener('appStateChange', (state) => {
      this.ngZone.run(() => {
        if (state.isActive) {
          console.log('App came to foreground, reconnecting WebSocket if paired...');
          this.reconnectDelay = 2000; // Reset backoff
          this.connect();
        } else {
          console.log('App went to background, closing WebSocket...');
          this.disconnect(true); // temporary disconnect, don't clear reconnect state
        }
      });
    });
  }

  public pair(ip: string, port: number, token: string, name?: string) {
    const device: PairedDevice = { ip, port, token, name: name || `PC at ${ip}` };
    localStorage.setItem('paired_device', JSON.stringify(device));
    this.pairedDevice$.next(device);
    this.reconnectDelay = 2000; // Reset backoff
    this.connect();
  }

  public forgetDevice() {
    this.disconnect(true);
    localStorage.removeItem('paired_device');
    localStorage.removeItem('cached_screens');
    this.pairedDevice$.next(null);
    this.screens$.next([]);
    this.connectionState$.next('disconnected');
  }

  public connect() {
    const device = this.pairedDevice$.value;
    if (!device) {
      this.connectionState$.next('disconnected');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.connectionState$.next('connecting');
    this.lastError$.next(null);

    const wsUrl = `ws://${device.ip}:${device.port}`;
    console.log(`Connecting to WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.ngZone.run(() => {
          console.log('WebSocket connection opened');
          this.connectionState$.next('connected');
          this.reconnectDelay = 2000; // Reset backoff on successful connection
          this.isConnecting = false;

          // On successful open:
          // 1. Authenticate with token
          this.send({ token: device.token });
          // 2. Request synchronization
          this.send({ type: 'sync', request: 'get_screens' });
        });
      };

      this.ws.onmessage = (event) => {
        this.ngZone.run(() => {
          this.handleMessage(event.data);
        });
      };

      this.ws.onclose = (event) => {
        this.ngZone.run(() => {
          console.log('WebSocket connection closed', event);
          this.connectionState$.next('disconnected');
          this.ws = null;
          this.isConnecting = false;
          this.scheduleReconnect();
        });
      };

      this.ws.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('WebSocket error:', error);
          this.connectionState$.next('disconnected');
          this.lastError$.next('Connection failed');
        });
      };
    } catch (e: any) {
      this.ngZone.run(() => {
        console.error('WebSocket exception during connect:', e);
        this.connectionState$.next('disconnected');
        this.lastError$.next(e.message || 'Connection error');
        this.scheduleReconnect();
      });
    }
  }

  public disconnect(keepState = false) {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.ws) {
      // Remove event listeners to prevent auto-reconnect trigger
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      try {
        this.ws.close();
      } catch (e) {
        console.error('Error closing websocket', e);
      }
      this.ws = null;
    }
    if (!keepState) {
      this.connectionState$.next('disconnected');
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    const device = this.pairedDevice$.value;
    if (!device) {
      return; // Do not reconnect if unpaired
    }

    console.log(`Scheduling reconnect in ${this.reconnectDelay}ms...`);
    this.reconnectTimeoutId = setTimeout(() => {
      this.ngZone.run(() => {
        this.connect();
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      });
    }, this.reconnectDelay);
  }

  private handleMessage(dataStr: string) {
    try {
      const data = JSON.parse(dataStr);
      console.log('Received message:', data);

      if (Array.isArray(data)) {
        // Direct screens list payload (either as standard response or direct sync)
        this.updateScreens(data);
      } else if (data.type === 'sync' || data.type === 'screens') {
        // If it's a direct message containing screens, or indicating update
        if (data.screens && Array.isArray(data.screens)) {
          this.updateScreens(data.screens);
        }
      } else if (data.status === 'error' || data.type === 'error') {
        const errorReason = data.reason || data.message || 'An error occurred';
        this.lastError$.next(errorReason);
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message', e, dataStr);
    }
  }

  private updateScreens(screens: ScreenConfig[]) {
    this.screens$.next(screens);
    localStorage.setItem('cached_screens', JSON.stringify(screens));
  }

  public send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('Cannot send message, WebSocket is not open:', msg);
    }
  }

  public sendAction(action: string, payload: string) {
    this.send({ action, payload });
  }
}
