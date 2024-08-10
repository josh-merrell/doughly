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
        throw errorGen(`Error getting ingredients: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*ingredients-getAll* Got ${ingredients.length} ingredients`, level: 5, timestamp: new Date().toISOString(), userID: userID });
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
        throw errorGen(`Error getting ingredient ID: ${ingredientID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*ingredients-getIngredientByID* Got ingredient`, level: 5, timestamp: new Date().toISOString(), userID: ingredient[0].userID || 0 });
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
        throw errorGen(`customID is missing. Ingredient name: ${name}`, 510, 'dataValidationErr', false, 3);
      }

      //verify that the provided lifespanDays is a positive integer, return error if not
      if (!lifespanDays || lifespanDays < 0) {
        throw errorGen(`positive LifespanDays integer is required. Ingredient name: ${name}`, 510, 'dataValidationErr', false, 3);
      }

      //verify that the provided name is unique, return error if not
      const { data: existingIngredient, error } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('name', 'eq', name).filter('deleted', 'eq', false);
      if (error) {
        throw errorGen(`Error validating provided ingredient name: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingIngredient.length > 0) {
        throw errorGen(`Ingredient name ${existingIngredient[0].name} already exists, cannot create ingredient`, 515, 'cannotComplete', true, 3);
      }

      //verify that gramRatio is a positive number
      if (!gramRatio || gramRatio <= 0) {
        throw errorGen(`positive gramRatio number is required. Ingredient name: ${name}, received gramRatio: ${gramRatio}`, 510, 'dataValidationErr', false, 3);
      }

      //create the ingredient
      const { data: ingredient, error: createError } = await db.from('ingredients').insert({ ingredientID: customID, userID, name, lifespanDays, brand, purchaseUnit, gramRatio, needsReview }).select().single();
      if (createError) {
        throw errorGen(`Error creating ingredient: ${createError.message}`, 512, 'failSupabaseInsert', true, 3);
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
        throw errorGen(`Error validating provided ingredientID: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingIngredient.length === 0) {
        throw errorGen(`Ingredient ID does not exist, cannot update ingredient`, 515, 'cannotComplete', true, 3);
      }

      //verify that the provided lifespanDays is a positive integer, return error if not
      if (lifespanDays && lifespanDays < 0) {
        throw errorGen(`positive LifespanDays integer is required. Ingredient name: ${name}`, 510, 'dataValidationErr', false, 3);
      }

      //verify that the provided name is unique, return error if not
      const { data: existingIngredientName, error: nameError } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('name', 'eq', name);
      if (nameError) {
        throw errorGen(`Error validating provided ingredient name: ${nameError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingIngredientName.length > 0) {
        throw errorGen(`Ingredient name already exists, cannot update ingredient`, 515, 'cannotComplete', true, 3);
      }

      //verify that gramRatio is a positive number if provided
      if (gramRatio && gramRatio <= 0) {
        throw errorGen(`positive gramRatio number is required. Ingredient name: ${name}, received gramRatio: ${gramRatio}`, 510, 'dataValidationErr', false, 3);
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
      if (error) {
        throw errorGen(`Error deleting ingredient: ${error.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      if (data === 'NONE') {
        throw errorGen(`Ingredient ID does not exist, cannot delete ingredient`, 515, 'cannotComplete', true, 3);
      } else if (!data) {
        throw errorGen(`Error deleting ingredient`, 514, 'failSupabaseDelete', true, 3);
      }

      //add a 'deleted' log entry
      createKitchenLog(userID, authorization, 'ingredientDeleted', Number(ingredientID), null, null, null, `Deleted ${data} from kitchen`);

      global.logger.info({ message: `*ingredients-deleteIngredient* Deleted ingredient ID: ${ingredientID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || '*ingredients-deleteIngredient* Unhandled Error', err.code || 520, err.name || 'unhandledError_ingredients-deleteIngredient', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
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
