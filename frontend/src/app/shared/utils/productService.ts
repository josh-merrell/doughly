import { Injectable, WritableSignal, signal } from '@angular/core';
import {
  Glassfy,
  GlassfyOffering,
  GlassfyOfferings,
  GlassfyPermissions,
  GlassfySku,
  GlassfyTransaction,
} from 'capacitor-plugin-glassfy';
import { environment } from 'src/environments/environment';
import { AuthService } from './authenticationService';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';

import { Store } from '@ngrx/store';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { ProfileService } from 'src/app/profile/data/profile.service';

// define PurchaseResult interface--
interface PurchaseResult {
  skuId: string | null;
  permissions: GlassfyPermissions | null;
  result: string;
  error: any;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly API_URL = `${environment.BACKEND}/purchases`;
  public offerings: WritableSignal<GlassfyOffering[]> = signal([]);
  public licences = {
    recipeSubscribeLimit: 10,
    recipeCreateLimit: 10,
    premiumMonthlyAICredits: 12,
    extraAITokenPurchaseCount: 10,
    maxAICredits: 30,
  };
  constructor(private http: HttpClient, private authService: AuthService) {}

  async initGlassfy() {
    try {
      if (Capacitor.isNativePlatform()) {
        await Glassfy.initialize({
          apiKey: environment.GLASSFY_ApiKey,
          watcherMode: false,
        });
        const permissions = await Glassfy.permissions();
        console.log('Glassfy Permissions: ', permissions);
        await this.handleExistingPermissions(permissions).subscribe();

        const offerings: GlassfyOfferings = await Glassfy.offerings();
        this.offerings.set(offerings.all);
      } else return;
    } catch (error) {
      console.error('Error initializing Glassfy: ', error);
    }
  }

  ngOnInit() {
    this.initGlassfy();
  }

  async restore() {
    const permissions = await Glassfy.restorePurchases();
    console.log('Glassfy Permissions restored: ', permissions);
  }

  async updatePermissions() {
    // called when permissions may have changed
    const permissions = await Glassfy.permissions();
    console.log('Updated Glassfy Permissions: ', permissions);
    await this.handleExistingPermissions(permissions).subscribe();
  }

  async purchase(sku: GlassfySku): Promise<PurchaseResult> {
    try {
      console.log(`PURCHASING SKU: ${JSON.stringify(sku)}`);
      const transaction = await Glassfy.purchaseSku({ sku });
      console.log('Transaction: ', transaction);
      if (transaction.permissions) {
        // Ensure the observable completes by converting it to a promise
        await this.handleSuccessfulTransactionResult(
          transaction,
          sku
        ).subscribe();
        return {
          skuId: sku.skuId,
          permissions: transaction.permissions,
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

  handleSuccessfulTransactionResult(
    transaction: GlassfyTransaction,
    sku: GlassfySku
  ): Observable<any> {
    // send to backend for processing/adding profile perms
    const body = { transaction, sku };
    return this.http.post(`${this.API_URL}/newPurchase`, body);
  }

  handleExistingPermissions(permissions: GlassfyPermissions): Observable<any> {
    // send to backend for updating profile perms (including adding AI tokens if time to)
    const body = { permissions };
    console.log(`SENDING PERMISSIONS TO BACKEND: `, body);
    setTimeout(() => {
      this.authService.refreshProfile();
    }, 1500);
    return this.http.post(`${this.API_URL}/updatePermissions`, body);
  }
}
