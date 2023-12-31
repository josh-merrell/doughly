('use strict');

const { createRecipeLog } = require('../../../services/dbLogger');
const { updater, incrementVersion, getRecipeVersion } = require('../../../db');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeIngredientIDs, recipeID, ingredientID } = options;

    let q = db.from('recipeIngredients').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeIngredientID', { descending: true });
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
      global.logger.error(`Error getting recipeIngredients: ${error.message}`);
      throw errorGen(`Error getting recipeIngredients`, 400);
    }
    global.logger.info(`Got ${recipeIngredients.length} recipeIngredients`);
    return recipeIngredients;
  }

  async function getRecipeIngredientByID(options) {
    const { recipeIngredientID } = options;
    const { data: recipeIngredient, error } = await db.from('recipeIngredients').select().eq('recipeIngredientID', recipeIngredientID).eq('deleted', false);

    if (error) {
      global.logger.error(`Error getting recipeIngredient ID: ${recipeIngredientID}: ${error.message}`);
      throw errorGen(`Error getting recipeIngredient ID: ${recipeIngredientID}`, 400);
    }
    global.logger.info(`Got recipeIngredient`);
    return recipeIngredient;
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio } = options;

    //verify that 'customID' exists on the request
    if (!customID) {
      global.logger.error(`Error creating recipeIngredient: customID is missing`);
      throw errorGen(`Error creating recipeIngredient: customID is missing`, 400);
    }

    //verify that the provided recipeID exists, return error if not
    const { data: existingRecipe, error } = await db.from('recipes').select().filter('userID', 'eq', userID).filter('recipeID', 'eq', recipeID).eq('deleted', false);
    if (error) {
      global.logger.error(`Error validating provided recipeID: ${error.message}`);
      throw errorGen(`Error validating provided recipeID`, 400);
    }
    if (existingRecipe.length === 0) {
      global.logger.error(`RecipeID does not exist, cannot create recipeIngredient`);
      throw errorGen(`RecipeID does not exist, cannot create recipeIngredient`, 400);
    }

    //verify that the provided ingredientID exists, return error if not
    const { data: existingIngredient, error2 } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID);
    if (error2) {
      global.logger.error(`Error validating provided ingredientID: ${error2.message}`);
      throw errorGen(`Error validating provided ingredientID`, 400);
    }
    if (existingIngredient.length === 0) {
      global.logger.error(`IngredientID does not exist, cannot create recipeIngredient`);
      throw errorGen(`IngredientID does not exist, cannot create recipeIngredient`, 400);
    }

    //verify that the provided measurement is a positive number, return error if not
    if (!measurement || measurement <= 0) {
      global.logger.error(`positive measurement number is required`);
      throw errorGen(`positive measurement number is required`, 400);
    }

    //verify that the provided purchaseUnitRatio is a positive number, return error if not
    if (!purchaseUnitRatio || purchaseUnitRatio <= 0) {
      global.logger.error(`positive purchaseUnitRatio number is required`);
      throw errorGen(`positive purchaseUnitRatio number is required`, 400);
    }

    //create the recipeIngredient
    const { data: recipeIngredient, error3 } = await db.from('recipeIngredients').insert({ recipeIngredientID: customID, userID, recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio, version: 1 }).select().single();

    if (error3) {
      global.logger.error(`Error creating recipeIngredient: ${error3.message}`);
      throw errorGen(`Error creating recipeIngredient`, 400);
    }

    //if status of existingRecipe is 'noIngredients', update status to 'noTools'
    if (existingRecipe[0].status === 'noIngredients' && recipeIngredient.recipeIngredientID) {
      const { error4 } = await db.from('recipes').update({ status: 'noTools' }).eq('recipeID', recipeID);
      if (error4) {
        global.logger.error(`Error updating recipe status: ${error4.message}`);
        const { error5 } = await db.from('recipeIngredients').delete().eq('recipeIngredientID', recipeIngredient.recipeIngredientID);
        if (error5) {
          global.logger.error(`Error rolling back recipeIngredient: ${error5.message}`);
          throw errorGen(`Error rolling back recipeIngredient`, 400);
        }
        throw errorGen(`Error updating recipe status`, 400);
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
      global.logger.error(`Error validating provided recipeIngredientID: ${error.message}`);
      throw errorGen(`Error validating provided recipeIngredientID`, 400);
    }
    if (existingRecipeIngredient.length === 0) {
      global.logger.error(`RecipeIngredientID does not exist, cannot update recipeIngredient`);
      throw errorGen(`RecipeIngredientID does not exist, cannot update recipeIngredient`, 400);
    }

    //if provided, verify that the provided measurement is a positive number, return error if not
    if (measurement && measurement <= 0) {
      global.logger.error(`positive measurement number is required`);
      throw errorGen(`positive measurement number is required`, 400);
    }

    //if provided, verify that the provided purchaseUnitRatio is a positive number, return error if not
    if (purchaseUnitRatio && purchaseUnitRatio <= 0) {
      global.logger.error(`positive purchaseUnitRatio number is required`);
      throw errorGen(`positive purchaseUnitRatio number is required`, 400);
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
      global.logger.error(`Error updating recipeIngredient ID: ${recipeIngredientID}: ${error.message}`);
      throw errorGen(`Error updating recipeIngredient ID: ${recipeIngredientID}`, 400);
    }
  }

  async function deleteRecipeIngredient(options) {
    const { userID, authorization, recipeIngredientID } = options;

    //verify that the provided recipeIngredientID exists, return error if not
    const { data: existingRecipeIngredient, error } = await db.from('recipeIngredients').select().eq('recipeIngredientID', recipeIngredientID).eq('deleted', false);
    if (error) {
      global.logger.error(`Error validating provided recipeIngredientID: ${error.message}`);
      throw errorGen(`Error validating provided recipeIngredientID`, 400);
    }
    if (existingRecipeIngredient.length === 0) {
      global.logger.error(`RecipeIngredientID does not exist, cannot delete recipeIngredient`);
      throw errorGen(`RecipeIngredientID does not exist, cannot delete recipeIngredient`, 400);
    }

    //delete the recipeIngredient
    const { error2 } = await db.from('recipeIngredients').update({ deleted: true }).eq('recipeIngredientID', recipeIngredientID);

    if (error2) {
      global.logger.error(`Error deleting recipeIngredient ID: ${recipeIngredientID}: ${error2.message}`);
      throw errorGen(`Error deleting recipeIngredient ID: ${recipeIngredientID}`, 400);
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
      global.logger.error(`Error getting remaining recipeIngredients for recipe: ${recipeIngredientsError}`);
      throw errorGen(`Error getting remaining recipeIngredients for recipe`, 400);
    }
    if (!recipeIngredients.length) {
      //get current recipe status
      const { data: existingRecipe } = await db.from('recipes').select().eq('recipeID', existingRecipeIngredient[0].recipeID).single();
      const { error: updateError } = await db.from('recipes').update({ status: 'noIngredients' }).eq('recipeID', existingRecipeIngredient[0].recipeID);
      if (updateError) {
        global.logger.error(`Error updating recipe status: ${updateError}`);
        throw errorGen(`Error updating recipe status`, 400);
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
