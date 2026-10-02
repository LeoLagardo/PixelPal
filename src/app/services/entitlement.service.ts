import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EntitlementPayload, EntitlementSource, EntitlementTier, TrialStatus } from '../models';
import { NetworkTimeService } from './network-time.service';
import { environment } from '../../environments/environment';

const STORAGE_KEY = 'pixelpal_user_entitlement_tier';
const TOKEN_KEY = 'pixelpal_user_purchase_token';
const SOURCE_KEY = 'pixelpal_user_entitlement_source';

export const FREE_SCREEN_LIMIT = 2;

@Injectable({
  providedIn: 'root',
})
export class EntitlementService {
  private tierSubject: BehaviorSubject<EntitlementTier>;
  public tier$: Observable<EntitlementTier>;
  private purchaseToken: string | null = null;
  private entitlementSource: EntitlementSource = 'local';

  private trialStatusSubject: BehaviorSubject<TrialStatus>;
  public trialStatus$: Observable<TrialStatus>;

  constructor(
    private networkTimeService: NetworkTimeService,
    private ngZone: NgZone
  ) {
    const savedTier = (localStorage.getItem(STORAGE_KEY) as EntitlementTier) || 'free';
    this.purchaseToken = localStorage.getItem(TOKEN_KEY);
    this.entitlementSource = (localStorage.getItem(SOURCE_KEY) as EntitlementSource) || 'local';

    // Initial trial calculation using estimated time
    const initialTrialStatus = this.computeTrialStatus(this.networkTimeService.getEstimatedTime());
    this.trialStatusSubject = new BehaviorSubject<TrialStatus>(initialTrialStatus);
    this.trialStatus$ = this.trialStatusSubject.asObservable();

    let initialTier: EntitlementTier = savedTier === 'pro' ? 'pro' : 'free';

    // If genuine Google Play purchase exists, maintain permanent Pro
    if (this.entitlementSource === 'google_play' && this.purchaseToken) {
      initialTier = 'pro';
    } else if (initialTrialStatus.enabled) {
      if (initialTrialStatus.isActive) {
        initialTier = 'pro';
        this.entitlementSource = 'trial';
      } else if (initialTrialStatus.isExpired) {
        initialTier = 'free';
        this.entitlementSource = 'local';
        localStorage.setItem(STORAGE_KEY, 'free');
        localStorage.setItem(SOURCE_KEY, 'local');
      }
    }

    this.tierSubject = new BehaviorSubject<EntitlementTier>(initialTier);
    this.tier$ = this.tierSubject.asObservable();

    // Verify against HTTP time server asynchronously
    this.verifyTrialOnline();

    // Periodic check every 15 minutes (or on app visibility/focus)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.verifyTrialOnline());
      setInterval(() => this.verifyTrialOnline(), 15 * 60 * 1000);
    }
  }

  public get currentTier(): EntitlementTier {
    return this.tierSubject.value;
  }

  public isPro(): boolean {
    return this.tierSubject.value === 'pro';
  }

  public getScreenLimit(): number {
    return this.isPro() ? Infinity : FREE_SCREEN_LIMIT;
  }

  public getTrialStatus(): TrialStatus {
    return this.trialStatusSubject.value;
  }

  public async verifyTrialOnline(): Promise<TrialStatus> {
    const verifiedTime = await this.networkTimeService.getVerifiedTime();
    const status = this.computeTrialStatus(verifiedTime);

    this.ngZone.run(() => {
      this.trialStatusSubject.next(status);

      // Do not touch permanent Google Play purchasers
      if (this.entitlementSource === 'google_play' && this.purchaseToken) {
        return;
      }

      if (status.enabled) {
        if (status.isActive && this.currentTier !== 'pro') {
          console.log('[EntitlementService] Trial is active, granting Pro');
          this.setTier('pro', 'trial');
        } else if (status.isExpired && this.currentTier === 'pro') {
          console.log('[EntitlementService] Trial has expired, reverting to Free');
          this.setTier('free', 'local');
        }
      }
    });

    return status;
  }

  private computeTrialStatus(currentTimeMs: number): TrialStatus {
    const trialConfig = environment.proTrial;
    if (!trialConfig || !trialConfig.enabled || !trialConfig.expiresAt) {
      return {
        enabled: false,
        isActive: false,
        isExpired: false,
        expiresAt: null,
        daysRemaining: null,
      };
    }

    let expiryStr = String(trialConfig.expiresAt).trim();
    if (!expiryStr.endsWith('Z') && !expiryStr.includes('+') && !/T\d{2}:\d{2}:\d{2}.*-/.test(expiryStr)) {
      expiryStr += 'Z';
    }
    const expiryTimeMs = new Date(expiryStr).getTime();
    if (isNaN(expiryTimeMs)) {
      return {
        enabled: false,
        isActive: false,
        isExpired: false,
        expiresAt: null,
        daysRemaining: null,
      };
    }

    const isExpired = currentTimeMs >= expiryTimeMs;
    const isActive = !isExpired;
    const diffMs = expiryTimeMs - currentTimeMs;
    const daysRemaining = isActive ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0;

    return {
      enabled: true,
      isActive,
      isExpired,
      expiresAt: trialConfig.expiresAt,
      daysRemaining,
    };
  }

  public setTier(tier: EntitlementTier, source: EntitlementSource = 'local', token?: string): void {
    localStorage.setItem(STORAGE_KEY, tier);
    localStorage.setItem(SOURCE_KEY, source);
    this.entitlementSource = source;

    if (token) {
      this.purchaseToken = token;
      localStorage.setItem(TOKEN_KEY, token);
    } else if (tier === 'free') {
      this.purchaseToken = null;
      localStorage.removeItem(TOKEN_KEY);
    }

    this.tierSubject.next(tier);
  }

  public setProFromStore(token?: string): void {
    this.setTier('pro', 'google_play', token);
  }

  public toggleTier(): void {
    const nextTier: EntitlementTier = this.isPro() ? 'free' : 'pro';
    this.setTier(nextTier, 'local');
  }

  public getEntitlementPayload(): EntitlementPayload {
    const tier = this.currentTier;
    return {
      tier,
      features: tier === 'pro'
        ? [
            'unlimited_screens',
            'pro_themes',
            'custom_background',
            'pro_media',
            'custom_media',
          ]
        : [],
      source: this.entitlementSource,
      receipt_signature: this.purchaseToken || undefined,
    };
  }
}
