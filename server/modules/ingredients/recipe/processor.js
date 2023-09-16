('use strict');

const { updater } = require('../../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeIngredientIDs, recipeID, ingredientID } = options;

    let q = db.from('recipeIngredients').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeIngredientID', { ascending: true });
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
    const { data: recipeIngredient, error } = await db.from('recipeIngredients').select().eq('recipeIngredientID', recipeIngredientID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipeIngredient ID: ${recipeIngredientID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipeIngredient`);
    return recipeIngredient;
  }

  async function create(options) {
    const { userID, recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio } = options;

    //verify that the provided recipeID exists, return error if not
    const { data: existingRecipe, error } = await db.from('recipes').select().filter('userID', 'eq', userID).filter('recipeID', 'eq', recipeID).eq('deleted', false);
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

    //verify that the provided purchaseUnitRatio is a positive number, return error if not
    if (purchaseUnitRatio && purchaseUnitRatio <= 0) {
      global.logger.info(`positive purchaseUnitRatio number is required`);
      return { error: `positive purchaseUnitRatio number is required` };
    }

    //create the recipeIngredient
    const { data: recipeIngredient, error3 } = await db.from('recipeIngredients').insert({ userID, recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio }).select().single();

    if (error3) {
      global.logger.info(`Error creating recipeIngredient: ${error3.message}`);
      return { error: error3.message };
    }

    //if status of existingRecipe is 'noIngredients', update status to 'noTools'
    if (existingRecipe[0].status === 'noIngredients') {
      const { error4 } = await db.from('recipes').update({ status: 'noTools' }).eq('recipeID', recipeID);
      if (error4) {
        global.logger.info(`Error updating recipe status: ${error4.message}`);
        //rollback added recipeIngredient
        const { error5 } = await db.from('recipeIngredients').delete().eq('recipeIngredientID', recipeIngredient.recipeIngredientID);
        if (error5) {
          global.logger.info(`Error rolling back recipeIngredient: ${error5.message}`);
          return { error: error5.message };
        }
        return { error: error4.message };
      }
    }

    global.logger.info(`Created recipeIngredient ID: ${recipeIngredient.recipeIngredientID}`);
    return {
      recipeIngredientID: recipeIngredient.recipeIngredientID,
      recipeID: recipeIngredient.recipeID,
      ingredientID: recipeIngredient.ingredientID,
      measurementUnit: recipeIngredient.measurementUnit,
      measurement: recipeIngredient.measurement,
      purchaseUnitRatio: recipeIngredient.purchaseUnitRatio,
    };
  }

  async function update(options) {
    const { userID, recipeIngredientID, measurement, purchaseUnitRatio } = options;

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

    //if provided, verify that the provided purchaseUnitRatio is a positive number, return error if not
    if (purchaseUnitRatio && purchaseUnitRatio <= 0) {
      global.logger.info(`positive purchaseUnitRatio number is required`);
      return { error: `positive purchaseUnitRatio number is required` };
    }

    //update the recipeIngredient
    const updateFields = {};

    for (let key in options) {
      if (key !== 'recipeIngredientID' && options[key] !== undefined) {
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
    const { data: existingRecipeIngredient, error } = await db.from('recipeIngredients').select().eq('recipeIngredientID', recipeIngredientID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error validating provided recipeIngredientID: ${error.message}`);
      return { error: error.message };
    }
    if (existingRecipeIngredient.length === 0) {
      global.logger.info(`RecipeIngredientID does not exist, cannot delete recipeIngredient`);
      return { error: `RecipeIngredientID does not exist, cannot delete recipeIngredient` };
    }

    //delete the recipeIngredient
    const { error2 } = await db.from('recipeIngredients').update({ deleted: true }).eq('recipeIngredientID', recipeIngredientID);

    if (error2) {
      global.logger.info(`Error deleting recipeIngredient ID: ${recipeIngredientID}: ${error2.message}`);
      return { error: error2.message };
    }
    global.logger.info(`Deleted recipeIngredient ID: ${recipeIngredientID}`);

    //if existingRecipe has no more recipeIngredients, update status to 'noIngredients'
    const { data: recipeIngredients, error: recipeIngredientsError } = await db.from('recipeIngredients').select().eq('recipeID', existingRecipeIngredient[0].recipeID).eq('deleted', false);
    if (recipeIngredientsError) {
      global.logger.info(`Error getting remaining recipeIngredients for recipe: ${recipeIngredientsError}`);
      return { error: recipeIngredientsError };
    }
    if (!recipeIngredients.length) {
      const { error: updateError } = await db.from('recipes').update({ status: 'noIngredients' }).eq('recipeID', existingRecipeIngredient[0].recipeID);
      if (updateError) {
        global.logger.info(`Error updating recipe status: ${updateError}`);
        return { error: updateError };
      }
      global.logger.info(`Recipe now has no recipeIngredients, Updated recipe status to 'noIngredients'`);
    }

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
