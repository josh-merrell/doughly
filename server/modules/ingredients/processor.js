('use strict');

const { default: axios } = require('axios');
const { createKitchenLog, createRecipeLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { errorGen } = require('../../middleware/errorHandling');

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
      global.logger.error(`Error getting ingredients: ${error.message}`);
      throw errorGen('Error getting ingredients', 400);
    }
    global.logger.info(`Got ${ingredients.length} ingredients`);
    return ingredients;
  }

  async function getIngredientByID(options) {
    const { ingredientID } = options;
    const { data: ingredient, error } = await db.from('ingredients').select().eq('ingredientID', ingredientID).eq('deleted', false);

    if (error) {
      global.logger.error(`Error getting ingredient ID: ${ingredientID}: ${error.message}`);
      throw errorGen(`Error getting ingredient ID: ${ingredientID}`, 400);
    }
    global.logger.info(`Got ingredient`);
    return ingredient;
  }

  async function create(options) {
    const { customID, authorization, userID, name, lifespanDays, brand, purchaseUnit, gramRatio, needsReview=false } = options;

    //verify that 'customID' exists on the request
    if (!customID) {
      global.logger.error(`customID is missing. Ingredient name: ${name}`);
      throw errorGen(`customID is missing`, 400);
    }

    //verify that the provided lifespanDays is a positive integer, return error if not
    if (!lifespanDays || lifespanDays < 0) {
      global.logger.error(`positive LifespanDays integer is required. Ingredient name: ${name}`);
      throw errorGen(`positive LifespanDays integer is required`, 400);
    }

    //verify that the provided name is unique, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('name', 'eq', name).filter('deleted', 'eq', false);
    if (error) {
      global.logger.error(`Error validating provided ingredient name: ${error.message}`);
      throw errorGen(`Error validating provided ingredient name`, 400);
    }
    if (existingIngredient.length > 0) {
      global.logger.error(`Ingredient name ${existingIngredient[0].name} already exists, cannot create ingredient`);
      throw errorGen(`Ingredient name already exists, cannot create ingredient`, 400);
    }

    //verify that gramRatio is a positive number
    if (!gramRatio || gramRatio <= 0) {
      global.logger.error(`positive gramRatio number is required. Ingredient name: ${name}`);
      throw errorGen(`positive gramRatio number is required`, 400);
    }

    //create the ingredient
    const { data: ingredient, error: createError } = await db.from('ingredients').insert({ ingredientID: customID, userID, name, lifespanDays, brand, purchaseUnit, gramRatio, needsReview }).select().single();
    if (createError) {
      global.logger.error(`Error creating ingredient: ${createError.message}`);
      throw errorGen(`Error creating ingredient`, 400);
    }

    //add a 'created' log entry
    createKitchenLog(userID, authorization, 'createIngredient', ingredient.ingredientID, null, null, null, `created ingredient: ${ingredient.name}`);

    return {
      ingredientID: ingredient.ingredientID,
      name: ingredient.name,
      lifespanDays: ingredient.lifespanDays,
      brand: ingredient.brand,
      purchaseUnit: ingredient.purchaseUnit,
      gramRatio: ingredient.gramRatio,
      needsReview: ingredient.needsReview,
    };
  }

  async function update(options) {
    const { userID, authorization, ingredientID, name, lifespanDays, gramRatio } = options;
    //verify that the provided ingredientID exists, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID);
    if (error) {
      global.logger.error(`Error validating provided ingredientID: ${error.message}`);
      throw errorGen(`Error validating provided ingredientID`, 400);
    }
    if (existingIngredient.length === 0) {
      global.logger.error(`Ingredient ID does not exist, cannot update ingredient`);
      throw errorGen(`Ingredient ID does not exist, cannot update ingredient`, 400);
    }

    //verify that the provided lifespanDays is a positive integer, return error if not
    if (lifespanDays && lifespanDays < 0) {
      global.logger.error(`positive LifespanDays integer is required`);
      throw errorGen(`positive LifespanDays integer is required`, 400);
    }

    //verify that the provided name is unique, return error if not
    const { data: existingIngredientName, error: nameError } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('name', 'eq', name);
    if (nameError) {
      global.logger.error(`Error validating provided ingredient name: ${nameError.message}`);
      throw errorGen(`Error validating provided ingredient name`, 400);
    }
    if (existingIngredientName.length > 0) {
      global.logger.error(`Ingredient name already exists, cannot update ingredient`);
      throw errorGen(`Ingredient name already exists, cannot update ingredient`, 400);
    }

    //verify that gramRatio is a positive number if provided
    if (gramRatio && gramRatio <= 0) {
      global.logger.error(`positive gramRatio number is required, cannot update ingredient`);
      throw errorGen(`positive gramRatio number is required, cannot update ingredient`, 400);
    }

    //update the ingredient
    const updateFields = {};
    for (let key in options) {
      if (key !== 'ingredientID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }

    // always set needsReview to false when updating
    updateFields['needsReview'] = false;

    try {
      const updatedIngredient = await updater(userID, authorization, 'ingredientID', ingredientID, 'ingredients', updateFields);
      return {
        ingredientID: updatedIngredient.ingredientID,
        name: updatedIngredient.name,
        lifespanDays: updatedIngredient.lifespanDays,
        brand: updatedIngredient.brand,
        purchaseUnit: updatedIngredient.purchaseUnit,
        gramRatio: updatedIngredient.gramRatio,
        needsReview: updatedIngredient.needsReview,
      };
    } catch (error) {
      global.logger.error(`Error updating ingredient: ${error.message}`);
      throw errorGen(`Error updating ingredient`, 400);
    }
  }

  async function deleteIngredient(options) {
    const { userID, authorization, ingredientID } = options;
    //verify that the provided ingredientID exists, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().eq('ingredientID', ingredientID).eq('deleted', false);
    if (error) {
      global.logger.error(`Error validating provided ingredientID: ${error.message}`);
      throw errorGen(`Error validating provided ingredientID`, 400);
    }
    if (existingIngredient.length === 0) {
      global.logger.error(`Ingredient ID does not exist, cannot delete ingredient`);
      throw errorGen(`Ingredient ID does not exist, cannot delete ingredient`, 400);
    }

    //get list of related stock entries
    try {
      const { data: relatedStockEntries, error: stockError } = await db.from('ingredientStocks').select().eq('ingredientID', ingredientID).eq('deleted', false);
      if (stockError) {
        global.logger.error(`Error getting related stock entries prior to deleting ingredient ID: ${ingredientID} : ${stockError.message}`);
        throw errorGen(`Error getting related stock entries prior to deleting ingredient ID: ${ingredientID}`, 400);
      }

      //delete any associated ingredient stock entries;
      for (let i = 0; i < relatedStockEntries.length; i++) {
        const { data: ingredientStockDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks/${relatedStockEntries[i].ingredientStockID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (ingredientStockDeleteResult.error) {
          global.logger.error(`Error deleting ingredientStockID: ${relatedStockEntries[i].ingredientStockID} prior to deleting ingredient ID: ${ingredientID} : ${ingredientStockDeleteResult.error}`);
          throw errorGen(`Error deleting ingredientStockID: ${relatedStockEntries[i].ingredientStockID} prior to deleting ingredient ID: ${ingredientID}`, 400);
        }

        //add a 'deleted' log entry
        createKitchenLog(userID, authorization, 'deleteIngredient', Number(relatedStockEntries[i].ingredientStockID), ingredientID, null, null, `Ingredient stock deleted: ${relatedStockEntries[i].name}`);
      }
    } catch (error) {
      global.logger.error(`Error deleting related stock entries: ${error.message}`);
      throw errorGen(`Error deleting related stock entries`, 400);
    }

    //get list of related recipeIngredients
    try {
      const { data: recipeIngredients, error: recipeError } = await db.from('recipeIngredients').select().eq('ingredientID', ingredientID).eq('deleted', false);
      if (recipeError) {
        global.logger.error(`Error getting related recipeIngredients prior to deleting ingredient ID: ${ingredientID} : ${recipeError.message}`);
        throw errorGen(`Error getting related recipeIngredients prior to deleting ingredient ID: ${ingredientID}`, 400);
      }

      //delete any associated recipeIngredients;
      for (let i = 0; i < recipeIngredients.length; i++) {
        const { data: recipeIngredientDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredients/recipe/${recipeIngredients[i].recipeIngredientID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeIngredientDeleteResult.error) {
          global.logger.error(`Error deleting recipeIngredientID: ${recipeIngredients[i].recipeIngredientID} prior to deleting ingredient ID: ${ingredientID} : ${recipeIngredientDeleteResult.error}`);
          throw errorGen(`Error deleting recipeIngredientID: ${recipeIngredients[i].recipeIngredientID} prior to deleting ingredient ID: ${ingredientID}`, 400);
        }

        //add a 'deleted' log entry
        createRecipeLog(userID, authorization, 'recipeIngredientDeleted', Number(recipeIngredients[i].recipeIngredientID), Number(recipeIngredients[i].recipeID), null, null, `Recipe ingredient deleted: ${recipeIngredients[i].recipeIngredientID}`);
      }
    } catch (error) {
      global.logger.error(`Error deleting related recipeIngredients: ${error.message}`);
      throw errorGen(`Error deleting related recipeIngredients`, 400);
    }

    //delete the ingredient;
    const { error: deleteError } = await db.from('ingredients').update({ deleted: true }).eq('ingredientID', ingredientID).single();
    if (deleteError) {
      global.logger.error(`Error deleting ingredient: ${deleteError.message}`);
      throw errorGen(`Error deleting ingredient`, 400);
    }

    //add a 'deleted' log entry
    createKitchenLog(userID, authorization, 'ingredientDeleted', Number(ingredientID), null, null, null, `Ingredient deleted: ${ingredientID}`);

    global.logger.info(`Deleted ingredient ID: ${ingredientID}`);
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
