('use strict');

const { default: axios } = require('axios');
const { createKitchenLog, createRecipeLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db, dbPublic }) => {
  async function getAll(options) {
    const { userID, ingredientIDs, name } = options;

    try {
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
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in ingredients getAll', err.code || 520, err.name || 'unhandledError_ingredients-getAll', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity

    }
  }

  async function getIngredientByID(options) {
    const { ingredientID } = options;

    try {
      const { data: ingredient, error } = await db.from('ingredients').select().eq('ingredientID', ingredientID).eq('deleted', false);

      if (error) {
        global.logger.error(`Error getting ingredient ID: ${ingredientID}: ${error.message}`);
        throw errorGen(`Error getting ingredient ID: ${ingredientID}`, 400);
      }
      global.logger.info(`Got ingredient`);
      return ingredient;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in ingredients getIngredientByID', err.code || 520, err.name || 'unhandledError_ingredients-getIngredientByID', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function create(options) {
    const { customID, authorization, userID, name, lifespanDays, brand, purchaseUnit, gramRatio, needsReview = false } = options;

    try {
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
        global.logger.error(`positive gramRatio number is required. Ingredient name: ${name}, received gramRatio: ${gramRatio}`);
        throw errorGen(`positive gramRatio number is required`, 400);
      }

      //create the ingredient
      const { data: ingredient, error: createError } = await db.from('ingredients').insert({ ingredientID: customID, userID, name, lifespanDays, brand, purchaseUnit, gramRatio, needsReview }).select().single();
      if (createError) {
        global.logger.error(`Error creating ingredient: ${createError.message}`);
        throw errorGen(`Error creating ingredient`, 400);
      }

      //add a 'created' log entry
      createKitchenLog(userID, authorization, 'createIngredient', ingredient.ingredientID, null, null, null, `Created Ingredient: ${ingredient.name}`);

      return {
        ingredientID: ingredient.ingredientID,
        name: ingredient.name,
        lifespanDays: ingredient.lifespanDays,
        brand: ingredient.brand,
        purchaseUnit: ingredient.purchaseUnit,
        gramRatio: ingredient.gramRatio,
        needsReview: ingredient.needsReview,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in ingredients create', err.code || 520, err.name || 'unhandledError_ingredients-create', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function update(options) {
    const { userID, authorization, ingredientID, name, lifespanDays, gramRatio } = options;

    try {
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
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in ingredients update', err.code || 520, err.name || 'unhandledError_ingredients-update', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function deleteIngredient(options) {
    const { userID, authorization, ingredientID } = options;

    try {
      // attempt to delete the ingredient
      const id = Number(ingredientID);
      const { data, error } = await dbPublic.rpc('ingredient_delete', { ingredient: id });
      global.logger.info(`ingredient_delete result: ${JSON.stringify(data)}`);
      if (error) {
        global.logger.error(`Error deleting ingredient: ${error.message}`);
        throw errorGen(`Error deleting ingredient`, 400);
      }
      if (data === 'NONE') {
        global.logger.error(`Ingredient ID does not exist, cannot delete ingredient`);
        throw errorGen(`Ingredient ID does not exist, cannot delete ingredient`, 400);
      } else if (!data) {
        global.logger.error(`Error deleting ingredient`);
        throw errorGen(`Error deleting ingredient`, 400);
      }

      //add a 'deleted' log entry
      createKitchenLog(userID, authorization, 'ingredientDeleted', Number(ingredientID), null, null, null, `Deleted ${data} from kitchen`);

      global.logger.info(`Deleted ingredient ID: ${ingredientID}`);
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in ingredients deleteIngredient', err.code || 520, err.name || 'unhandledError_ingredients-deleteIngredient', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
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
