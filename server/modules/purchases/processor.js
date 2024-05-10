const { errorGen } = require('../../middleware/errorHandling');
const { productConstants } = require('../../services/purchaseService');
('use strict');
module.exports = ({ dbDefault }) => {
  const calculateAITokenUpdate = async (userID) => {
    const tokenUpdate = {
      needsUpdate: false,
      newCount: 0,
      newDate: null,
    };
    try {
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
        addAITokens = true;
      } else {
        // determine how many months have passed since the last refresh
        const lastRefreshDate = new Date(profile.permAITokenLastRefreshDate);
        monthsPassed = (today.getFullYear() - lastRefreshDate.getFullYear()) * 12 + today.getMonth() - lastRefreshDate.getMonth();
        if (monthsPassed >= 1) {
          addAITokens = true;
        }
      }

      // determine new 'permAITokenCount' value. Choose smaller of either productConstants.maxAITokens or current 'permAITokenCount' + productConstants.AITokensPerMonth * monthsPassed
      if (addAITokens) {
        tokenUpdate.needsUpdate = true;
        tokenUpdate.newCount = Math.min(productConstants.maxAITokens, profile.permAITokenCount + productConstants.AITokensPerMonth * monthsPassed);
        // set 'permAITokenLastRefreshDate' to be 'monthsPassed' months from previous 'permAITokenLastRefreshDate'
        const newRefreshDate = new Date(profile.permAITokenLastRefreshDate);
        newRefreshDate.setMonth(newRefreshDate.getMonth() + monthsPassed);
        tokenUpdate.newDate = newRefreshDate.toISOString();
      }
      return tokenUpdate;
    } catch (e) {
      global.logger.error(`Error calculating AI token update: ${e.message}`);
      throw errorGen(`Error calculating AI token update: ${e.message}`, 400);
    }
  };

  return {
    processNewPurchase: async (req, res) => {
      const { transaction, sku } = req.body;
      try {
        global.logger.log(`PROCESSING NEW PURCHASE: ${JSON.stringify(transaction)}, ${JSON.stringify(sku)}`);
        if (!transaction || !sku) {
          throw errorGen('Missing transaction or sku', 400);
        }
        if (!transaction.productId) {
          throw errorGen('Missing transaction productId', 400);
        }

        const newProfile = {};
        switch (transaction.productId) {
          case 'doughly_premium_monthly_2.99':
          case 'doughly_premium_6months_17.94':
            newProfile['isPremium'] = true;
            newProfile['permRecipeSubscribeUnlimited'] = true;
            newProfile['permRecipeCreateUnlimited'] = true;
            newProfile['permDataBackupDaily6MonthRetention'] = true;
            break;
          default:
            throw errorGen('Invalid transaction productId', 400);
        }

        const tokenUpdate = await calculateAITokenUpdate(req.userID);
        if (tokenUpdate.needsUpdate) {
          newProfile['permAITokenCount'] = tokenUpdate.newCount;
          newProfile['permAITokenLastRefreshDate'] = tokenUpdate.newDate;
        }

        global.logger.log(`UPDATING PROFILE PERMS: ${JSON.stringify(newProfile)}`);
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update(newProfile).eq('user_id', req.userID);
        if (error) {
          throw errorGen(`Error updating profile: ${error.message}`, 400);
        }
        return res.json({ updatedProfile });
      } catch (e) {
        global.logger.error(`Error processing new purchase. transaction: ${JSON.stringify(transaction)}, sku: ${JSON.stringify(sku)} ${e.message}`);
        throw errorGen(`Error processing new purchase. transaction: ${JSON.stringify(transaction)}, sku: ${JSON.stringify(sku)} ${e.message}`, 400);
      }
    },

    updatePermissions: async (req, res) => {
      const { permissions } = req.body;
      try {
        if (!permissions) {
          throw errorGen('Missing transaction productId', 400);
        }

        global.logger.log(`PERMISSIONS TO UPDATE PROFILE: ${JSON.stringify(permissions.all)}`);
        const newProfile = {};
        for (const permission in permissions.all) {
          if (!permissions.isValid) {
            continue;
          }
          let tokenUpdate;
          switch (permission.permissionId) {
            case 'recipe-subscribed-count-unlimited':
              newProfile['permRecipeSubscribeUnlimited'] = permission.value;
              break;
            case 'recipe-create-count-unlimited':
              newProfile['permRecipeCreateUnlimited'] = permission.value;
              break;
            case 'data-backup-daily-6-month-retention':
              newProfile['permDataBackupDaily6MonthRetention'] = permission.value;
              break;
            case 'recipe-create-AI-credit-count-12':
              tokenUpdate = await calculateAITokenUpdate(req.userID);
              if (tokenUpdate.needsUpdate) {
                newProfile['permAITokenCount'] = tokenUpdate.newCount;
                newProfile['permAITokenLastRefreshDate'] = tokenUpdate.newDate;
              }
              break;
            default:
              throw errorGen('Unhandles permissionId', 400);
          }
        }

        // update profile with new permissions
        global.logger.log(`UPDATING PROFILE PERMS: ${JSON.stringify(newProfile)}`);
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update(newProfile).eq('user_id', req.userID);
        if (error) {
          throw errorGen(`Error updating profile: ${error.message}`, 400);
        }
        return res.json({ updatedProfile });
      } catch (e) {
        global.logger.error(`Error updating account permissions. Glassfy permissions: ${JSON.stringify(permissions)} ${e.message}`);
        throw errorGen(`Error updating account permissions. Glassfy permissions: ${JSON.stringify(permissions)} ${e.message}`, 400);
      }
    },
  };
};
