import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  PairedDevice,
  DiscoveredDevice,
  ScreenConfig,
  HandshakeAuthPayload,
  HandshakeResponse,
} from '../models';
import { UdpPlugin } from './udp.plugin';
import { EntitlementService, FREE_SCREEN_LIMIT } from './entitlement.service';

@Injectable({
  providedIn: 'root',
})
export class CompanionService {
  private ws: WebSocket | null = null;
  private reconnectTimeoutId: any = null;
  private connectionTimerId: any = null;
  private isDiscovering = false;
  private reconnectDelay = 2000;
  private maxReconnectDelay = 30000;
  private connectionTimeoutMs = 2000;
  private rawScreens: ScreenConfig[] = [];

  // State Subjects
  public pairedDevice$ = new BehaviorSubject<PairedDevice | null>(null);
  public connectionState$ = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  public screens$ = new BehaviorSubject<ScreenConfig[]>([]);
  public lastError$ = new BehaviorSubject<string | null>(null);
  public isScanning$ = new BehaviorSubject<boolean>(false);
  public activeSessionPlan$ = new BehaviorSubject<'free' | 'pro' | null>(null);
  public negotiatedSchema$ = new BehaviorSubject<number>(1);

  constructor(private ngZone: NgZone, private entitlementService: EntitlementService) {
    this.loadState();
    this.initAppListeners();
    this.initEntitlementListener();
  }

  private initEntitlementListener() {
    this.entitlementService.tier$.subscribe(() => {
      if (this.rawScreens.length > 0) {
        this.applyScreenLimits();
      }
    });
  }

