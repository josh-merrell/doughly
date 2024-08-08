const { errorGen } = require('../../middleware/errorHandling');
const { productConstants } = require('../../services/purchaseService');
('use strict');
module.exports = ({ db, dbDefault }) => {
  const unhideRecipes = async (userID) => {
    try {
      // just set 'hidden' to false for all user recipes and recipe subscriptions
      const { error: error } = await db.from('recipes').update({ hidden: false }).eq('userID', userID);
      if (error) {
        throw errorGen(`Error unhiding recipes: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
      }
      const { error: error2 } = await db.from('recipeSubscriptions').update({ hidden: false }).eq('userID', userID);
      if (error2) {
        throw errorGen(`Error unhiding recipe subscriptions: ${error2.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      return 'success';
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in purchases unhideRecipes', err.code || 520, err.name || 'unhandledError_purchases-unhideRecipes', err.isOperational || false, err.severity || 2);
    }
  };

  const calculateAITokenUpdate = async (userID) => {
    try {
      const tokenUpdate = {
        needsUpdate: false,
        newCount: 0,
        newDate: null,
      };
      global.logger.info({ message: `CALCULATING AI TOKEN UPDATE FOR USER: ${userID}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      // check for 'permAITokenLastRefreshData' value
      const { data: profile, error: error } = await dbDefault.from('profiles').select().eq('user_id', userID).single();
      if (error) {
        throw errorGen(`Error getting profile: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!profile) {
        throw errorGen(`Profile not found`, 515, 'cannotComplete', false, 3);
      }
      let addAITokens = false;
      let monthsPassed = 0;
      const today = new Date();

      // if profile.permAITokenLastRefreshDate is not set or is at least a month old (same day of month), set 'addAITokens' to true
      if (!profile.permAITokenLastRefreshDate) {
        global.logger.info({ message: `No permAITokenLastRefreshDate found`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
        monthsPassed = 1;
        addAITokens = true;
      } else {
        // determine how many months have passed since the last refresh
        const lastRefreshDate = new Date(profile.permAITokenLastRefreshDate);
        monthsPassed = (today.getFullYear() - lastRefreshDate.getFullYear()) * 12 + today.getMonth() - lastRefreshDate.getMonth();
        if (monthsPassed >= 1) {
          global.logger.info({ message: `More than a month since last refresh: ${monthsPassed}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          addAITokens = true;
        }
      }

      // determine new 'permAITokenCount' value. Choose smaller of either productConstants.maxAICredits or current 'permAITokenCount' + productConstants.monthlyAICredits * monthsPassed
      if (addAITokens) {
        tokenUpdate.needsUpdate = true;
        global.logger.info({ message: `PERMAITOKENCOUNT: ${profile.permAITokenCount}. CONST: ${productConstants.subscription.monthlyAICredits}. MONTHS PASSED: ${monthsPassed}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
        tokenUpdate.newCount = Math.min(productConstants.subscription.maxAICredits, profile.permAITokenCount + productConstants.subscription.monthlyAICredits * monthsPassed);
        // set 'permAITokenLastRefreshDate' to be 'monthsPassed' months from previous 'permAITokenLastRefreshDate'
        let newRefreshDate;
        if (!profile.permAITokenLastRefreshDate) {
          newRefreshDate = new Date(today);
        } else {
          newRefreshDate = new Date(profile.permAITokenLastRefreshDate);
          newRefreshDate.setMonth(newRefreshDate.getMonth() + monthsPassed);
        }
        tokenUpdate.newDate = newRefreshDate.toISOString();
        global.logger.info({ message: `New permAITokenCount: ${tokenUpdate.newCount}, New permAITokenLastRefreshDate: ${tokenUpdate.newDate}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      }
      return tokenUpdate;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in purchases calculateAITokenUpdate', err.code || 520, err.name || 'unhandledError_purchases-calculateAITokenUpdate', err.isOperational || false, err.severity || 2);
    }
  };

  return {
    processNewPurchase: async (options) => {
      const { userID, transaction, sku } = options;

      try {
        global.logger.info({ message: `PROCESSING NEW PURCHASE. SKU: ${JSON.stringify(sku)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        // get current profile
        const { data: profile, error1 } = await dbDefault.from('profiles').select().eq('user_id', userID).single();
        if (error1) {
          throw errorGen(`Error getting profile: ${error1.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        if (!profile) {
          throw errorGen(`Profile not found, cannot process purchase`, 515, 'cannotComplete', false, 2);
        }
        if (!transaction || !sku) {
          throw errorGen(`Missing transaction or sku, cannot process purchase', 400`, 515, 'cannotComplete', false, 2);
        }
        if (!transaction.permissions) {
          throw errorGen(`Missing transaction productId, cannot process purchase`, 515, 'cannotComplete', false, 3);
        }

        const newProfile = {};
        let addTokens;
        switch (sku.skuId) {
          case 'doughly_aicredits10_once_2.99':
            addTokens = 10;
            break;
          case 'doughly_premium_monthly_3.99':
            newProfile['isPremium'] = true;
            newProfile['permRecipeSubscribeUnlimited'] = true;
            newProfile['permRecipeCreateUnlimited'] = true;
            newProfile['permDataBackupDaily6MonthRetention'] = true;
            break;
          case 'doughly_premium_6months_17.94':
            newProfile['isPremium'] = true;
            newProfile['permRecipeSubscribeUnlimited'] = true;
            newProfile['permRecipeCreateUnlimited'] = true;
            newProfile['permDataBackupDaily6MonthRetention'] = true;
            break;
          default:
            global.logger.info({ message: `Invalid purchase sku.skuId: ${sku.skuId}, cannot process purchase`, level: 3, timestamp: new Date().toISOString(), userID: userID });
            break;
        }

        if (sku.skuId !== 'doughly_aicredits10_once_2.99') {
          const tokenUpdate = await calculateAITokenUpdate(userID);
          if (tokenUpdate.needsUpdate) {
            newProfile['permAITokenCount'] = tokenUpdate.newCount;
            newProfile['permAITokenLastRefreshDate'] = tokenUpdate.newDate;
          }
        } else {
          newProfile['permAITokenCount'] = Math.min(productConstants.subscription.maxAICredits, profile.permAITokenCount + addTokens);
        }

        global.logger.info({ message: `UPDATING PROFILE PERMS after purchase: ${JSON.stringify(newProfile)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update(newProfile).eq('user_id', userID);
        if (error) {
          throw errorGen(`Error updating profile: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        return updatedProfile;
      } catch (err) {
        throw errorGen(err.message || 'Unhandled Error in purchases processNewPurchase', err.code || 520, err.name || 'unhandledError_purchases-processNewPurchase', err.isOperational || false, err.severity || 2);
      }
    },

    updatePermissions: async (options) => {
      const { userID, permissions } = options;

      try {
        if (!permissions) {
          throw errorGen(`Missing glassfy permissions array`, 510, 'dataValidationErr', false, 3);
        }
        if (userID === 'a525810e-5531-4f97-95a4-39a082f7416b') {
          global.logger.info({ message: `Skipping permissions update for Doughly Recipes user`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          return 'success';
        }

        global.logger.info({ message: `PERMISSIONS TO UPDATE PROFILE: ${JSON.stringify(permissions)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
        const newProfile = {};
        for (const permission of permissions) {
          let tokenUpdate;
          switch (permission.permissionId) {
            case 'recipe-subscribed-count-unlimited':
              newProfile['permRecipeSubscribeUnlimited'] = permission.isValid;
              break;
            case 'recipe-created-count-unlimited':
              newProfile['permRecipeCreateUnlimited'] = permission.isValid;
              break;
            case 'data-backup-daily-6-month-retention':
              newProfile['permDataBackupDaily6MonthRetention'] = permission.isValid;
              break;
            case 'recipe-create-AI-credit-count-12':
              tokenUpdate = await calculateAITokenUpdate(userID);
              if (tokenUpdate.needsUpdate) {
                newProfile['permAITokenCount'] = tokenUpdate.newCount;
                newProfile['permAITokenLastRefreshDate'] = tokenUpdate.newDate;
              }
              break;
            case 'recipe-credits-10':
              break;
            default:
              global.logger.info({ message: `Unhandled permissionId: ${permission.permissionId}`, level: 3, timestamp: new Date().toISOString(), userID: userID });
              break;
          }
        }

        // update profile with new permissions
        global.logger.info({ message: `UPDATING PROFILE PERMS: ${JSON.stringify(newProfile)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update(newProfile).eq('user_id', userID);
        if (error) {
          throw errorGen(`Error updating profile: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        return updatedProfile;
      } catch (err) {
        throw errorGen(err.message || 'Unhandled Error in purchases updatePermissions', err.code || 520, err.name || 'unhandledError_purchases-updatePermissions', err.isOperational || false, err.severity || 2);
      }
    },
    updateEntitlementsRevenueCat: async (options) => {
      const { userID, entitlements } = options;

      try {
        if (!entitlements) {
          throw errorGen(`Missing RevenueCat active entitlements array`, 510, 'dataValidationErr', false, 3);
        }
        if (userID === 'a525810e-5531-4f97-95a4-39a082f7416b') {
          global.logger.info({ message: `Skipping entitlements update for Doughly Recipes user`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          return 'success';
        }

        global.logger.info({ message: `REVENUECAT ENTITLEMENTS TO UPDATE PROFILE: ${JSON.stringify(entitlements)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
        const newProfile = {};
        for (const entitlement of entitlements) {
          let tokenUpdate;
          switch (entitlement.identifier) {
            case 'recipe-subscribed-count-unlimited':
              newProfile['permRecipeSubscribeUnlimited'] = entitlement.isActive;
              break;
            case 'recipe-created-count-unlimited':
              newProfile['permRecipeCreateUnlimited'] = entitlement.isActive;
              break;
            case 'data-backup-daily-6-month-retention':
              newProfile['permDataBackupDaily6MonthRetention'] = entitlement.isActive;
              break;
            case 'recipe-create-AI-credit-count-12':
              tokenUpdate = await calculateAITokenUpdate(userID);
              if (tokenUpdate.needsUpdate) {
                newProfile['permAITokenCount'] = tokenUpdate.newCount;
                newProfile['permAITokenLastRefreshDate'] = tokenUpdate.newDate;
              }
              break;
            case 'recipe-credits-10':
              break;
            default:
              global.logger.info({ message: `Unhandled Entitlement identifier: ${entitlement.identifier}`, level: 3, timestamp: new Date().toISOString(), userID: userID });
              break;
          }
        }

        // update profile with new entitlements
        global.logger.info({ message: `UPDATING PROFILE PERMS: ${JSON.stringify(newProfile)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update(newProfile).eq('user_id', userID);
        if (error) {
          throw errorGen(`Error updating profile: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        return updatedProfile;
      } catch (err) {
        throw errorGen(err.message || 'Unhandled Error in purchases updateEntitlementsRevenueCat', err.code || 520, err.name || 'unhandledError_purchases-updateEntitlementsRevenueCat', err.isOperational || false, err.severity || 2);
      }
    },
  };
};
