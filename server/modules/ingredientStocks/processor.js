('use strict');

const { createKitchenLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { errorGen } = require('../../middleware/errorHandling');
const { default: axios } = require('axios');
const { supplyCheckRecipeIngredient } = require('../../services/supply');

module.exports = ({ db, dbPublic }) => {
  async function getAll(options) {
    const { userID, ingredientStockIDs, ingredientID, purchasedBy } = options;

    try {
      let q = db.from('ingredientStocks').select().filter('userID', 'eq', userID).eq('deleted', false).order('ingredientStockID', { ascending: true });
      if (ingredientStockIDs) {
        q = q.in('ingredientStockID', ingredientStockIDs);
      }
      if (ingredientID) {
        q = q.eq('ingredientID', ingredientID);
      }
      if (purchasedBy) {
        q = q.eq('purchasedBy', purchasedBy);
      }
      const { data: ingredientStocks, error } = await q;

      if (error) {
        throw errorGen(`*ingredientStocks-getAll* Error getting ingredientStocks: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*ingredientStocks-getAll* Got ${ingredientStocks.length} ingredientStocks`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      return ingredientStocks;
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-getAll* Unhandled Error in ingredientStocks getAll', err.code || 520, err.name || 'unhandledError_ingredientStocks-getAll', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function getIngredientStockByID(options) {
    const { ingredientStockID } = options;

    try {
      const { data: ingredientStock, error } = await db.from('ingredientStocks').select().eq('ingredientStockID', ingredientStockID).eq('deleted', false);

      if (error) {
        throw errorGen(`*ingredientStocks-getIngredientStockByID* Error getting ingredientStock ID: ${ingredientStockID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      return ingredientStock[0];
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-getIngredientStockByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-getIngredientStockByID', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function create(options) {
    const { authorization, customID, userID, ingredientID, measurement, purchasedDate } = options;

    try {
      global.logger.info(`*ingredientStocks-create* IN CREATE ING STOCK. customID: ${customID}, userID: ${userID}, ingredientID: ${ingredientID}, measurement: ${measurement}, purchasedDate: ${purchasedDate}`)
      //verify that the provided ingredientID is valid, return error if not
      const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID);
      if (error) {
        throw errorGen(`*ingredientStocks-create* Error validating provided ingredientID: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingIngredient.length === 0) {
        throw errorGen(`*ingredientStocks-create* Ingredient ID does not exist, cannot create ingredientStock`, 515, 'cannotComplete', false, 3);
      }

      //verify that provided measurement is positive integer, return error if not
      if (!measurement || measurement < 1) {
        throw errorGen(`*ingredientStocks-create* positive measurement integer is required`, 510, 'dataValidationErr', false, 3);
      }

      //calculate grams for new stock using gramRatio for the ingredient
      const grams = measurement * existingIngredient[0].gramRatio;

      //create the ingredientStock
      const { data: newIngredientStock, error: newIngredientStockError } = await db.from('ingredientStocks').insert({ ingredientStockID: customID, userID, ingredientID, purchasedDate, grams }).select().single();
      if (newIngredientStockError) {
        throw errorGen(`*ingredientStocks-create* Error creating ingredientStock: ${newIngredientStockError.message}`, 512, 'failSupabaseInsert', true, 3);
      }

      //add a 'created' log entry
      createKitchenLog(userID, authorization, 'createIngredientStock', Number(newIngredientStock.ingredientStockID), ingredientID, null, null, `Added ${newIngredientStock.grams} grams of ${existingIngredient[0].name}`);

      return {
        ingredientStockID: newIngredientStock.ingredientStockID,
        ingredientID: newIngredientStock.ingredientID,
        grams: newIngredientStock.grams,
        purchasedDate: newIngredientStock.purchasedDate,
      };
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-create* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-create', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function update(options) {
    const { authorization, userID, ingredientStockID, grams } = options;

    try {
      //verify that the provided ingredientStockID is valid, return error if not
      const { data: existingIngredientStock, error } = await db.from('ingredientStocks').select().filter('userID', 'eq', userID).filter('ingredientStockID', 'eq', ingredientStockID);
      if (error) {
        throw errorGen(`*ingredientStocks-update* Error validating provided ingredientStockID: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingIngredientStock.length === 0) {
        throw errorGen(`*ingredientStocks-update* IngredientStock ID does not exist, cannot update ingredientStock`, 515, 'cannotComplete', false, 3);
      }

      //verify that provided grams is positive integer, return error if not
      if (grams && grams < 1) {
        throw errorGen(`*ingredientStocks-update* positive grams integer is required`, 510, 'dataValidationErr', false, 3);
      }

      //update the ingredientStock
      const updateFields = {};
      for (let key in options) {
        if (key !== 'ingredientStockID' && options[key] !== undefined && key !== 'authorization') {
          updateFields[key] = options[key];
        }
      }

      const updatedIngredientStock = await updater(userID, authorization, 'ingredientStockID', ingredientStockID, 'ingredientStocks', updateFields);
      return updatedIngredientStock;
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-update* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-update', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function deleteIngredientStock(options) {
    const { userID, ingredientStockID, authorization, checkForLowStockBool = true } = options;

    try {
      //verify that the provided ingredientStockID is valid, return error if not
      const { data: existingIngredientStock, error } = await db.from('ingredientStocks').select().eq('ingredientStockID', ingredientStockID).eq('deleted', false).single();
      if (error) {
        throw errorGen(`*ingredientStocks-deleteIngredientStock* Error validating provided ingredientStockID: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingIngredientStock.length === 0) {
        throw errorGen(`*ingredientStocks-deleteIngredientStock* IngredientStock ID does not exist, cannot delete ingredientStock`, 511, 'failSupabaseSelect', true, 3);
      }

      //get name of the associated ingredients
      const { data: ingredient } = await db.from('ingredients').select('name').eq('ingredientID', existingIngredientStock.ingredientID).single();

      //delete the ingredientStock
      const { error: deleteError } = await db.from('ingredientStocks').update({ deleted: true }).eq('ingredientStockID', ingredientStockID);
      if (deleteError) {
        throw errorGen(`*ingredientStocks-deleteIngredientStock* Error deleting ingredientStock: ${deleteError.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      //add a 'deleted' log entry
      createKitchenLog(userID, authorization, 'deleteIngredientStock', Number(ingredientStockID), Number(existingIngredientStock.ingredientID), null, null, `Deleted: ${existingIngredientStock.grams} grams of ${ingredient.name}`);

      // call the 'checkForLowStock' function, passing the ingredientID and userID
      if (checkForLowStockBool) {
        checkForLowStock({ ingredientID: existingIngredientStock.ingredientID, userID, authorization });
      }

      return { success: true };
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-deleteIngredientStock* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-deleteIngredientStock', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function deleteAllExpired(options) {
    const { authorization } = options;

    try {
      // get all unique userID's who have a non-deleted ingredientStock
      const { data: users, error: usersError } = await db.from('ingredientStockDistinctUsers').select('*');
      if (usersError) {
        throw errorGen(`*ingredientStocks-deleteAllExpired* Error getting unique userID's: ${usersError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const promises = [];
      for (const user of users) {
        const { userID } = user;
        promises.push(deleteExpiredStockForUser(userID, authorization));
      }

      // use Promise.allSettled to ensure all promises are resolved before returning
      await Promise.allSettled(promises);

      global.logger.info('*ingredientStocks-deleteAllExpired* Deleted all expired ingredientStocks');
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-deleteAllExpired* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-deleteAllExpired', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function deleteExpiredStockForUser(userID, authorization) {
    try {
      // get all non-deleted ingredientStocks for the user
      const { data: stocks, error: expiredStocksError } = await db.from('ingredientStocks').select().eq('userID', userID).eq('deleted', false);
      if (expiredStocksError) {
        throw errorGen(`*ingredientStocks-deleteExpiredStockForUser* Error getting expired ingredientStocks for user ${userID}: ${expiredStocksError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const deletePromises = [];
      let notifications = [];
      for (const stock of stocks) {
        const { ingredientStockID, ingredientID } = stock;
        const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientID).single();
        if (ingredientError) {
          throw errorGen(`*ingredientStocks-deleteExpiredStockForUser* Error getting ingredient for ingredientStockID ${ingredientStockID}: ${ingredientError.message}`, 511, 'failSupabaseSelect', true, 3);
        }

        // determine expire date using ingredient.lifespanDays and stock.purchasedDate
        const expireDate = new Date(stock.purchasedDate);
        expireDate.setDate(expireDate.getDate() + ingredient.lifespanDays);
        if (expireDate < new Date()) {
          // add app message 'ingredientStockExpired' for this row
          if (!stock.appMessageStatus) {
            db.from('ingredientStocks').update({ appMessageStatus: 'notAcked', appMessageDate: new Date() }).eq('ingredientStockID', ingredientStockID);
          }

          // get 'autoDeleteExpiredStock' setting for the user
          const { data: result, error } = await dbPublic.from('profiles').select('autoDeleteExpiredStock').eq('user_id', userID).single();
          if (error) {
            throw errorGen(`*ingredientStocks-deleteExpiredStockForUser* Error getting autoDeleteExpiredStock setting for user ${userID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
          }
          if (!result.autoDeleteExpiredStock) {
            global.logger.info({ message: `*ingredientStocks-deleteExpiredStockForUser* autoDeleteExpiredStock setting is false for user ${userID}, skipping deletion`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
            return { success: true };
          }

          // don't check for low stock. We will do that once at the end for the ingr
          deletePromises.push(deleteIngredientStock({ userID, ingredientStockID, authorization, checkForLowStockBool: false }));
          notifications.push({
            name: ingredient.name,
            measurement: stock.grams / ingredient.gramRatio,
            measurementUnit: ingredient.purchaseUnit,
            ingredientID,
            toSend: false,
          });
        }
      }

      // use Promise.allSettled to ensure all promises are resolved before returning
      await Promise.allSettled(deletePromises);

      const results = await Promise.allSettled(deletePromises);

      // for each promise, if it was successful, set 'toSend' to true for the corresponding notification
      for (let x = 0; x < results.length; x++) {
        if (results[x].status === 'fulfilled') {
          notifications[x].toSend = true;
        }
      }

      // log count of deleted ingredientStocks
      global.logger.info({ message: `*ingredientStocks-deleteExpiredStockForUser* Auto Deleted ${deletePromises.length} expired ingredientStocks for user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      // get user push tokens
      const { data: tokens, error: getTokensError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/${userID}`, {
        headers: {
          authorization,
        },
      });
      if (getTokensError) {
        throw errorGen(getTokensError.message || `*ingredientStocks-deleteExpiredStockForUser* Error getting push tokens for user ${userID}: ${getTokensError.message}`, getTokensError.code || 520, getTokensError.name || 'unhandledError_', getTokensError.isOperational || false, getTokensError.severity || 2); //message, code, name, operational, severity
      }

      // NOTIFICATIONS
      notifications = notifications.filter((notification) => notification.toSend);

      // combine the measurements of multiple notifications for the same ingredient
      const combinedNotifications = [];
      for (const notification of notifications) {
        const existingNotification = combinedNotifications.find((n) => n.ingredientID === notification.ingredientID);
        if (existingNotification) {
          existingNotification.measurement += notification.measurement;
        } else {
          combinedNotifications.push(notification);
        }
      }

      // send stock deleted notifications
      let type = combinedNotifications.length > 1 ? 'autoDeletedExpiredStocks' : 'autoDeletedExpiredStock';
      let data = {};
      if (type === 'autoDeletedExpiredStocks') {
        data['name'] = combinedNotifications[0].name;
        data['count'] = combinedNotifications.length;
      } else {
        data['name'] = combinedNotifications[0].name;
        data['measurement'] = Math.round(combinedNotifications[0].measurement * 100) / 100;
        data['measurementUnit'] = combinedNotifications[0].measurementUnit;
      }
      const { error: sendNotificationError } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/notification`,
        {
          userID,
          type,
          data,
          destTokens: tokens,
        },
        {
          headers: {
            authorization,
          },
        },
      );
      if (sendNotificationError) {
        throw errorGen(
          sendNotificationError.message || `*ingredientStocks-deleteExpiredStockForUser* Error sending push tokens for user ${userID}: ${sendNotificationError.message}`,
          sendNotificationError.code || 520,
          sendNotificationError.name || 'unhandledError_',
          sendNotificationError.isOperational || false,
          sendNotificationError.severity || 2,
        ); //message, code, name, operational, severity
      }

      // check for low stock for each ingredient
      for (const notification of combinedNotifications) {
        checkForLowStock({ ingredientID: notification.ingredientID, userID, authorization });
      }

      return { success: true };
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-deleteExpiredStockForUser* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-deleteExpiredStockForUser', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function notifyOnUpcomingExpiration(options) {
    const { authorization } = options;

    try {
      // get all unique userID's who have a non-deleted ingredientStock
      const { data: users, error: usersError } = await db.from('ingredientStockDistinctUsers').select('*');
      if (usersError) {
        throw errorGen(`*ingredientStocks-notifyOnUpcomingExpiration* Error getting unique userID's: ${usersError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const promises = [];
      for (const user of users) {
        const { userID } = user;
        promises.push(notifyUserOfUpcomingExpiration(userID, authorization));
      }

      // use Promise.allSettled to ensure all promises are resolved before returning
      await Promise.allSettled(promises);

      global.logger.info({ message: `*ingredientStocks-notifyOnUpcomingExpiration* Notified all users of upcoming expirations`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-notifyOnUpcomingExpiration* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-notifyOnUpcomingExpiration', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function notifyUserOfUpcomingExpiration(userID, authorization) {
    try {
      // get 'notifyOnUpcomingExpiry' value from user profile
      const { data: profile, error: profileError } = await dbPublic.from('profiles').select('notifyUpcomingStockExpiry').eq('user_id', userID).single();
      if (profileError) {
        throw errorGen(`*ingredientStocks-notifyUserOfUpcomingExpiration* Error getting notifyOnUpcomingExpiry setting for user ${userID}: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (profile.notifyUpcomingStockExpiry !== 'Enabled' && profile.notifyUpcomingStockExpiry !== 'Email and App Push') {
        global.logger.info({ message: `*ingredientStocks-notifyOnUpcomingExpiration* notifyOnUpcomingExpiry setting is disabled for user ${userID}, skipping notification`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        return { success: true };
      }
      // get all non-deleted ingredientStocks for the user
      const { data: stocks, error: expiredStocksError } = await db.from('ingredientStocks').select().eq('userID', userID).eq('deleted', false);
      if (expiredStocksError) {
        throw errorGen(`*ingredientStocks-notifyUserOfUpcomingExpiration* Error getting expired ingredientStocks for user ${userID}: ${expiredStocksError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const notifications = [];
      for (const stock of stocks) {
        const { ingredientStockID, ingredientID } = stock;
        const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientID).single();
        if (ingredientError) {
          throw errorGen(`*ingredientStocks-notifyUserOfUpcomingExpiration* Error getting ingredient for ingredientStockID ${ingredientStockID}: ${ingredientError.message}`, 511, 'failSupabaseSelect', true, 3);
        }

        // determine expire date using ingredient.lifespanDays and stock.purchasedDate
        const expireDate = new Date(stock.purchasedDate);
        expireDate.setDate(expireDate.getDate() + ingredient.lifespanDays);
        const daysUntilExpiration = Math.floor((expireDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiration === 3) {
          notifications.push({
            name: ingredient.name,
            measurement: stock.grams / ingredient.gramRatio,
            measurementUnit: ingredient.purchaseUnit,
            ingredientID,
            daysUntilExpiration,
          });
        }
      }

      // get user push tokens
      const { data: tokens, error: getTokensError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/${userID}`, {
        headers: {
          authorization,
        },
      });
      if (getTokensError) {
        throw errorGen(getTokensError.message || `*ingredientStocks-notifyUserOfUpcomingExpiration* Error getting push tokens for user ${userID}: ${getTokensError.message}`, getTokensError.code || 520, getTokensError.name || 'unhandledError_', getTokensError.isOperational || false, getTokensError.severity || 2); //message, code, name, operational, severity
      }

      // send expiration notifications
      for (const notification of notifications) {
        const { error: sendNotificationError } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/notification`,
          {
            userID,
            type: 'upcomingStockExpiration',
            data: { name: notification.name, measurement: Math.round(notification.measurement * 100) / 100, measurementUnit: notification.measurementUnit, ingredientID: notification.ingredientID },
            destTokens: tokens,
          },
          {
            headers: {
              authorization,
            },
          },
        );
        if (sendNotificationError) {
          throw errorGen(
            sendNotificationError.message || `*ingredientStocks-notifyUserOfUpcomingExpiration* Error sending push tokens for user ${userID}: ${sendNotificationError.message}`,
            sendNotificationError.code || 520,
            sendNotificationError.name || 'unhandledError_',
            sendNotificationError.isOperational || false,
            sendNotificationError.severity || 2,
          ); //message, code, name, operational, severity
        }
      }

      return { success: true };
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-notifyUserOfUpcomingExpiration* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-notifyUserOfUpcomingExpiration', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function checkForLowStock(options) {
    const { ingredientID, userID, authorization } = options;

    try {
      global.logger.info({ message: `*ingredientStocks-checkForLowStock* Checking for low stock for ingredient ${ingredientID} and user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // get user profile to check if notifications are enabled
      const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', userID).single();
      if (profileError) {
        throw errorGen(`*ingredientStocks-checkForLowStock* Error getting profile for user ${userID}: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // get ingredient details
      const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientID).single();
      if (ingredientError) {
        throw errorGen(`*ingredientStocks-checkForLowStock* Error getting ingredient for ingredient ${ingredientID}: ${ingredientError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // get all ingredientStocks for the ingredient
      const { data: stocks, error: stocksError } = await db.from('ingredientStocks').select().eq('userID', userID).eq('ingredientID', ingredientID).eq('deleted', false);
      if (stocksError) {
        throw errorGen(`*ingredientStocks-checkForLowStock* Error getting ingredientStocks for ingredient ${ingredientID} and user ${userID}: ${stocksError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // if there are no ingredientStocks, send notification to user if notifyOnNoStock is enabled
      if (stocks.length === 0) {
        // add app message 'ingredientOutOfStock' for this row
        await db.from('ingredients').update({ appMessageStatus: 'notAcked', appMessageDate: new Date() }).eq('ingredientID', ingredientID);

        global.logger.info({ message: `*ingredientStocks-checkForLowStock* No ingredientStocks found for ingredient ${ingredientID} and user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        if (profile.notifyOnNoStock !== 'Enabled' && profile.notifyOnNoStock !== 'Email and App Push') {
          return;
        }
        const { data: tokens, error: getTokensError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/${userID}`, {
          headers: {
            authorization,
          },
        });
        if (getTokensError) {
          throw errorGen(getTokensError.message || `*ingredientStocks-checkForLowStock* Error getting push tokens for user ${userID}: ${getTokensError.message}`, getTokensError.code || 520, getTokensError.name || 'unhandledError_', getTokensError.isOperational || false, getTokensError.severity || 2); //message, code, name, operational, severity
        }

        const { error: sendNotificationError } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/notification`,
          {
            userID,
            type: 'noStock',
            data: { name: ingredient.name, ingredientID: ingredient.ingredientID },
            destTokens: tokens,
          },
          {
            headers: {
              authorization,
            },
          },
        );

        if (sendNotificationError) {
          throw errorGen(
            sendNotificationError.message || `*ingredientStocks-checkForLowStock* Error sending push tokens for user ${userID}: ${sendNotificationError.message}`,
            sendNotificationError.code || 520,
            sendNotificationError.name || 'unhandledError_',
            sendNotificationError.isOperational || false,
            sendNotificationError.severity || 2,
          ); //message, code, name, operational, severity
        }
      } else {
        // get all recipeIngredients for the ingredient
        const { data: recipeIngredients, error: recipeIngredientsError } = await db.from('recipeIngredients').select().eq('ingredientID', ingredientID);
        if (recipeIngredientsError) {
          throw errorGen(`*ingredientStocks-checkForLowStock* Error getting recipeIngredients for ingredient ${ingredientID}: ${recipeIngredientsError.message}`, 511, 'failSupabaseSelect', true, 3);
        }

        // if no recipeIngredients, return
        if (recipeIngredients.length === 0) {
          global.logger.info({ message: `*ingredientStocks-checkForLowStock* No recipeIngredients found for ingredient ${ingredientID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          return;
        }

        let recipeCountInsufficient = 0;
        // for each recipeIngredient, check if the ingredientStocks are sufficient
        for (const ri of recipeIngredients) {
          const check = await supplyCheckRecipeIngredient(userID, authorization, ingredientID, ri.recipeID);
          global.logger.info({ message: `*ingredientStocks-checkForLowStock* Result of supplyCheckRecipeIngredient for ingredient ${ingredientID} and user ${userID}: ${JSON.stringify(check)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          if (check.status === 'insufficient') {
            recipeCountInsufficient++;
          }
        }

        // if recipeCountInsufficient > 0, send notification to user if notifyOnLowStock is enabled
        if (recipeCountInsufficient > 0) {
          if (profile.notifyOnLowStock !== 'Enabled' && profile.notifyOnLowStock !== 'Email and App Push') {
            return;
          }
          global.logger.info({ message: `*ingredientStocks-checkForLowStock* Low stock found for ${recipeCountInsufficient} recipes`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          const { data: tokens, error: getTokensError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/${userID}`, {
            headers: {
              authorization,
            },
          });
          if (getTokensError) {
            throw errorGen(getTokensError.message || `*ingredientStocks-checkForLowStock* Error getting push tokens for user ${userID}: ${getTokensError.message}`, getTokensError.code || 520, getTokensError.name || 'unhandledError_', getTokensError.isOperational || false, getTokensError.severity || 2); //message, code, name, operational, severity
          }

          const { error: sendNotificationError } = await axios.post(
            `${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/notification`,
            {
              userID,
              type: 'lowStock',
              data: { name: ingredient.name, count: recipeCountInsufficient, ingredientID: ingredient.ingredientID },
              destTokens: tokens,
            },
            {
              headers: {
                authorization,
              },
            },
          );
          if (sendNotificationError) {
            throw errorGen(
              sendNotificationError.message || `*ingredientStocks-checkForLowStock* Error sending push tokens for user ${userID}: ${sendNotificationError.message}`,
              sendNotificationError.code || 520,
              sendNotificationError.name || 'unhandledError_',
              sendNotificationError.isOperational || false,
              sendNotificationError.severity || 2,
            ); //message, code, name, operational, severity
          }
        }
      }
    } catch (err) {
      throw errorGen(err.message || '*ingredientStocks-checkForLowStock* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredientStocks-checkForLowStock', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  return {
    get: {
      all: getAll,
      byID: getIngredientStockByID,
    },
    create,
    update,
    delete: deleteIngredientStock,
    deleteAllExpired,
    checkForLowStock,
    notifyOnUpcomingExpiration,
  };
};
