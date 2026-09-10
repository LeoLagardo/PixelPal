import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EntitlementPayload, EntitlementTier } from '../models';

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
  private entitlementSource: 'google_play' | 'local' = 'local';

  constructor() {
    const savedTier = (localStorage.getItem(STORAGE_KEY) as EntitlementTier) || 'free';
    this.purchaseToken = localStorage.getItem(TOKEN_KEY);
    this.entitlementSource = (localStorage.getItem(SOURCE_KEY) as 'google_play' | 'local') || 'local';
    this.tierSubject = new BehaviorSubject<EntitlementTier>(savedTier === 'pro' ? 'pro' : 'free');
    this.tier$ = this.tierSubject.asObservable();
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

  public setTier(tier: EntitlementTier, source: 'google_play' | 'local' = 'local', token?: string): void {
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
