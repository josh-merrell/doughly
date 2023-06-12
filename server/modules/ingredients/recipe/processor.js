('use strict');

const { updater } = require('../../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeIngredientIDs, recipeID, ingredientID } = options;

    let q = db.from('recipeIngredients').select().filter('userID', 'eq', userID).order('recipeIngredientID', { ascending: true });
    if (recipeIngredientIDs) {
      q = q.in('recipeIngredientID', recipeIngredientIDs);
    }
    if (recipeID) {
      q = q.filter('recipeID', 'eq', recipeID);
    }
    if (ingredientID) {
      q = q.filter('ingredientID', 'eq', ingredientID);
    }
    const { data: recipeIngredients, error } = await q;

    if (error) {
      global.logger.info(`Error getting recipeIngredients: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipeIngredients.length} recipeIngredients`);
    return recipeIngredients;
  }

  async function getRecipeIngredientByID(options) {
    const { recipeIngredientID } = options;
    const { data: recipeIngredient, error } = await db.from('recipeIngredients').select().eq('recipeIngredientID', recipeIngredientID);

    if (error) {
      global.logger.info(`Error getting recipeIngredient ID: ${recipeIngredientID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipeIngredient`);
    return recipeIngredient;
  }

  async function create(options) {
    const { userID, recipeID, ingredientID, measurementUnit, measurement } = options;

    //verify that the provided recipeID exists, return error if not
    const { data: existingRecipe, error } = await db.from('recipes').select().filter('userID', 'eq', userID).filter('recipeID', 'eq', recipeID);
    if (error) {
      global.logger.info(`Error validating provided recipeID: ${error.message}`);
      return { error: error.message };
    }
    if (existingRecipe.length === 0) {
      global.logger.info(`RecipeID does not exist, cannot create recipeIngredient`);
      return { error: `RecipeID does not exist, cannot create recipeIngredient` };
    }

    //verify that the provided ingredientID exists, return error if not
    const { data: existingIngredient, error2 } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID);
    if (error2) {
      global.logger.info(`Error validating provided ingredientID: ${error2.message}`);
      return { error: error2.message };
    }
    if (existingIngredient.length === 0) {
      global.logger.info(`IngredientID does not exist, cannot create recipeIngredient`);
      return { error: `IngredientID does not exist, cannot create recipeIngredient` };
    }

    //verify that the provided measurement is a positive number, return error if not
    if (!measurement || measurement <= 0) {
      global.logger.info(`positive measurement number is required`);
      return { error: `positive measurement number is required` };
    }

    //create the recipeIngredient
    const { data: recipeIngredient, error3 } = await db.from('recipeIngredients').insert({ userID, recipeID, ingredientID, measurementUnit, measurement }).select('recipeIngredientID').single();

    if (error3) {
      global.logger.info(`Error creating recipeIngredient: ${error3.message}`);
      return { error: error3.message };
    }
    global.logger.info(`Created recipeIngredient ID: ${recipeIngredient.recipeIngredientID}`);
    return recipeIngredient;
  }

  async function update(options) {
    const { userID, recipeIngredientID, measurement } = options;

    //verify that the provided recipeIngredientID exists, return error if not
    const { data: existingRecipeIngredient, error } = await db.from('recipeIngredients').select().filter('userID', 'eq', userID).filter('recipeIngredientID', 'eq', recipeIngredientID);
    if (error) {
      global.logger.info(`Error validating provided recipeIngredientID: ${error.message}`);
      return { error: error.message };
    }
    if (existingRecipeIngredient.length === 0) {
      global.logger.info(`RecipeIngredientID does not exist, cannot update recipeIngredient`);
      return { error: `RecipeIngredientID does not exist, cannot update recipeIngredient` };
    }

    //if provided, verify that the provided measurement is a positive number, return error if not
    if (measurement && measurement <= 0) {
      global.logger.info(`positive measurement number is required`);
      return { error: `positive measurement number is required` };
    }

    //update the recipeIngredient
    const updateFields = {};

    for (let key in options) {
      if (key !== 'recipeIngredientID' && options[key]) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipeIngredient = await updater('recipeIngredientID', recipeIngredientID, 'recipeIngredients', updateFields);
      global.logger.info(`Updated recipeIngredient ID: ${recipeIngredientID}`);
      return updatedRecipeIngredient;
    } catch (error) {
      global.logger.info(`Error updating recipeIngredient ID: ${recipeIngredientID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteRecipeIngredient(options) {
    const { recipeIngredientID } = options;

    //verify that the provided recipeIngredientID exists, return error if not
    const { data: existingRecipeIngredient, error } = await db.from('recipeIngredients').select().eq('recipeIngredientID', recipeIngredientID);
    if (error) {
      global.logger.info(`Error validating provided recipeIngredientID: ${error.message}`);
      return { error: error.message };
    }
    if (existingRecipeIngredient.length === 0) {
      global.logger.info(`RecipeIngredientID does not exist, cannot delete recipeIngredient`);
      return { error: `RecipeIngredientID does not exist, cannot delete recipeIngredient` };
    }

    //delete the recipeIngredient
    const { error2 } = await db.from('recipeIngredients').delete().eq('recipeIngredientID', recipeIngredientID);

    if (error2) {
      global.logger.info(`Error deleting recipeIngredient ID: ${recipeIngredientID}: ${error2.message}`);
      return { error: error2.message };
    }
    global.logger.info(`Deleted recipeIngredient ID: ${recipeIngredientID}`);
    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getRecipeIngredientByID,
    },
    create,
    update,
    delete: deleteRecipeIngredient,
  };
};
