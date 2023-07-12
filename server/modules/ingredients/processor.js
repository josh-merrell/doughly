('use strict');

const { default: axios } = require('axios');
const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, ingredientIDs, name } = options;

    let q = db.from('ingredients').select().filter('userID', 'eq', userID).eq('deleted', false).order('ingredientID', { ascending: true });
    if (ingredientIDs) {
      q = q.in('ingredientID', ingredientIDs);
    }
    if (name) {
      q = q.like('name', name);
    }
    const { data: ingredients, error } = await q;

    if (error) {
      global.logger.info(`Error getting ingredients: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${ingredients.length} ingredients`);
    return ingredients;
  }

  async function getIngredientByID(options) {
    const { ingredientID } = options;
    const { data: ingredient, error } = await db.from('ingredients').select().eq('ingredientID', ingredientID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting ingredient ID: ${ingredientID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ingredient`);
    return ingredient;
  }

  async function create(options) {
    const { userID, name, lifespanDays, brand, purchaseUnit, gramRatio } = options;

    //verify that the provided lifespanDays is a positive integer, return error if not
    if (!lifespanDays || lifespanDays < 0) {
      global.logger.info(`positive LifespanDays integer is required`);
      return { error: `positive LifespanDays integer is required` };
    }

    //verify that the provided name is unique, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('name', 'eq', name);
    if (error) {
      global.logger.info(`Error validating provided ingredient name: ${error.message}`);
      return { error: error.message };
    }
    if (existingIngredient.length > 0) {
      global.logger.info(`Ingredient name already exists, cannot create ingredient`);
      return { error: `Ingredient name already exists, cannot cretae ingredient` };
    }

    //verify that gramRatio is a positive number
    if (!gramRatio || gramRatio <= 0) {
      global.logger.info(`positive gramRatio number is required`);
      return { error: `positive gramRatio number is required` };
    }

    //create the ingredient
    const { data: ingredient, error: createError } = await db.from('ingredients').insert({ userID, name, lifespanDays, brand, purchaseUnit, gramRatio }).select('ingredientID').single();
    if (createError) {
      global.logger.info(`Error creating ingredient: ${createError.message}`);
      return { error: createError.message };
    }
    global.logger.info(`Created ingredient ID: ${ingredient.ingredientID}`);
    return ingredient;
  }

  async function update(options) {
    const { userID, ingredientID, name, lifespanDays, gramRatio } = options;
    //verify that the provided ingredientID exists, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID);
    if (error) {
      global.logger.info(`Error validating provided ingredientID: ${error.message}`);
      return { error: error.message };
    }
    if (existingIngredient.length === 0) {
      global.logger.info(`Ingredient ID does not exist, cannot update ingredient`);
      return { error: `Ingredient ID does not exist, cannot update ingredient` };
    }

    //verify that the provided lifespanDays is a positive integer, return error if not
    if (lifespanDays && lifespanDays < 0) {
      global.logger.info(`positive LifespanDays integer is required`);
      return { error: `positive LifespanDays integer is required` };
    }

    //verify that the provided name is unique, return error if not
    const { data: existingIngredientName, error: nameError } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('name', 'eq', name);
    if (nameError) {
      global.logger.info(`Error validating provided ingredient name: ${nameError.message}`);
      return { error: nameError.message };
    }
    if (existingIngredientName.length > 0) {
      global.logger.info(`Ingredient name already exists, cannot update ingredient`);
      return { error: `Ingredient name already exists, cannot update ingredient` };
    }

    //verify that gramRatio is a positive number if provided
    if (gramRatio && gramRatio <= 0) {
      global.logger.info(`positive gramRatio number is required, cannot update ingredient`);
      return { error: `positive gramRatio number is required, cannot update ingredient` };
    }

    //update the ingredient
    const updateFields = {};

    for (let key in options) {
      if (key !== 'ingredientID' && options[key]) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedIngredient = await updater('ingredientID', ingredientID, 'ingredients', updateFields);
      global.logger.info(`Updated ingredient ID: ${ingredientID}`);
      return updatedIngredient;
    } catch (error) {
      global.logger.info(`Error updating ingredient: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteIngredient(options) {
    const { ingredientID } = options;
    //verify that the provided ingredientID exists, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().eq('ingredientID', ingredientID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error validating provided ingredientID: ${error.message}`);
      return { error: error.message };
    }
    if (existingIngredient.length === 0) {
      global.logger.info(`Ingredient ID does not exist, cannot delete ingredient`);
      return { error: `Ingredient ID does not exist, cannot delete ingredient` };
    }

    //delete the ingredient;
    const { error: deleteError } = await db.from('ingredients').update({ deleted: true }).eq('ingredientID', ingredientID).single();
    if (deleteError) {
      global.logger.info(`Error deleting ingredient: ${deleteError.message}`);
      return { error: deleteError.message };
    }
    global.logger.info(`Deleted ingredient ID: ${ingredientID}`);

    //get list of related stock entries
    const { data: relatedStockEntries, error: stockError } = await db.from('ingredientStocks').select().eq('ingredientID', ingredientID).eq('deleted', false);
    if (stockError) {
      global.logger.info(`Error getting related stock entries after deleting ingredient ID: ${ingredientID} : ${stockError.message}`);
      return { error: stockError.message };
    }

    //delete any associated ingredient stock entries;
    for (let i = 0; i < relatedStockEntries.length; i++) {
      const { data: ingredientStockDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks/${relatedStockEntries[i].ingredientStockID}`, {
        headers: {
          authorization: options.authorization,
        },
      });
      if (ingredientStockDeleteResult.error) {
        global.logger.info(`Error deleting ingredientStockID: ${relatedStockEntries[i].ingredientStockID} after deleting ingredient ID: ${ingredientID} : ${ingredientStockDeleteResult.error}`);
        return { error: ingredientStockDeleteResult.error };
      }
    }

    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getIngredientByID,
    },
    create,
    update,
    delete: deleteIngredient,
  };
};
