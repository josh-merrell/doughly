import { Injectable, WritableSignal, signal } from '@angular/core';
import {
  Glassfy,
  GlassfyOffering,
  GlassfyOfferings,
  GlassfyPermissions,
  GlassfyPermission,
  GlassfySku,
  GlassfyTransaction,
} from 'capacitor-plugin-glassfy';
import {
  Purchases,
  PurchasesOfferings,
  PurchasesOffering,
  CustomerInfo,
  PurchasesEntitlementInfos,
  PurchasesEntitlementInfo,
  LOG_LEVEL,
  PurchasesPackage,
  MakePurchaseResult,
  PurchasesStoreProduct,
} from '@revenuecat/purchases-capacitor';
import { environment } from 'src/environments/environment';
import { AuthService } from './authenticationService';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

import { Store } from '@ngrx/store';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { ProfileService } from 'src/app/profile/data/profile.service';
import { Router } from '@angular/router';

// define PurchaseResult interface--
interface PurchaseResult {
  skuId: string | null;
  permissions: GlassfyPermissions | PurchasesEntitlementInfo[] | null;
  result: string;
  error: any;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly API_URL = `${environment.BACKEND}/purchases`;
  public offerings: WritableSignal<GlassfyOffering[]> = signal([]);
  public offeringsRevenueCat: WritableSignal<PurchasesOffering[]> = signal([]);
  public licences = {
    recipeSubscribeLimit: 5,
    recipeCreateLimit: 5,
    premiumMonthlyAICredits: 12,
    extraAITokenPurchaseCount: 10,
    maxAICredits: 30,
  };
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  // async initGlassfy() {
  //   try {
  //     if (Capacitor.isNativePlatform()) {
  //       await Glassfy.initialize({
  //         apiKey: environment.GLASSFY_ApiKey,
  //         watcherMode: false,
  //       });
  //       const permissions = await Glassfy.permissions();
  //       console.log('Glassfy Permissions: ', JSON.stringify(permissions));
  //       await this.handleExistingPermissions(permissions.all).subscribe();

  //       const offerings: GlassfyOfferings = await Glassfy.offerings();
  //       this.offerings.set(offerings.all);
  //     } else return;
  //   } catch (error) {
  //     console.error('Error initializing Glassfy: ', error);
  //   }
  // }

