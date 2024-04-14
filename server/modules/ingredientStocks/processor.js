('use strict');

const { createKitchenLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { errorGen } = require('../../middleware/errorHandling');
const { default: axios } = require('axios');
const { supplyCheckRecipeIngredient } = require('../../services/supply');

module.exports = ({ db, dbPublic }) => {
  async function getAll(options) {
    const { userID, ingredientStockIDs, ingredientID, purchasedBy } = options;

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
      global.logger.error(`Error getting ingredientStocks: ${error.message}`);
      throw errorGen('Error getting ingredientStocks', 400);
    }
    global.logger.info(`Got ${ingredientStocks.length} ingredientStocks`);
    return ingredientStocks;
  }

  async function getIngredientStockByID(options) {
    const { ingredientStockID } = options;
    const { data: ingredientStock, error } = await db.from('ingredientStocks').select().eq('ingredientStockID', ingredientStockID).eq('deleted', false);

    if (error) {
      global.logger.error(`Error getting ingredientStock ID: ${ingredientStockID}: ${error.message}`);
      throw errorGen(`Error getting ingredientStock ID: ${ingredientStockID}`, 400);
    }
    return ingredientStock[0];
  }

  async function create(options) {
    const { authorization, customID, userID, ingredientID, measurement, purchasedDate } = options;

    //verify that the provided ingredientID is valid, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID);
    if (error) {
      global.logger.error(`Error validating provided ingredientID: ${error.message}`);
      throw errorGen(`Error validating provided ingredientID: ${error.message}`, 400);
    }
    if (existingIngredient.length === 0) {
      global.logger.error(`Ingredient ID does not exist, cannot create ingredientStock`);
      throw errorGen(`Ingredient ID does not exist, cannot create ingredientStock`, 400);
    }

    //verify that provided measurement is positive integer, return error if not
    if (!measurement || measurement < 1) {
      global.logger.error(`positive measurement integer is required`);
      throw errorGen(`positive measurement integer is required`, 400);
    }

    //calculate grams for new stock using gramRatio for the ingredient
    const grams = measurement * existingIngredient[0].gramRatio;

    //create the ingredientStock
    const { data: newIngredientStock, error: newIngredientStockError } = await db.from('ingredientStocks').insert({ ingredientStockID: customID, userID, ingredientID, purchasedDate, grams }).select().single();
    if (newIngredientStockError) {
      global.logger.error(`Error creating ingredientStock: ${newIngredientStockError.message}`);
      throw errorGen(`Error creating ingredientStock: ${newIngredientStockError.message}`, 400);
    }

    //add a 'created' log entry
    createKitchenLog(userID, authorization, 'createIngredientStock', Number(newIngredientStock.ingredientStockID), ingredientID, null, null, `Added ${newIngredientStock.grams} grams of ${existingIngredient[0].name}`);

    return {
      ingredientStockID: newIngredientStock.ingredientStockID,
      ingredientID: newIngredientStock.ingredientID,
      grams: newIngredientStock.grams,
      purchasedDate: newIngredientStock.purchasedDate,
    };
  }

  async function update(options) {
    const { authorization, userID, ingredientStockID, grams } = options;

    //verify that the provided ingredientStockID is valid, return error if not
    const { data: existingIngredientStock, error } = await db.from('ingredientStocks').select().filter('userID', 'eq', userID).filter('ingredientStockID', 'eq', ingredientStockID);
    if (error) {
      global.logger.error(`Error validating provided ingredientStockID: ${error.message}`);
      throw errorGen(`Error validating provided ingredientStockID: ${error.message}`, 400);
    }
    if (existingIngredientStock.length === 0) {
      global.logger.error(`IngredientStock ID does not exist, cannot update ingredientStock`);
      throw errorGen(`IngredientStock ID does not exist, cannot update ingredientStock`, 400);
    }

    //verify that provided grams is positive integer, return error if not
    if (grams && grams < 1) {
      global.logger.error(`positive grams integer is required`);
      throw errorGen(`positive grams integer is required`, 400);
    }

    //update the ingredientStock
    const updateFields = {};
    for (let key in options) {
      if (key !== 'ingredientStockID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedIngredientStock = await updater(userID, authorization, 'ingredientStockID', ingredientStockID, 'ingredientStocks', updateFields);
      return updatedIngredientStock;
    } catch (error) {
      global.logger.error(`Error updating ingredientStock: ${error.message}`);
      throw errorGen(`Error updating ingredientStock: ${error.message}`, 400);
    }
  }

  async function deleteIngredientStock(options) {
    const { userID, ingredientStockID, authorization, checkForLowStockBool = true } = options;

    //verify that the provided ingredientStockID is valid, return error if not
    const { data: existingIngredientStock, error } = await db.from('ingredientStocks').select().eq('ingredientStockID', ingredientStockID).eq('deleted', false).single();
    if (error) {
      global.logger.error(`Error validating provided ingredientStockID: ${error.message}`);
      throw errorGen(`Error validating provided ingredientStockID: ${error.message}`, 400);
    }
    if (existingIngredientStock.length === 0) {
      global.logger.error(`IngredientStock ID does not exist, cannot delete ingredientStock`);
      throw errorGen(`IngredientStock ID does not exist, cannot delete ingredientStock`, 400);
    }

    //get name of the associated ingredients
    const { data: ingredient } = await db.from('ingredients').select('name').eq('ingredientID', existingIngredientStock.ingredientID).single();

    //delete the ingredientStock
    const { error: deleteError } = await db.from('ingredientStocks').update({ deleted: true }).eq('ingredientStockID', ingredientStockID);
    if (deleteError) {
      global.logger.error(`Error deleting ingredientStock: ${deleteError.message}`);
      throw errorGen(`Error deleting ingredientStock: ${deleteError.message}`, 400);
    }

    //add a 'deleted' log entry
    createKitchenLog(userID, authorization, 'deleteIngredientStock', Number(ingredientStockID), Number(existingIngredientStock.ingredientID), null, null, `Deleted: ${existingIngredientStock.grams} grams of ${ingredient.name}`);

    // call the 'checkForLowStock' function, passing the ingredientID and userID
    if (checkForLowStockBool) {
      checkForLowStock({ ingredientID: existingIngredientStock.ingredientID, userID, authorization });
    }

    return { success: true };
  }

  async function deleteAllExpired(options) {
    const { authorization } = options;
    try {
      // get all unique userID's who have a non-deleted ingredientStock
      const { data: users, error: usersError } = await db.from('ingredientStockDistinctUsers').select('*');
      if (usersError) {
        global.logger.error(`Error getting unique userID's: ${usersError.message}`);
        throw errorGen(`Error getting unique userID's: ${usersError.message}`, 400);
      }
      const promises = [];
      for (const user of users) {
        const { userID } = user;
        promises.push(deleteExpiredStockForUser(userID, authorization));
      }

      // use Promise.allSettled to ensure all promises are resolved before returning
      await Promise.allSettled(promises);

      global.logger.info('Deleted all expired ingredientStocks');
      return { success: true };
    } catch (error) {
      global.logger.error(`Error deleting all expired ingredientStocks: ${error.message}`);
      throw errorGen(`Error deleting all expired ingredientStocks: ${error.message}`, 400);
    }
  }

  async function deleteExpiredStockForUser(userID, authorization) {
    try {
      // get all non-deleted ingredientStocks for the user
      const { data: stocks, error: expiredStocksError } = await db.from('ingredientStocks').select().eq('userID', userID).eq('deleted', false);
      if (expiredStocksError) {
        global.logger.error(`Error getting expired ingredientStocks for user ${userID}: ${expiredStocksError.message}`);
        throw errorGen(`Error getting expired ingredientStocks for user ${userID}: ${expiredStocksError.message}`, 400);
      }
      const deletePromises = [];
      let notifications = [];
      for (const stock of stocks) {
        const { ingredientStockID, ingredientID } = stock;
        const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientID).single();
        if (ingredientError) {
          global.logger.error(`Error getting ingredient for ingredientStockID ${ingredientStockID}: ${ingredientError.message}`);
          throw errorGen(`Error getting ingredient for ingredientStockID ${ingredientStockID}: ${ingredientError.message}`, 400);
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
            global.logger.error(`Error getting autoDeleteExpiredStock setting for user ${userID}: ${error.message}`);
            throw errorGen(`Error getting autoDeleteExpiredStock setting for user ${userID}: ${error.message}`, 400);
          }
          if (!result.autoDeleteExpiredStock) {
            global.logger.info(`autoDeleteExpiredStock setting is false for user ${userID}, skipping deletion`);
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
      global.logger.info(`Auto Deleted ${deletePromises.length} expired ingredientStocks for user ${userID}`);

      // get user push tokens
      const { data: tokens, error: getTokensError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/${userID}`, {
        headers: {
          authorization,
        },
      });
      if (getTokensError) {
        global.logger.error(`Error getting push tokens for user ${userID}: ${getTokensError.message}`);
        throw errorGen(`Error getting push tokens for user ${userID}: ${getTokensError.message}`, 400);
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
        global.logger.error(`Error sending push notifications for user ${userID}: ${sendNotificationError.message}`);
        throw errorGen(`Error sending push notifications for user ${userID}: ${sendNotificationError.message}`, 400);
      }

      // check for low stock for each ingredient
      for (const notification of combinedNotifications) {
        checkForLowStock({ ingredientID: notification.ingredientID, userID, authorization });
      }

      return { success: true };
    } catch (error) {
      global.logger.error(`Error deleting expired ingredientStocks for user ${userID}: ${error.message}`);
      throw errorGen(`Error deleting expired ingredientStocks for user ${userID}: ${error.message}`, 400);
    }
  }

  async function notifyOnUpcomingExpiration(options) {
    const { authorization } = options;

    try {
      // get all unique userID's who have a non-deleted ingredientStock
      const { data: users, error: usersError } = await db.from('ingredientStockDistinctUsers').select('*');
      if (usersError) {
        global.logger.error(`Error getting unique userID's: ${usersError.message}`);
        throw errorGen(`Error getting unique userID's: ${usersError.message}`, 400);
      }
      const promises = [];
      for (const user of users) {
        const { userID } = user;
        promises.push(notifyUserOfUpcomingExpiration(userID, authorization));
      }

      // use Promise.allSettled to ensure all promises are resolved before returning
      await Promise.allSettled(promises);

      global.logger.info('Notified all users of upcoming expirations');
      return { success: true };
    } catch (error) {
      global.logger.error(`Error notifying users of upcoming expirations: ${error.message}`);
      throw errorGen(`Error notifying users of upcoming expirations: ${error.message}`, 400);
    }
  }

  async function notifyUserOfUpcomingExpiration(userID, authorization) {
    try {
      // get 'notifyOnUpcomingExpiry' value from user profile
      const { data: profile, error: profileError } = await dbPublic.from('profiles').select('notifyUpcomingStockExpiry').eq('user_id', userID).single();
      if (profileError) {
        global.logger.error(`Error getting notifyOnUpcomingExpiry setting for user ${userID}: ${profileError.message}`);
        throw errorGen(`Error getting notifyOnUpcomingExpiry setting for user ${userID}: ${profileError.message}`, 400);
      }
      if (profile.notifyUpcomingStockExpiry !== 'App Push Only' && profile.notifyUpcomingStockExpiry !== 'Email and App Push') {
        global.logger.info(`notifyOnUpcomingExpiry setting is disabled for user ${userID}, skipping notification`);
        return { success: true };
      }
      // get all non-deleted ingredientStocks for the user
      const { data: stocks, error: expiredStocksError } = await db.from('ingredientStocks').select().eq('userID', userID).eq('deleted', false);
      if (expiredStocksError) {
        global.logger.error(`Error getting expired ingredientStocks for user ${userID}: ${expiredStocksError.message}`);
        throw errorGen(`Error getting expired ingredientStocks for user ${userID}: ${expiredStocksError.message}`, 400);
      }
      const notifications = [];
      for (const stock of stocks) {
        const { ingredientStockID, ingredientID } = stock;
        const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientID).single();
        if (ingredientError) {
          global.logger.error(`Error getting ingredient for ingredientStockID ${ingredientStockID}: ${ingredientError.message}`);
          throw errorGen(`Error getting ingredient for ingredientStockID ${ingredientStockID}: ${ingredientError.message}`, 400);
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
        global.logger.error(`Error getting push tokens for user ${userID}: ${getTokensError.message}`);
        throw errorGen(`Error getting push tokens for user ${userID}: ${getTokensError.message}`, 400);
      }

      // send expiration notifications
      for (const notification of notifications) {
        const { error: sendNotificationError } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/notification`,
          {
            userID,
            type: 'upcomingStockExpiration',
            data: { name: notification.name, measurement: Math.round(notification.measurement * 100) / 100, measurementUnit: notification.measurementUnit },
            destTokens: tokens,
          },
          {
            headers: {
              authorization,
            },
          },
        );
        if (sendNotificationError) {
          global.logger.error(`Error sending push notifications for user ${userID}: ${sendNotificationError.message}`);
          throw errorGen(`Error sending push notifications for user ${userID}: ${sendNotificationError.message}`, 400);
        }
      }

      return { success: true };
    } catch (error) {
      global.logger.error(`Error notifying user of upcoming expirations for user ${userID}: ${error.message}`);
      throw errorGen(`Error notifying user of upcoming expirations for user ${userID}: ${error.message}`, 400);
    }
  }

  async function checkForLowStock(options) {
    const { ingredientID, userID, authorization } = options;

    global.logger.info(`Checking for low stock for ingredient ${ingredientID} and user ${userID}`);

    try {
      // get user profile to check if notifications are enabled
      const { data: profile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', userID).single();
      if (profileError) {
        global.logger.error(`Error getting profile for user ${userID}: ${profileError.message}`);
        throw errorGen(`Error getting profile for user ${userID}: ${profileError.message}`, 400);
      }

      // get ingredient details
      const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientID).single();
      if (ingredientError) {
        global.logger.error(`Error getting ingredient for ingredient ${ingredientID}: ${ingredientError.message}`);
        throw errorGen(`Error getting ingredient for ingredient ${ingredientID}: ${ingredientError.message}`, 400);
      }

      // get all ingredientStocks for the ingredient
      const { data: stocks, error: stocksError } = await db.from('ingredientStocks').select().eq('userID', userID).eq('ingredientID', ingredientID).eq('deleted', false);
      if (stocksError) {
        global.logger.error(`Error getting ingredientStocks for ingredient ${ingredientID} and user ${userID}: ${stocksError.message}`);
        throw errorGen(`Error getting ingredientStocks for ingredient ${ingredientID} and user ${userID}: ${stocksError.message}`, 400);
      }

      // if there are no ingredientStocks, send notification to user if notifyOnNoStock is enabled
      if (stocks.length === 0) {
        // add app message 'ingredientOutOfStock' for this row
        await db.from('ingredients').update({ appMessageStatus: 'notAcked', appMessageDate: new Date() }).eq('ingredientID', ingredientID);

        global.logger.info(`No ingredientStocks found for ingredient ${ingredientID} and user ${userID}`);
        if (profile.notifyOnNoStock !== 'App Push Only' && profile.notifyOnNoStock !== 'Email and App Push') {
          return;
        }
        const { data: tokens, error: getTokensError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/${userID}`, {
          headers: {
            authorization,
          },
        });
        if (getTokensError) {
          global.logger.error(`Error getting push tokens for user ${userID}: ${getTokensError.message}`);
          throw errorGen(`Error getting push tokens for user ${userID}: ${getTokensError.message}`, 400);
        }

        const { error: sendNotificationError } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/notification`,
          {
            userID,
            type: 'noStock',
            data: { name: ingredient.name },
            destTokens: tokens,
          },
          {
            headers: {
              authorization,
            },
          },
        );

        if (sendNotificationError) {
          global.logger.error(`Error sending push notifications for user ${userID}: ${sendNotificationError.message}`);
          throw errorGen(`Error sending push notifications for user ${userID}: ${sendNotificationError.message}`, 400);
        }
      } else {
        // get all recipeIngredients for the ingredient
        const { data: recipeIngredients, error: recipeIngredientsError } = await db.from('recipeIngredients').select().eq('ingredientID', ingredientID);
        if (recipeIngredientsError) {
          global.logger.error(`Error getting recipeIngredients for ingredient ${ingredientID}: ${recipeIngredientsError.message}`);
          throw errorGen(`Error getting recipeIngredients for ingredient ${ingredientID}: ${recipeIngredientsError.message}`, 400);
        }

        // if no recipeIngredients, return
        if (recipeIngredients.length === 0) {
          global.logger.info(`No recipeIngredients found for ingredient ${ingredientID}`);
          return;
        }

        let recipeCountInsufficient = 0;
        // for each recipeIngredient, check if the ingredientStocks are sufficient
        for (const ri of recipeIngredients) {
          const check = await supplyCheckRecipeIngredient(userID, authorization, ingredientID, ri.recipeID);
          global.logger.info(`Result of supplyCheckRecipeIngredient for ingredient ${ingredientID} and user ${userID}: ${JSON.stringify(check)}`);
          if (check.status === 'insufficient') {
            recipeCountInsufficient++;
          }
        }

        // if recipeCountInsufficient > 0, send notification to user if notifyOnLowStock is enabled
        if (recipeCountInsufficient > 0) {
          if (profile.notifyOnLowStock !== 'App Push Only' && profile.notifyOnLowStock !== 'Email and App Push') {
            return;
          }
          global.logger.info(`Low stock found for ${recipeCountInsufficient} recipes`);
          const { data: tokens, error: getTokensError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/${userID}`, {
            headers: {
              authorization,
            },
          });
          if (getTokensError) {
            global.logger.error(`Error getting push tokens for user ${userID}: ${getTokensError.message}`);
            throw errorGen(`Error getting push tokens for user ${userID}: ${getTokensError.message}`, 400);
          }

          const { error: sendNotificationError } = await axios.post(
            `${process.env.NODE_HOST}:${process.env.PORT}/pushTokens/notification`,
            {
              userID,
              type: 'lowStock',
              data: { name: ingredient.name, count: recipeCountInsufficient },
              destTokens: tokens,
            },
            {
              headers: {
                authorization,
              },
            },
          );
          if (sendNotificationError) {
            global.logger.error(`Error sending push notifications for user ${userID}: ${sendNotificationError.message}`);
            throw errorGen(`Error sending push notifications for user ${userID}: ${sendNotificationError.message}`, 400);
          }
        }
      }
    } catch (error) {
      global.logger.error(`Error checking for low stock for ingredient ${ingredientID} and user ${userID}: ${error.message}`);
      throw errorGen(`Error checking for low stock for ingredient ${ingredientID} and user ${userID}: ${error.message}`, 400);
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
