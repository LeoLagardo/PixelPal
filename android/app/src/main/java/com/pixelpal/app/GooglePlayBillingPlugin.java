package com.pixelpal.android;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "GooglePlayBillingPlugin")
public class GooglePlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String TAG = "GooglePlayBillingPlugin";
    public static final String DEFAULT_PRODUCT_ID = "pixelpal_pro_lifetime";

    private BillingClient billingClient;
    private final Map<String, ProductDetails> productDetailsMap = new HashMap<>();
    private PluginCall activePurchaseCall = null;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void load() {
        super.load();
        initBillingClient();
    }

    private synchronized void initBillingClient() {
        if (billingClient == null) {
            PendingPurchasesParams pendingPurchasesParams = PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build();

            billingClient = BillingClient.newBuilder(getContext())
                    .setListener(this)
                    .enablePendingPurchases(pendingPurchasesParams)
                    .build();
        }
    }

    private void ensureConnection(ConnectionCallback callback) {
        initBillingClient();
        if (billingClient.isReady()) {
            callback.onConnected();
            return;
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Google Play Billing client setup successful");
                    callback.onConnected();
                } else {
                    Log.w(TAG, "Google Play Billing setup failed with response code: " + billingResult.getResponseCode() + " - " + billingResult.getDebugMessage());
                    callback.onError("Billing setup failed: " + billingResult.getDebugMessage() + " (code: " + billingResult.getResponseCode() + ")");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Google Play Billing service disconnected. Will reconnect on next call.");
            }
        });
    }

    private interface ConnectionCallback {
        void onConnected();
        void onError(String error);
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        ensureConnection(new ConnectionCallback() {
            @Override
            public void onConnected() {
                JSObject result = new JSObject();
                result.put("connected", true);
                call.resolve(result);
            }

            @Override
            public void onError(String error) {
                JSObject result = new JSObject();
                result.put("connected", false);
                result.put("error", error);
                call.resolve(result);
            }
        });
    }

    @PluginMethod
    public void queryProductDetails(PluginCall call) {
        String productId = call.getString("productId", DEFAULT_PRODUCT_ID);

        ensureConnection(new ConnectionCallback() {
            @Override
            public void onConnected() {
                List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
                productList.add(
                        QueryProductDetailsParams.Product.newBuilder()
                                .setProductId(productId)
                                .setProductType(BillingClient.ProductType.INAPP)
                                .build()
                );

                QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                        .setProductList(productList)
                        .build();

                billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
                    List<ProductDetails> productDetailsList = productDetailsResult != null ? productDetailsResult.getProductDetailsList() : null;
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && productDetailsList != null && !productDetailsList.isEmpty()) {
                        ProductDetails details = productDetailsList.get(0);
                        productDetailsMap.put(details.getProductId(), details);

                        JSObject res = new JSObject();
                        res.put("productId", details.getProductId());
                        res.put("title", details.getTitle());
                        res.put("description", details.getDescription());

                        ProductDetails.OneTimePurchaseOfferDetails offerDetails = details.getOneTimePurchaseOfferDetails();
                        if (offerDetails != null) {
                            res.put("formattedPrice", offerDetails.getFormattedPrice());
                            res.put("priceAmountMicros", offerDetails.getPriceAmountMicros());
                            res.put("priceCurrencyCode", offerDetails.getPriceCurrencyCode());
                        } else {
                            res.put("formattedPrice", "$4.99");
                        }

                        res.put("available", true);
                        call.resolve(res);
                    } else {
                        Log.w(TAG, "No product details found for " + productId + ": " + billingResult.getDebugMessage());
                        JSObject fallback = new JSObject();
                        fallback.put("productId", productId);
                        fallback.put("title", "PixelPal Pro Lifetime");
                        fallback.put("description", "Lifetime unlock for all Pro features");
                        fallback.put("formattedPrice", "$4.99");
                        fallback.put("available", false);
                        fallback.put("error", billingResult.getDebugMessage());
                        call.resolve(fallback);
                    }
                });
            }

            @Override
            public void onError(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId", DEFAULT_PRODUCT_ID);

        ensureConnection(new ConnectionCallback() {
            @Override
            public void onConnected() {
                ProductDetails details = productDetailsMap.get(productId);

                if (details == null) {
                    // Fetch details first if not cached
                    List<QueryProductDetailsParams.Product> productList = Collections.singletonList(
                            QueryProductDetailsParams.Product.newBuilder()
                                    .setProductId(productId)
                                    .setProductType(BillingClient.ProductType.INAPP)
                                    .build()
                    );

                    QueryProductDetailsParams queryParams = QueryProductDetailsParams.newBuilder()
                            .setProductList(productList)
                            .build();

                    billingClient.queryProductDetailsAsync(queryParams, (billingResult, productDetailsResult) -> {
                        List<ProductDetails> productDetailsList = productDetailsResult != null ? productDetailsResult.getProductDetailsList() : null;
                        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && productDetailsList != null && !productDetailsList.isEmpty()) {
                            ProductDetails fetchedDetails = productDetailsList.get(0);
                            productDetailsMap.put(fetchedDetails.getProductId(), fetchedDetails);
                            mainHandler.post(() -> launchFlow(fetchedDetails, call));
                        } else {
                            call.reject("Product details not found on Google Play: " + billingResult.getDebugMessage());
                        }
                    });
                } else {
                    mainHandler.post(() -> launchFlow(details, call));
                }
            }

            @Override
            public void onError(String error) {
                call.reject(error);
            }
        });
    }

    private void launchFlow(ProductDetails details, PluginCall call) {
        List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(details)
                        .build()
        );

        BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

        activePurchaseCall = call;
        BillingResult result = billingClient.launchBillingFlow(getActivity(), flowParams);

        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            Log.e(TAG, "Failed to launch billing flow: " + result.getDebugMessage());
            activePurchaseCall = null;
            call.reject("Failed to open Google Play purchase: " + result.getDebugMessage());
        }
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, @Nullable List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            Log.d(TAG, "Purchase cancelled by user");
            if (activePurchaseCall != null) {
                JSObject cancelRes = new JSObject();
                cancelRes.put("cancelled", true);
                cancelRes.put("status", "cancelled");
                activePurchaseCall.resolve(cancelRes);
                activePurchaseCall = null;
            }
        } else {
            Log.e(TAG, "Purchase update error: " + billingResult.getResponseCode() + " - " + billingResult.getDebugMessage());
            if (activePurchaseCall != null) {
                activePurchaseCall.reject("Purchase failed: " + billingResult.getDebugMessage() + " (code: " + billingResult.getResponseCode() + ")");
                activePurchaseCall = null;
            }
        }
    }

    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            // Acknowledge if not already acknowledged
            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgePurchaseParams =
                        AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.getPurchaseToken())
                                .build();

                billingClient.acknowledgePurchase(acknowledgePurchaseParams, billingResult -> {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        Log.d(TAG, "Purchase acknowledged successfully");
                    } else {
                        Log.w(TAG, "Failed to acknowledge purchase: " + billingResult.getDebugMessage());
                    }
                });
            }

            JSObject purchaseObj = new JSObject();
            purchaseObj.put("isPro", true);
            purchaseObj.put("productId", DEFAULT_PRODUCT_ID);
            purchaseObj.put("purchaseToken", purchase.getPurchaseToken());
            purchaseObj.put("orderId", purchase.getOrderId());
            purchaseObj.put("purchaseTime", purchase.getPurchaseTime());
            purchaseObj.put("acknowledged", purchase.isAcknowledged());
            purchaseObj.put("status", "purchased");

            if (activePurchaseCall != null) {
                activePurchaseCall.resolve(purchaseObj);
                activePurchaseCall = null;
            }

            // Also emit event so listeners anywhere in app update immediately
            notifyListeners("purchaseSuccess", purchaseObj);
        }
    }

    @PluginMethod
    public void queryPurchases(PluginCall call) {
        ensureConnection(new ConnectionCallback() {
            @Override
            public void onConnected() {
                QueryPurchasesParams queryPurchasesParams = QueryPurchasesParams.newBuilder()
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build();

                billingClient.queryPurchasesAsync(queryPurchasesParams, (billingResult, purchaseList) -> {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        boolean isPro = false;
                        Purchase proPurchase = null;

                        for (Purchase p : purchaseList) {
                            if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                for (String prod : p.getProducts()) {
                                    if (DEFAULT_PRODUCT_ID.equals(prod)) {
                                        isPro = true;
                                        proPurchase = p;
                                        break;
                                    }
                                }
                            }
                            if (isPro) break;
                        }

                        JSObject result = new JSObject();
                        result.put("isPro", isPro);

                        if (isPro && proPurchase != null) {
                            if (!proPurchase.isAcknowledged()) {
                                AcknowledgePurchaseParams ackParams = AcknowledgePurchaseParams.newBuilder()
                                        .setPurchaseToken(proPurchase.getPurchaseToken())
                                        .build();
                                billingClient.acknowledgePurchase(ackParams, ackRes -> Log.d(TAG, "Auto-acknowledged restored purchase: " + ackRes.getResponseCode()));
                            }

                            result.put("purchaseToken", proPurchase.getPurchaseToken());
                            result.put("orderId", proPurchase.getOrderId());
                            result.put("purchaseTime", proPurchase.getPurchaseTime());
                        }

                        call.resolve(result);
                    } else {
                        JSObject errRes = new JSObject();
                        errRes.put("isPro", false);
                        errRes.put("error", billingResult.getDebugMessage());
                        call.resolve(errRes);
                    }
                });
            }

            @Override
            public void onError(String error) {
                JSObject fallback = new JSObject();
                fallback.put("isPro", false);
                fallback.put("error", error);
                call.resolve(fallback);
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null && billingClient.isReady()) {
            billingClient.endConnection();
            billingClient = null;
        }
        super.handleOnDestroy();
    }
}
