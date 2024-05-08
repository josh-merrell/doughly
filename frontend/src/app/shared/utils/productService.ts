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

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  public offerings: WritableSignal<GlassfyOffering[]> = signal([]);
  constructor(private authService: AuthService) {
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

  async purchase(sku: GlassfySku) {
    try {
      const transaction = await Glassfy.purchaseSku({ sku });
      console.log('Transaction: ', transaction);
      if (transaction.receiptValidated) {
        this.handleSuccessfulTransactionResult(transaction, sku);
      }
    } catch (error) {
      console.error('Error purchasing SKU: ', error);
    }
  }

  async handleSuccessfulTransactionResult(
    transaction: GlassfyTransaction,
    sku: GlassfySku
  ) {
    if (transaction.productId.indexOf('doughly_premium_monthly_2.99')) {
      // update profile with 'premium' "true" status
      this.authService.updateField('isPremium', 'true');
    }
  }

  async handleExistingPermissions(permissions: GlassfyPermissions) {
    for (const perm of permissions.all) {
      let permRecipeSubscribeUnlimited = false;
      let permRecipeCreateUnlimited = false;
      let permDataBackupDaily6MonthRetention = false;
      if (perm.permissionId === 'recipe-subscribed-count-unlimited') {
        permRecipeSubscribeUnlimited = true;
      } else if (perm.permissionId === 'recipe-created-count-unlimited') {
        permRecipeCreateUnlimited = true;
      } else if (perm.permissionId === 'data-backup-daily-6-month-retention') {
        permDataBackupDaily6MonthRetention = true;
      }

      // send an update to the profile with all theses permissions
      const updateBody = {
        permRecipeSubscribeUnlimited: permRecipeSubscribeUnlimited,
        permRecipeCreateUnlimited: permRecipeCreateUnlimited,
        permDataBackupDaily6MonthRetention: permDataBackupDaily6MonthRetention,
      };
      this.authService.updateProfile({ profile: updateBody });
    }
  }
}
