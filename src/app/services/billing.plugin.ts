import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export const PRO_PRODUCT_ID = 'pixelpal_pro_lifetime';

export interface ProductDetails {
  productId: string;
  title: string;
  description: string;
  formattedPrice: string;
  priceAmountMicros?: number;
  priceCurrencyCode?: string;
  available: boolean;
  error?: string;
}

export interface PurchaseResult {
  isPro?: boolean;
  productId?: string;
  purchaseToken?: string;
  orderId?: string;
  purchaseTime?: number;
  acknowledged?: boolean;
  cancelled?: boolean;
  status?: 'purchased' | 'cancelled' | 'error';
  error?: string;
}

export interface RestoreResult {
  isPro: boolean;
  purchaseToken?: string;
  orderId?: string;
  purchaseTime?: number;
  error?: string;
}

export interface BillingPluginInterface {
  initialize(): Promise<{ connected: boolean; error?: string }>;
  queryProductDetails(options?: { productId?: string }): Promise<ProductDetails>;
  purchase(options?: { productId?: string }): Promise<PurchaseResult>;
  queryPurchases(): Promise<RestoreResult>;
  addListener(
    eventName: 'purchaseSuccess',
    listenerFunc: (purchase: PurchaseResult) => void
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

/**
 * Web development fallback implementation.
 * Allows simulating purchase and restore flows in browser dev environments without errors.
 */
class GooglePlayBillingWeb implements BillingPluginInterface {
  private isSimulatedPro = false;

  constructor() {
    this.isSimulatedPro = localStorage.getItem('pixelpal_user_entitlement_tier') === 'pro';
  }

  async initialize(): Promise<{ connected: boolean; error?: string }> {
    console.log('[BillingWeb] Google Play Billing simulated on web.');
    return { connected: true };
  }

  async queryProductDetails(options?: { productId?: string }): Promise<ProductDetails> {
    return {
      productId: options?.productId || PRO_PRODUCT_ID,
      title: 'PixelPal Pro Lifetime',
      description: 'Lifetime unlock for unlimited screens, custom media & pro themes.',
      formattedPrice: '$4.99',
      priceAmountMicros: 4990000,
      priceCurrencyCode: 'USD',
      available: true,
    };
  }

  async purchase(options?: { productId?: string }): Promise<PurchaseResult> {
    console.log('[BillingWeb] Simulating purchase of', options?.productId || PRO_PRODUCT_ID);
    this.isSimulatedPro = true;
    return {
      isPro: true,
      productId: options?.productId || PRO_PRODUCT_ID,
      purchaseToken: 'simulated_token_' + Date.now(),
      orderId: 'GPA.SIM-' + Math.floor(1000 + Math.random() * 9000),
      purchaseTime: Date.now(),
      acknowledged: true,
      status: 'purchased',
    };
  }

  async queryPurchases(): Promise<RestoreResult> {
    this.isSimulatedPro = localStorage.getItem('pixelpal_user_entitlement_tier') === 'pro';
    return {
      isPro: this.isSimulatedPro,
      purchaseToken: this.isSimulatedPro ? 'simulated_token_cached' : undefined,
    };
  }

  addListener(
    eventName: 'purchaseSuccess',
    listenerFunc: (purchase: PurchaseResult) => void
  ): any {
    return {
      remove: async () => {},
    };
  }
}

export const GooglePlayBilling = registerPlugin<BillingPluginInterface>('GooglePlayBillingPlugin', {
  web: () => Promise.resolve(new GooglePlayBillingWeb()),
});
