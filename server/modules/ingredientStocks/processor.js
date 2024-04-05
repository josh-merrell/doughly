('use strict');

const { createKitchenLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { errorGen } = require('../../middleware/errorHandling');

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
    const { userID, ingredientStockID, authorization = 'override' } = options;

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
    return { success: true };
  }

  async function deleteAllExpired() {
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
        promises.push(deleteExpiredStockForUser(userID));
      }

      // use Promise.allSettled to ensure all promises are resolved before returning
      await Promise.allSettled(promises);

      return { success: true };
    } catch (error) {
      global.logger.error(`Error deleting all expired ingredientStocks: ${error.message}`);
      throw errorGen(`Error deleting all expired ingredientStocks: ${error.message}`, 400);
    }
  }

  async function deleteExpiredStockForUser(userID) {
    try {
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
      // get all non-deleted ingredientStocks for the user
      const { data: stocks, error: expiredStocksError } = await db.from('ingredientStocks').select().eq('userID', userID).eq('deleted', false);
      if (expiredStocksError) {
        global.logger.error(`Error getting expired ingredientStocks for user ${userID}: ${expiredStocksError.message}`);
        throw errorGen(`Error getting expired ingredientStocks for user ${userID}: ${expiredStocksError.message}`, 400);
      }
      const deletePromises = [];
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
          deletePromises.push(deleteIngredientStock({ userID, ingredientStockID }));
        }
      }

      // use Promise.allSettled to ensure all promises are resolved before returning
      await Promise.allSettled(deletePromises);

      return { success: true };
    } catch (error) {
      global.logger.error(`Error deleting expired ingredientStocks for user ${userID}: ${error.message}`);
      throw errorGen(`Error deleting expired ingredientStocks for user ${userID}: ${error.message}`, 400);
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
  };
};