  async initRevenueCat() {
    try {
      if (Capacitor.isNativePlatform()) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        if (Capacitor.getPlatform() === 'ios') {
          await Purchases.configure({
            apiKey: environment.REVENUECAT_AppleApiKey,
          });
        } else if (Capacitor.getPlatform() === 'android') {
          await Purchases.configure({
            apiKey: environment.REVENUECAT_GoogleApiKey,
          });
        }
        const { customerInfo } = await Purchases.getCustomerInfo();
        const activeEntitlementsArray = Object.values(
          customerInfo.entitlements.active
        );
        console.log(
          'RevenueCat Entitlements: ',
          JSON.stringify(activeEntitlementsArray)
        );
        await this.handleExistingPermissions(
          activeEntitlementsArray
        ).subscribe();

        const offeringsRevenueCat: PurchasesOfferings =
          await Purchases.getOfferings();
        const offeringsArray = Object.values(offeringsRevenueCat.all);
        this.offeringsRevenueCat.set(offeringsArray);
      } else return;
    } catch (error) {
      console.error('Error initializing RevenueCat: ', error);
    }
  }

  ngOnInit() {
    this.initRevenueCat();
  }

  async updatePermissions() {
    // called when permissions may have changed
    // ** REVENUECAT **
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.all) {
        const activeEntitlementsArray = Object.values(
          customerInfo.entitlements.active
        );
        console.log(
          'Up-to-date RevenueCat Entitlements: ',
          activeEntitlementsArray
        );
        await this.handleExistingPermissions(
          activeEntitlementsArray
        ).subscribe();
      }
    } catch (error) {
      console.error('Error getting up-to-date RevenueCat permissions: ', error);
    }
  }

  async purchaseRevenueCatSubPackage(
    revenueCatSubPackage: PurchasesPackage
  ): Promise<PurchaseResult> {
    try {
      // console.log(
      //   `PURCHASING REVENUE CAT PACKAGE: ${JSON.stringify(
      //     revenueCatSubPackage
      //   )}`
      // );
      const result = await Purchases.purchasePackage({
        aPackage: revenueCatSubPackage,
      });
      if (result.customerInfo && result.customerInfo.entitlements) {
        const activeEntitlementsArray = Object.values(
          result.customerInfo.entitlements.active
        );
        // console.log(
        //   'ACTIVE ENTITLEMENTS: ',
        //   JSON.stringify(activeEntitlementsArray)
        // );
        // console.log(
        //   'REVENUE CAT SUB PACKAGE: ',
        //   JSON.stringify(revenueCatSubPackage)
        // );
        await this.handleSuccessfulRevenueCatSubPackageTransactionResult(
          activeEntitlementsArray,
          revenueCatSubPackage
        ).subscribe();
        return {
          skuId: revenueCatSubPackage.identifier,
          permissions: activeEntitlementsArray,
          result: 'success',
          error: null,
        };
      }
      return {
        skuId: null,
        permissions: null,
        result: 'no permissions',
        error: 'Receipt not validated',
      };
    } catch (error: any) {
      console.log(`GOT ERROR: `, error);
      // Log standard properties
      console.log('Error message:', error.message);

      if (error.message.includes('UserCancelPurchase')) {
        return {
          skuId: null,
          permissions: null,
          result: 'cancelled',
          error: 'Purchase cancelled by user',
        };
      }
      if (error.message.includes('ProductAlreadyOwned')) {
        return {
          skuId: null,
          permissions: null,
          result: 'alreadyOwned',
          error: 'Purchase cancelled by user',
        };
      }
      console.error('Error purchasing SKU: ', error);
      return {
        skuId: null,
        permissions: null,
        result: 'error',
        error: error,
      };
    }
  }

  purchaseRevenueCatProdPackage(
    revenueCatProdPackage: PurchasesPackage
  ): Promise<PurchaseResult> {
    return new Promise(async (resolve, reject) => {
      try {
        console
          .log
          // `PURCHASING REVENUE CAT PRODUCT: ${JSON.stringify(
          //   revenueCatProdPackage
          // )}`
          ();
        const result = await Purchases.purchasePackage({
          aPackage: revenueCatProdPackage,
        });
        console.log('Result: ', result);
        if (result.customerInfo && result.customerInfo.entitlements) {
          const activeEntitlementsArray = Object.values(
            result.customerInfo.entitlements.active
          );
          await this.handleSuccessfulRevenueCatProdPackageTransactionResult(
            activeEntitlementsArray,
            revenueCatProdPackage
          ).subscribe();
          resolve({
            skuId: revenueCatProdPackage.identifier,
            permissions: activeEntitlementsArray,
            result: 'success',
            error: null,
          });
        } else {
          resolve({
            skuId: null,
            permissions: null,
            result: 'no permissions',
            error: 'Receipt not validated',
          });
        }
      } catch (error: any) {
        console.log(`GOT ERROR: `, error);
        // Log standard properties
        console.log('Error message:', error.message);

        if (error.message.includes('UserCancelPurchase')) {
          resolve({
            skuId: null,
            permissions: null,
            result: 'cancelled',
            error: 'Purchase cancelled by user',
          });
        }
        if (error.message.includes('ProductAlreadyOwned')) {
          resolve({
            skuId: null,
            permissions: null,
            result: 'alreadyOwned',
            error: 'Purchase cancelled by user',
          });
        }
        console.error('Error purchasing SKU: ', error);
        resolve({
          skuId: null,
          permissions: null,
          result: 'error',
          error: error,
        });
      }
    });
  }

  handleSuccessfulTransactionResult(
    transaction: GlassfyTransaction,
    sku: GlassfySku
  ): Observable<any> {
    // send to backend for processing/adding profile perms
    const body = { transaction, sku };
    return this.http.post(`${this.API_URL}/newPurchase`, body);
  }

  handleSuccessfulRevenueCatSubPackageTransactionResult(
    activeEntitlements: PurchasesEntitlementInfo[],
    revenueCatSubPackage: PurchasesPackage
  ): Observable<any> {
    // send to backend for processing/adding profile perms
    const body = { activeEntitlements, revenueCatSubPackage };
    return this.http.post(
      `${this.API_URL}/newPurchaseRevenueCatSubPackage`,
      body
    );
  }

  handleSuccessfulRevenueCatProdPackageTransactionResult(
    activeEntitlements: PurchasesEntitlementInfo[],
    revenueCatProdPackage: PurchasesPackage
  ): Observable<any> {
    // send to backend for processing/adding profile perms
    const body = { activeEntitlements, revenueCatProdPackage };
    return this.http.post(
      `${this.API_URL}/newPurchaseRevenueCatProdPackage`,
      body
    );
  }

  handleExistingPermissions(permissions: any): Observable<any> {
    // send to backend for updating profile perms (including adding AI tokens if time to)
    const body = { permissions };
    console.log(`SENDING PERMISSIONS TO BACKEND: `, body);
    setTimeout(() => {
      this.authService.refreshProfile();
    }, 1500);
    if (permissions.length > 0) {
      if (permissions[0].permissionId) {
        // need to use glassfy backend route
        return this.http.post(`${this.API_URL}/updatePermissions`, body);
      } else {
        // use revenuecat backend route
        return this.http.post(`${this.API_URL}/updatePermissions`, body);
      }
    } else {
      console.log('NO PERMISSIONS TO UPDATE, SENDING EMPTY ARRAY');
      return this.http.post(`${this.API_URL}/updatePermissions`, {
        permissions: [],
      });
    }
  }

  async restorePurchases(): Promise<void> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo) {
        // sign out of the app
        this.authService.logout().then(() => {
          this.router.navigate(['/login']);
        });
        PushNotifications.unregister;
      }
    } catch (err) {
      console.error('Error restoring purchases: ', err);
    }
  }
}
