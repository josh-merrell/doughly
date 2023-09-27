('use strict');

const { updater } = require('../../db');

module.exports = ({ db }) => {
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
      global.logger.info(`Error getting ingredientStocks: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${ingredientStocks.length} ingredientStocks`);
    return ingredientStocks;
  }

  async function getIngredientStockByID(options) {
    const { ingredientStockID } = options;
    const { data: ingredientStock, error } = await db.from('ingredientStocks').select().eq('ingredientStockID', ingredientStockID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting ingredientStock ID: ${ingredientStockID}: ${error.message}`);
      return { error: error.message };
    }
    return ingredientStock[0];
  }

  async function create(options) {
    const { customID, userID, ingredientID, measurement, purchasedDate } = options;

    //verify that the provided ingredientID is valid, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID);
    if (error) {
      global.logger.info(`Error validating provided ingredientID: ${error.message}`);
      return { error: error.message };
    }
    if (existingIngredient.length === 0) {
      global.logger.info(`Ingredient ID does not exist, cannot create ingredientStock`);
      return { error: `Ingredient ID does not exist, cannot create ingredientStock` };
    }

    //verify that provided measurement is positive integer, return error if not
    if (!measurement || measurement < 1) {
      global.logger.info(`positive measurement integer is required`);
      return { error: `positive measurement integer is required` };
    }

    //calculate grams for new stock using gramRatio for the ingredient
    const grams = measurement * existingIngredient[0].gramRatio;

    //create the ingredientStock
    const { data: newIngredientStock, error: newIngredientStockError } = await db.from('ingredientStocks').insert({ ingredientStockID: customID, userID, ingredientID, purchasedDate, grams }).select().single();
    if (newIngredientStockError) {
      global.logger.info(`Error creating ingredientStock: ${newIngredientStockError.message}`);
      return { error: newIngredientStockError.message };
    }
    global.logger.info(`Created ingredientStock ID: ${newIngredientStock.ingredientStockID}`);
    return {
      ingredientStockID: newIngredientStock.ingredientStockID,
      ingredientID: newIngredientStock.ingredientID,
      grams: newIngredientStock.grams,
      purchasedDate: newIngredientStock.purchasedDate,
    };
  }

  async function update(options) {
    const { userID, ingredientStockID, measurement } = options;

    //verify that the provided ingredientStockID is valid, return error if not
    const { data: existingIngredientStock, error } = await db.from('ingredientStocks').select().filter('userID', 'eq', userID).filter('ingredientStockID', 'eq', ingredientStockID);
    if (error) {
      global.logger.info(`Error validating provided ingredientStockID: ${error.message}`);
      return { error: error.message };
    }
    if (existingIngredientStock.length === 0) {
      global.logger.info(`IngredientStock ID does not exist, cannot update ingredientStock`);
      return { error: `IngredientStock ID does not exist, cannot update ingredientStock` };
    }

    //verify that provided measurement is positive integer, return error if not
    if (measurement && measurement < 1) {
      global.logger.info(`positive measurement integer is required`);
      return { error: `positive measurement integer is required` };
    }

    //update the ingredientStock
    const updateFields = {};
    for (let key in options) {
      if (key !== 'ingredientStockID' && key !== 'measurement' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }
    //calculate grams for new stock using gramRatio for the ingredient
    if (measurement) {
      const { data: ingredient, error: ingredientError } = await db.from('ingredients').select('gramRatio').filter('userID', 'eq', userID).filter('ingredientID', 'eq', existingIngredientStock[0].ingredientID);
      if (ingredientError) {
        global.logger.info(`Error getting ingredient: ${ingredientError.message}`);
        return { error: ingredientError.message };
      }
      if (ingredient.length === 0) {
        global.logger.info(`Ingredient ID does not exist, cannot update ingredientStock`);
        return { error: `Ingredient ID does not exist, cannot update ingredientStock` };
      }
      const grams = measurement * ingredient[0].gramRatio;
      updateFields.grams = grams;
    }

    try {
      const updatedIngredientStock = await updater('ingredientStockID', ingredientStockID, 'ingredientStocks', updateFields);
      global.logger.info(`Updated ingredientStock ID: ${updatedIngredientStock.ingredientStockID}`);
      return updatedIngredientStock;
    } catch (error) {
      global.logger.info(`Error updating ingredientStock: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteIngredientStock(options) {
    const { ingredientStockID } = options;

    //verify that the provided ingredientStockID is valid, return error if not
    const { data: existingIngredientStock, error } = await db.from('ingredientStocks').select().eq('ingredientStockID', ingredientStockID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error validating provided ingredientStockID: ${error.message}`);
      return { error: error.message };
    }
    if (existingIngredientStock.length === 0) {
      global.logger.info(`IngredientStock ID does not exist, cannot delete ingredientStock`);
      return { error: `IngredientStock ID does not exist, cannot delete ingredientStock` };
    }

    //delete the ingredientStock
    const { error: deleteError } = await db.from('ingredientStocks').update({ deleted: true }).eq('ingredientStockID', ingredientStockID);
    if (deleteError) {
      global.logger.info(`Error deleting ingredientStock: ${deleteError.message}`);
      return { error: deleteError.message };
    }
    global.logger.info(`Deleted ingredientStock ID: ${ingredientStockID}`);
    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getIngredientStockByID,
    },
    create,
    update,
    delete: deleteIngredientStock,
  };
};
