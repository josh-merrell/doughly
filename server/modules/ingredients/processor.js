('use strict');

const { default: axios } = require('axios');
const { createKitchenLog, createRecipeLog } = require('../../services/dbLogger');
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
    global.logger.info(`INGREDIENTS: ${JSON.stringify(ingredients)}`);
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
    const { customID, authorization, userID, name, lifespanDays, brand, purchaseUnit, gramRatio } = options;

    //verify that 'customID' exists on the request
    if (!customID) {
      global.logger.info(`Error creating ingredient: customID is missing`);
      return { error: 'customID is missing' };
    }

    //verify that the provided lifespanDays is a positive integer, return error if not
    if (!lifespanDays || lifespanDays < 0) {
      global.logger.info(`positive LifespanDays integer is required`);
      return { error: `positive LifespanDays integer is required` };
    }

    //verify that the provided name is unique, return error if not
    const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('name', 'eq', name).filter('deleted', 'eq', false);
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
    const { data: ingredient, error: createError } = await db.from('ingredients').insert({ ingredientID: customID, userID, name, lifespanDays, brand, purchaseUnit, gramRatio }).select().single();
    if (createError) {
      global.logger.info(`Error creating ingredient: ${createError.message}`);
      return { error: createError.message };
    }
    global.logger.info(`Created ingredient ID: ${ingredient.ingredientID}`);

    //add a 'created' log entry
    createKitchenLog(userID, authorization, 'ingredientCreated', ingredient.ingredientID, null, null, null, `Ingredient created: ${ingredient.name}`);

    return {
      ingredientID: ingredient.ingredientID,
      name: ingredient.name,
      lifespanDays: ingredient.lifespanDays,
      brand: ingredient.brand,
      purchaseUnit: ingredient.purchaseUnit,
      gramRatio: ingredient.gramRatio,
    };
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
      if (key !== 'ingredientID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      console.log(`FIELDS TO UPDATE: ${JSON.stringify(updateFields)}`);
      const updatedIngredient = await updater('ingredientID', ingredientID, 'ingredients', updateFields);
      global.logger.info(`Updated ingredient ID: ${ingredientID}`);
      return {
        ingredientID: updatedIngredient.ingredientID,
        name: updatedIngredient.name,
        lifespanDays: updatedIngredient.lifespanDays,
        brand: updatedIngredient.brand,
        purchaseUnit: updatedIngredient.purchaseUnit,
        gramRatio: updatedIngredient.gramRatio,
      };
    } catch (error) {
      global.logger.info(`Error updating ingredient: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteIngredient(options) {
    const { userID, authorization, ingredientID } = options;
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

    //get list of related stock entries
    try {
      const { data: relatedStockEntries, error: stockError } = await db.from('ingredientStocks').select().eq('ingredientID', ingredientID).eq('deleted', false);
      if (stockError) {
        global.logger.info(`Error getting related stock entries prior to deleting ingredient ID: ${ingredientID} : ${stockError.message}`);
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
          global.logger.info(`Error deleting ingredientStockID: ${relatedStockEntries[i].ingredientStockID} prior to deleting ingredient ID: ${ingredientID} : ${ingredientStockDeleteResult.error}`);
          return { error: ingredientStockDeleteResult.error };
        }

        //add a 'deleted' log entry
        createKitchenLog(userID, authorization, 'ingredientStockDeleted', Number(relatedStockEntries[i].ingredientStockID), ingredientID, null, null, `Ingredient stock deleted: ${relatedStockEntries[i].ingredientStockID}`);
      }
    } catch (error) {
      global.logger.info(`Error deleting related stock entries: ${error.message}`);
      return { error: error.message };
    }

    //get list of related recipeIngredients
    try {
      const { data: recipeIngredients, error: recipeError } = await db.from('recipeIngredients').select().eq('ingredientID', ingredientID).eq('deleted', false);
      if (recipeError) {
        global.logger.info(`Error getting related recipeIngredients prior to deleting ingredient ID: ${ingredientID} : ${recipeError.message}`);
        return { error: recipeError.message };
      }

      //delete any associated recipeIngredients;
      for (let i = 0; i < recipeIngredients.length; i++) {
        const { data: recipeIngredientDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredients/recipe/${recipeIngredients[i].recipeIngredientID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeIngredientDeleteResult.error) {
          global.logger.info(`Error deleting recipeIngredientID: ${recipeIngredients[i].recipeIngredientID} prior to deleting ingredient ID: ${ingredientID} : ${recipeIngredientDeleteResult.error}`);
          return { error: recipeIngredientDeleteResult.error };
        }

        //add a 'deleted' log entry
        createRecipeLog(userID, authorization, 'recipeIngredientDeleted', Number(recipeIngredients[i].recipeIngredientID), Number(recipeIngredients[i].recipeID), null, null, `Recipe ingredient deleted: ${recipeIngredients[i].recipeIngredientID}`);
      }
    } catch (error) {
      global.logger.info(`Error deleting related recipeIngredients: ${error.message}`);
      return { error: error.message };
    }

    //delete the ingredient;
    const { error: deleteError } = await db.from('ingredients').update({ deleted: true }).eq('ingredientID', ingredientID).single();
    if (deleteError) {
      global.logger.info(`Error deleting ingredient: ${deleteError.message}`);
      return { error: deleteError.message };
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
