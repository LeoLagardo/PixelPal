import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  GooglePlayBilling,
  ProductDetails,
  PurchaseResult,
  RestoreResult,
  PRO_PRODUCT_ID,
} from './billing.plugin';
import { EntitlementService } from './entitlement.service';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private productDetailsSubject = new BehaviorSubject<ProductDetails | null>(null);
  public productDetails$: Observable<ProductDetails | null> = this.productDetailsSubject.asObservable();

  private isPurchasingSubject = new BehaviorSubject<boolean>(false);
  public isPurchasing$: Observable<boolean> = this.isPurchasingSubject.asObservable();

  private isRestoringSubject = new BehaviorSubject<boolean>(false);
  public isRestoring$: Observable<boolean> = this.isRestoringSubject.asObservable();

  private isInitialized = false;

  constructor(
    private ngZone: NgZone,
    private entitlementService: EntitlementService
  ) {
    this.init();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[BillingService] Initializing Google Play Billing...');
      const initRes = await GooglePlayBilling.initialize();
      console.log('[BillingService] Billing connection:', initRes);

      // Listen for background / external purchase updates
      GooglePlayBilling.addListener('purchaseSuccess', (purchase: PurchaseResult) => {
        this.ngZone.run(() => {
          console.log('[BillingService] Background purchase event received:', purchase);
          if (purchase.isPro) {
            this.entitlementService.setProFromStore(purchase.purchaseToken);
          }
        });
      });

      // Query product details for UI price display
      await this.loadProductDetails();

      // Check existing purchases on startup (e.g. reinstall or fresh boot)
      await this.checkExistingPurchases();

      this.isInitialized = true;
    } catch (e) {
      console.warn('[BillingService] Error initializing billing client:', e);
    }
  }

  public async loadProductDetails(): Promise<ProductDetails | null> {
    try {
      const details = await GooglePlayBilling.queryProductDetails({ productId: PRO_PRODUCT_ID });
      this.ngZone.run(() => {
        this.productDetailsSubject.next(details);
      });
      return details;
    } catch (e) {
      console.warn('[BillingService] Failed to load product details:', e);
      return null;
    }
  }

  /**
   * Checks Google Play for already purchased licenses on startup.
   * If found, automatically elevates user to Pro.
   */
  public async checkExistingPurchases(): Promise<boolean> {
    try {
      const res = await GooglePlayBilling.queryPurchases();
      console.log('[BillingService] Existing purchases query result:', res);

      if (res.isPro) {
        this.ngZone.run(() => {
          this.entitlementService.setProFromStore(res.purchaseToken);
        });
        return true;
      }
    } catch (e) {
      console.warn('[BillingService] Error checking existing purchases:', e);
    }
    return false;
  }

  /**
   * Launches Google Play's native bottom-sheet purchase flow.
   */
  public async purchasePro(): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
    this.isPurchasingSubject.next(true);

    try {
      console.log('[BillingService] Launching purchase flow for', PRO_PRODUCT_ID);
      const res = await GooglePlayBilling.purchase({ productId: PRO_PRODUCT_ID });
      console.log('[BillingService] Purchase result:', res);

      if (res.status === 'cancelled' || res.cancelled) {
        return { success: false, cancelled: true };
      }

      if (res.isPro) {
        this.ngZone.run(() => {
          this.entitlementService.setProFromStore(res.purchaseToken);
        });
        return { success: true };
      }

      return { success: false, error: res.error || 'Purchase could not be verified.' };
    } catch (e: any) {
      console.error('[BillingService] Purchase exception:', e);
      return { success: false, error: e?.message || 'Purchase failed.' };
    } finally {
      this.ngZone.run(() => {
        this.isPurchasingSubject.next(false);
      });
    }
  }

  /**
   * User-triggered "Restore Purchases" button (required by Google Play Store policies).
   */
  public async restorePurchases(): Promise<{ restored: boolean; message: string }> {
    this.isRestoringSubject.next(true);

    try {
      const res: RestoreResult = await GooglePlayBilling.queryPurchases();
      console.log('[BillingService] Restore result:', res);

      if (res.isPro) {
        this.ngZone.run(() => {
          this.entitlementService.setProFromStore(res.purchaseToken);
        });
        return { restored: true, message: 'Your Lifetime Pro purchase was successfully restored!' };
      }

      return { restored: false, message: 'No prior Pro purchases were found for this Google Play account.' };
    } catch (e: any) {
      console.error('[BillingService] Restore error:', e);
      return { restored: false, message: 'Failed to restore purchases: ' + (e?.message || e) };
    } finally {
      this.ngZone.run(() => {
        this.isRestoringSubject.next(false);
      });
    }
  }

  public getFormattedPrice(): string {
    return this.productDetailsSubject.value?.formattedPrice || '$4.99';
  }
}
