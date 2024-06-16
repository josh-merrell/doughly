const { errorGen } = require('../../middleware/errorHandling');
const { productConstants } = require('../../services/purchaseService');
('use strict');
module.exports = ({ db, dbDefault }) => {
  const unhideRecipes = async (userID) => {
    try {
      // just set 'hidden' to false for all user recipes and recipe subscriptions
      const { error: error } = await db.from('recipes').update({ hidden: false }).eq('userID', userID);
      if (error) {
        throw errorGen(`Error unhiding recipes: ${error.message}`, 400);
      }
      const { error: error2 } = await db.from('recipeSubscriptions').update({ hidden: false }).eq('userID', userID);
      if (error2) {
        throw errorGen(`Error unhiding recipe subscriptions: ${error2.message}`, 400);
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
      global.logger.info(`CALCULATING AI TOKEN UPDATE FOR USER: ${userID}`);
      // check for 'permAITokenLastRefreshData' value
      const { data: profile, error: error } = await dbDefault.from('profiles').select().eq('user_id', userID).single();
      if (error) {
        throw errorGen(`Error getting profile: ${error.message}`, 400);
      }
      if (!profile) {
        throw errorGen('Profile not found', 400);
      }
      let addAITokens = false;
      let monthsPassed = 0;
      const today = new Date();

      // if profile.permAITokenLastRefreshDate is not set or is at least a month old (same day of month), set 'addAITokens' to true
      if (!profile.permAITokenLastRefreshDate) {
        global.logger.info('No permAITokenLastRefreshDate found');
        monthsPassed = 1;
        addAITokens = true;
      } else {
        // determine how many months have passed since the last refresh
        const lastRefreshDate = new Date(profile.permAITokenLastRefreshDate);
        monthsPassed = (today.getFullYear() - lastRefreshDate.getFullYear()) * 12 + today.getMonth() - lastRefreshDate.getMonth();
        if (monthsPassed >= 1) {
          global.logger.info(`More than a month since last refresh: ${monthsPassed}`);
          addAITokens = true;
        }
      }

      // determine new 'permAITokenCount' value. Choose smaller of either productConstants.maxAICredits or current 'permAITokenCount' + productConstants.monthlyAICredits * monthsPassed
      if (addAITokens) {
        tokenUpdate.needsUpdate = true;
        global.logger.info(`PERMAITOKENCOUNT: ${profile.permAITokenCount}. CONST: ${productConstants.subscription.monthlyAICredits}. MONTHS PASSED: ${monthsPassed}`);
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
        global.logger.info(`New permAITokenCount: ${tokenUpdate.newCount}, New permAITokenLastRefreshDate: ${tokenUpdate.newDate}`);
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
        global.logger.info(`PROCESSING NEW PURCHASE. SKU: ${JSON.stringify(sku)}`);
        // get current profile
        const { data: profile, error1 } = await dbDefault.from('profiles').select().eq('user_id', userID).single();
        if (error1) {
          throw errorGen(`Error getting profile: ${error1.message}`, 400);
        }
        if (!profile) {
          throw errorGen('Profile not found', 400);
        }
        if (!transaction || !sku) {
          throw errorGen('Missing transaction or sku', 400);
        }
        if (!transaction.permissions) {
          throw errorGen('Missing transaction productId', 400);
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
            global.logger.error(`Invalid purchase sku.skuId: ${sku.skuId}`);
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

        global.logger.info(`UPDATING PROFILE PERMS: ${JSON.stringify(newProfile)}`);
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update(newProfile).eq('user_id', userID);
        if (error) {
          throw errorGen(`Error updating profile: ${error.message}`, 400);
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
          throw errorGen('Missing transaction productId', 400);
        }

        global.logger.info(`PERMISSIONS TO UPDATE PROFILE: ${JSON.stringify(permissions.all)}`);
        const newProfile = {};
        for (const permission of permissions.all) {
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
              global.logger.error(`Unhandled permissionId: ${permission.permissionId}`);
              break;
          }
        }

        // update profile with new permissions
        global.logger.info(`UPDATING PROFILE PERMS: ${JSON.stringify(newProfile)}`);
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update(newProfile).eq('user_id', userID);
        if (error) {
          throw errorGen(`Error updating profile: ${error.message}`, 400);
        }
        return updatedProfile;
      } catch (err) {
        throw errorGen(err.message || 'Unhandled Error in purchases updatePermissions', err.code || 520, err.name || 'unhandledError_purchases-updatePermissions', err.isOperational || false, err.severity || 2);
      }
    },
  };
};
