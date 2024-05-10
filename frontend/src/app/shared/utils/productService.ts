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

// define PurchaseResult interface
interface PurchaseResult {
  productId: string | null;
  permissions: GlassfyPermissions | null;
  error: any;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly API_URL = `${environment.BACKEND}/purchases`;
  public offerings: WritableSignal<GlassfyOffering[]> = signal([]);
  constructor(private http: HttpClient, private authService: AuthService) {
    this.initGlassfy();
  }

  async initGlassfy() {
    try {
      await Glassfy.initialize({
        apiKey: environment.GLASSFY_ApiKey,
        watcherMode: false,
      });
      const permissions = await Glassfy.permissions();
      console.log('Glassfy Permissions: ', permissions);
      this.handleExistingPermissions(permissions);

      const offerings: GlassfyOfferings = await Glassfy.offerings();
      this.offerings.set(offerings.all);
    } catch (error) {
      console.error('Error initializing Glassfy: ', error);
    }
  }

  async restore() {
    const permissions = await Glassfy.restorePurchases();
    console.log('Glassfy Permissions restored: ', permissions);
  }

  async updatePermissions() {
    // called when permissions may have changed
    const permissions = await Glassfy.permissions();
    console.log('Updated Glassfy Permissions: ', permissions);
    this.handleExistingPermissions(permissions);
  }

  async purchase(sku: GlassfySku): Promise<PurchaseResult> {
    try {
      const transaction = await Glassfy.purchaseSku({ sku });
      console.log('Transaction: ', transaction);
      if (transaction.receiptValidated) {
        this.handleSuccessfulTransactionResult(transaction, sku);
        return {
          productId: transaction.productId,
          permissions: transaction.permissions,
          error: null,
        };
      }
      return {
        productId: null,
        permissions: null,
        error: 'Receipt not validated',
      };
    } catch (error) {
      console.error('Error purchasing SKU: ', error);
      return {
        productId: null,
        permissions: null,
        error: error,
      };
    }
  }

  async handleSuccessfulTransactionResult(
    transaction: GlassfyTransaction,
    sku: GlassfySku
  ) {
    // send to backend for processing/adding profile perms
    const body = { transaction, sku };
    this.http.post(`${this.API_URL}/newPurchase`, body);
  }

  async handleExistingPermissions(permissions: GlassfyPermissions) {
    // send to backend for updating profile perms (including adding AI tokens if time to)
    const body = { permissions };
    this.http.post(`${this.API_URL}/updatePermissions`, body);
  }
}
