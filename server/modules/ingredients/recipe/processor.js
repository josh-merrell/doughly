('use strict');

const { createRecipeLog } = require('../../../services/dbLogger');
const { updater, incrementVersion, getRecipeVersion } = require('../../../db');

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
    const { customID, authorization, userID, recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio } = options;

    //verify that 'customID' exists on the request
    if (!customID) {
      global.logger.info(`Error creating recipeIngredient: customID is missing`);
      return { error: 'customID is missing' };
    }

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
    if (!purchaseUnitRatio || purchaseUnitRatio <= 0) {
      global.logger.info(`positive purchaseUnitRatio number is required`);
      return { error: `positive purchaseUnitRatio number is required` };
    }

    //create the recipeIngredient
    const { data: recipeIngredient, error3 } = await db.from('recipeIngredients').insert({ recipeIngredientID: customID, userID, recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio, version: 1 }).select().single();

    if (error3) {
      global.logger.info(`Error creating recipeIngredient: ${error3.message}`);
      return { error: error3.message };
    }

    //if status of existingRecipe is 'noIngredients', update status to 'noTools'
    if (existingRecipe[0].status === 'noIngredients' && recipeIngredient.recipeIngredientID) {
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

    //add a 'created' log entry
    const logID1 = await createRecipeLog(userID, authorization, 'createRecipeIngredient', recipeIngredient.recipeIngredientID, recipeIngredient.recipeID, null, null, `created recipeIngredient: ${measurement} ${measurementUnit} of ${existingIngredient[0].name}`);
    //increment recipe version and add a 'recipeIngredientAdded' log entry to the recipe
    const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, existingRecipe[0].version);
    createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID1), String(existingRecipe[0].version), String(newVersion), `updated recipe, ID: ${recipeID} to version: ${newVersion}`);

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
    const { userID, authorization, recipeIngredientID, measurement, purchaseUnitRatio } = options;

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
      if (key !== 'recipeIngredientID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipeIngredient = await updater(userID, authorization, 'recipeIngredientID', recipeIngredientID, 'recipeIngredients', updateFields);
      return updatedRecipeIngredient;
    } catch (error) {
      global.logger.info(`Error updating recipeIngredient ID: ${recipeIngredientID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteRecipeIngredient(options) {
    const { userID, authorization, recipeIngredientID } = options;

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

    //add a 'deleted' log entry
    const logID1 = createRecipeLog(userID, authorization, 'deleteRecipeIngredient', Number(recipeIngredientID), Number(existingRecipeIngredient[0].recipeID), null, null, `deleted recipeIngredient ${recipeIngredientID}`);

    //increment version of associated recipe and add a log entry
    const recipeVersion = await getRecipeVersion(existingRecipeIngredient[0].recipeID);
    const newVersion = await incrementVersion('recipes', 'recipeID', existingRecipeIngredient[0].recipeID, recipeVersion);
    createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(existingRecipeIngredient[0].recipeID), Number(logID1), String(recipeVersion), String(newVersion), `updated version of recipe ID:${existingRecipeIngredient[0].recipeID} from ${recipeVersion} to ${newVersion}`);

    //if existingRecipe has no more recipeIngredients, update status to 'noIngredients'
    const { data: recipeIngredients, error: recipeIngredientsError } = await db.from('recipeIngredients').select().eq('recipeID', existingRecipeIngredient[0].recipeID).eq('deleted', false);
    if (recipeIngredientsError) {
      global.logger.info(`Error getting remaining recipeIngredients for recipe: ${recipeIngredientsError}`);
      return { error: recipeIngredientsError };
    }
    if (!recipeIngredients.length) {
      //get current recipe status
      const { data: existingRecipe } = await db.from('recipes').select().eq('recipeID', existingRecipeIngredient[0].recipeID).single();
      const { error: updateError } = await db.from('recipes').update({ status: 'noIngredients' }).eq('recipeID', existingRecipeIngredient[0].recipeID);
      if (updateError) {
        global.logger.info(`Error updating recipe status: ${updateError}`);
        return { error: updateError };
      }
      //log the change
      createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(existingRecipeIngredient[0].recipeID), Number(logID1), `${existingRecipe.status}`, 'noIngredients', `updated recipe status to 'noIngredients'`);
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