  private loadState() {
    // Load device
    const deviceStr = localStorage.getItem('paired_device');
    if (deviceStr) {
      try {
        const device: PairedDevice = JSON.parse(deviceStr);
        this.pairedDevice$.next(device);
      } catch (e) {
        console.error('Error parsing paired device from localStorage', e);
      }
    }

    // Load screens cache
    const rawStr = localStorage.getItem('raw_screens') || localStorage.getItem('cached_screens');
    if (rawStr) {
      try {
        this.rawScreens = JSON.parse(rawStr);
        this.applyScreenLimits();
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
          console.log('[CompanionService] App came to foreground, reconnecting WebSocket...');
          this.reconnectDelay = 2000; // Reset backoff
          this.connect();
        } else {
          console.log('[CompanionService] App went to background, closing WebSocket...');
          this.disconnect(true); // temporary disconnect, don't clear reconnect state
        }
      });
    });
  }

  public pair(
    ip: string,
    port: number = 53535,
    token: string,
    name?: string,
    media_port: number = 53536,
    udp_port: number = 53537,
    device_name?: string
  ) {
    const deviceName = device_name || name || `PC at ${ip}`;
    const device: PairedDevice = {
      ip,
      port: port || 53535,
      token,
      name: deviceName,
      device_name: deviceName,
      media_port: media_port || 53536,
      udp_port: udp_port || 53537
    };
    this.pairDevice(device);
  }

  public pairDevice(device: PairedDevice) {
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

    this.clearConnectionTimer();
    this.connectionState$.next('connecting');
    this.lastError$.next(null);
    const wsUrl = `ws://${device.ip}:${device.port || 53535}`;

    console.log(`[CompanionService] Connecting to WebSocket: ${wsUrl}`);

    let hasOpened = false;

    // Timeout (5s) for slow networks before attempting background UDP discovery
    this.connectionTimerId = setTimeout(() => {
      this.ngZone.run(async () => {
        if (!hasOpened && this.connectionState$.value === 'connecting') {
          console.warn(`[CompanionService] WebSocket connection timed out (${this.connectionTimeoutMs}ms) to ${wsUrl}. Triggering UDP discovery...`);
          this.cleanupCurrentSocket();
          await this.handleConnectionFailure();
        }
      });
    }, 5000);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.ngZone.run(() => {
          hasOpened = true;
          this.clearConnectionTimer();
          console.log('[CompanionService] WebSocket connection opened successfully to ' + wsUrl);
          this.connectionState$.next('connected');
          this.reconnectDelay = 2000; // Reset backoff on successful connection

          // 1. Authenticate with token, client metadata & entitlement
          const authPayload: HandshakeAuthPayload = {
            token: device.token,
            device_name: device.device_name || device.name || 'PixelPal Mobile',
            client_version: '1.0.0',
            schema_version: 1,
            entitlement: this.entitlementService.getEntitlementPayload(),
          };
          this.send(authPayload);

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
        this.ngZone.run(async () => {
          this.clearConnectionTimer();
          console.log('[CompanionService] WebSocket connection closed', event);
          this.cleanupCurrentSocket();

          if (!hasOpened) {
            // Failed during handshake attempt
            await this.handleConnectionFailure();
          } else {
            // Disconnected after having been active
            this.connectionState$.next('connecting');
            this.scheduleReconnect();
          }
        });
      };

      this.ws.onerror = (error) => {
        this.ngZone.run(async () => {
          console.error('[CompanionService] WebSocket error:', error);
          this.clearConnectionTimer();
          this.lastError$.next('Connection to ' + wsUrl + ' failed');

          if (!hasOpened) {
            this.cleanupCurrentSocket();
            await this.handleConnectionFailure();
          }
        });
      };
    } catch (e: any) {
      this.ngZone.run(async () => {
        console.error('[CompanionService] WebSocket exception during connect:', e);
        this.clearConnectionTimer();
        this.cleanupCurrentSocket();
        this.lastError$.next(e.message || 'Connection error');
        await this.handleConnectionFailure();
      });
    }
  }

  private cleanupCurrentSocket() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      try {
        this.ws.close();
      } catch (e) {
        // Ignore close exceptions
      }
      this.ws = null;
    }
  }

  private clearConnectionTimer() {
    if (this.connectionTimerId) {
      clearTimeout(this.connectionTimerId);
      this.connectionTimerId = null;
    }
  }

  /**
   * Called on connection failure/timeout.
   * Attempts UDP broadcast to find the PC (handles IP changes via DHCP),
   * updates the saved IP address, and reconnects automatically.
   */
  private async handleConnectionFailure() {
    if (this.isDiscovering) {
      return;
    }

    const device = this.pairedDevice$.value;
    if (!device) {
      this.connectionState$.next('disconnected');
      return;
    }

    // In web mode (testing in browser on same PC), try loopback 127.0.0.1 if LAN IP fails due to Windows firewall loopback restrictions
    if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
      const isLocalhostOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhostOrigin && device.ip !== '127.0.0.1' && device.ip !== 'localhost') {
        console.log('[CompanionService] Web browser on localhost detected. Retrying with 127.0.0.1 loopback...');
        const loopbackDevice: PairedDevice = {
          ...device,
          ip: '127.0.0.1'
        };
        localStorage.setItem('paired_device', JSON.stringify(loopbackDevice));
        this.pairedDevice$.next(loopbackDevice);
        this.connect();
        return;
      }
    }

    // Keep connection state as connecting while we search and retry
    this.connectionState$.next('connecting');
    console.log('[CompanionService] Connection failed. Initiating UDP broadcast discovery for auto-reconnect...');
    const discovered = await this.discoverAndReconnect(device.token);
    if (!discovered) {
      this.scheduleReconnect();
    }
  }

  /**
   * Broadcasts UDP packet to 255.255.255.255:53537 with the saved pairing token.
   * On receiving pong response where token_matched === true:
   * Updates saved IP and connects WebSocket to new address.
   */
  public async discoverAndReconnect(savedToken?: string): Promise<boolean> {
    const currentDevice = this.pairedDevice$.value;
    const token = savedToken || currentDevice?.token;
    if (!token) {
      return false;
    }

    if (this.isDiscovering) {
      return false;
    }

    this.isDiscovering = true;
    const targetUdpPort = currentDevice?.udp_port || 53537;

    try {
      console.log(`[CompanionService] Broadcasting UDP discover to 255.255.255.255:${targetUdpPort} with token...`);
      const res = await UdpPlugin.discover({
        token,
        port: targetUdpPort,
        timeout: 2000
      });

      console.log('[CompanionService] UDP discovery responses:', res.devices);
      const matchedDevice = res.devices?.find(d => d.token_matched === true);

      if (matchedDevice) {
        console.log('[CompanionService] Matching PC discovered at:', matchedDevice.ip, matchedDevice);

        const updatedDevice: PairedDevice = {
          ip: matchedDevice.ip,
          port: matchedDevice.port || currentDevice?.port || 53535,
          token: token,
          name: matchedDevice.device_name || matchedDevice.name || currentDevice?.name || `PC at ${matchedDevice.ip}`,
          device_name: matchedDevice.device_name || matchedDevice.name || currentDevice?.device_name,
          media_port: matchedDevice.media_port || currentDevice?.media_port || 53536,
          udp_port: matchedDevice.udp_port || currentDevice?.udp_port || targetUdpPort
        };

        localStorage.setItem('paired_device', JSON.stringify(updatedDevice));
        this.pairedDevice$.next(updatedDevice);

        // Reset reconnect delay & connect WebSocket to the newly resolved IP
        this.reconnectDelay = 2000;
        this.connect();
        return true;
      }
    } catch (e) {
      console.warn('[CompanionService] UDP discovery error or unsupported:', e);
    } finally {
      this.isDiscovering = false;
    }

    return false;
  }

  /**
   * Scans local network for active PixelPal PCs via UDP broadcast.
   */
  public async scanNetwork(timeoutMs = 2500, port = 53537): Promise<DiscoveredDevice[]> {
    this.isScanning$.next(true);
    try {
      console.log(`[CompanionService] Scanning local network on UDP port ${port}...`);
      const result = await UdpPlugin.discover({
        port,
        timeout: timeoutMs
      });
      return result.devices || [];
    } catch (e) {
      console.error('[CompanionService] Network scan failed:', e);
      return [];
    } finally {
      this.isScanning$.next(false);
    }
  }

  public disconnect(keepState = false) {
    this.clearConnectionTimer();
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.cleanupCurrentSocket();
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

    console.log(`[CompanionService] Scheduling reconnect in ${this.reconnectDelay}ms...`);
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
      console.log('[CompanionService] Received message:', data);

      if (data.status === 'paired') {
        if (data.active_plan) {
          this.activeSessionPlan$.next(data.active_plan);
          this.applyScreenLimits();
        }
        if (data.negotiated_schema) {
          this.negotiatedSchema$.next(data.negotiated_schema);
        }
        this.lastError$.next(null);
      } else if (Array.isArray(data)) {
        this.updateScreens(data);
      } else if (data.type === 'sync' || data.type === 'screens') {
        if (data.screens && Array.isArray(data.screens)) {
          this.updateScreens(data.screens);
        }
      } else if (data.status === 'error' || data.type === 'error') {
        const errorReason = data.reason || data.message || data.error || 'An error occurred';
        this.lastError$.next(errorReason);
      }
    } catch (e) {
      console.error('[CompanionService] Failed to parse WebSocket message', e, dataStr);
    }
  }

  private applyScreenLimits() {
    const isPro = this.entitlementService.isPro() || this.activeSessionPlan$.value === 'pro';
    const limit = isPro ? Infinity : FREE_SCREEN_LIMIT;
    const effectiveScreens = this.rawScreens.slice(0, limit);
    this.screens$.next(effectiveScreens);
    localStorage.setItem('cached_screens', JSON.stringify(effectiveScreens));
    localStorage.setItem('raw_screens', JSON.stringify(this.rawScreens));
  }

  private updateScreens(screens: ScreenConfig[]) {
    this.rawScreens = Array.isArray(screens) ? screens : [];
    this.applyScreenLimits();
  }

  public send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[CompanionService] Cannot send message, WebSocket is not open:', msg);
    }
  }

  public sendAction(action: string, payload: string) {
    this.send({ action, payload });
  }
}

