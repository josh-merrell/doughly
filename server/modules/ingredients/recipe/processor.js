('use strict');

const { createRecipeLog } = require('../../../services/dbLogger');
const { updater, incrementVersion, getRecipeVersion } = require('../../../db');
const { errorGen } = require('../../../middleware/errorHandling');
const { getUnitRatio } = require('../../../services/aiHandlers');
const { log, info } = require('console');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeIngredientIDs, recipeID, ingredientID } = options;

    try {
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
        throw errorGen(`Error getting recipeIngredients`, 511, `failSupabaseSelect`, true, 3);
      }
      global.logger.info({message:`*recipeIngredients-getAll* Got ${recipeIngredients.length} recipeIngredients`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      return recipeIngredients;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeIngredients getAll', err.code || 520, err.name || 'unhandledError_recipeIngredients-getAll', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function getRecipeIngredientByID(options) {
    const { userID, recipeIngredientID } = options;
    try {
      const { data: recipeIngredient, error } = await db.from('recipeIngredients').select().eq('recipeIngredientID', recipeIngredientID).eq('deleted', false);

      if (error) {
        throw errorGen(`Error getting recipeIngredient ID: ${recipeIngredientID}`, 511, `failSupabaseSelect`, true, 3);
      }
      global.logger.info({message:`*recipeIngredients-getRecipeIngredientByID* Got recipeIngredient`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      return recipeIngredient;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeIngredients getRecipeIngredientByID', err.code || 520, err.name || 'unhandledError_recipeIngredients-getRecipeIngredientByID', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio, preparation, component, RIneedsReview = false } = options;

    try {
      global.logger.info({message:`*recipeIngredients-create* CREATING RECIPE INGREDIENT, PREPARATION: ${preparation}`, level:7, timestamp: new Date().toISOString(), 'userID': userID});

      //verify that 'customID' exists on the request
      if (!customID) {
        throw errorGen(`Error creating recipeIngredient: customID is missing`, 510, `dataValidationErr`, false, 3);
      }

      //verify that the provided recipeID exists, return error if not
      const { data: existingRecipe, error } = await db.from('recipes').select().filter('userID', 'eq', userID).filter('recipeID', 'eq', recipeID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error validating provided recipeID`, 510, `dataValidationErr`, false, 3);
      }
      if (existingRecipe.length === 0) {
        // throw errorGen(`RecipeID does not exist, cannot create recipeIngredient`, 400);
        throw errorGen(`RecipeID does not exist, cannot create recipeIngredient`, 515, `cannotComplete`, true, 3);
      }

      //verify that the provided ingredientID exists, return error if not
      const { data: existingIngredient, error2 } = await db.from('ingredients').select().filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID);
      if (error2) {
        // throw errorGen(`Error validating provided ingredientID`, 400);
        throw errorGen(`Error validating provided ingredientID`, 515, 'cannotComplete', true, 3);
      }
      if (existingIngredient.length === 0) {
        throw errorGen(`IngredientID ${ingredientID} does not exist, cannot create recipeIngredient`, 510, 'dataValidationErr', false, 3);
      }

      //verify that the provided measurement is a positive number, return error if not
      if (!measurement || measurement <= 0) {
        throw errorGen(`positive measurement number is required`, 510, 'dataValidationErr', false, 3);
      }

      //verify that the provided purchaseUnitRatio is a positive number, return error if not
      if (!purchaseUnitRatio || purchaseUnitRatio <= 0) {
        throw errorGen(`positive purchaseUnitRatio number is required, got ${purchaseUnitRatio}`, 510, 'dataValidationErr', false, 3);
      }

      //create the recipeIngredient
      const { data: recipeIngredient, error3 } = await db.from('recipeIngredients').insert({ recipeIngredientID: customID, userID, recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio, version: 1, preparation, component, RIneedsReview }).select().single();

      if (error3) {
        throw errorGen(`Error creating recipeIngredient: ${error3.message}`, 512, 'failSupabaseInsert', true, 3);
      }

      //if status of existingRecipe is 'noIngredients', update status to 'noTools'
      if (existingRecipe[0].status === 'noIngredients' && recipeIngredient.recipeIngredientID) {
        const { error4 } = await db.from('recipes').update({ status: 'noTools' }).eq('recipeID', recipeID);
        if (error4) {
          global.logger.info({message:`*recipeIngredients-create* Error updating recipe status: ${error4.message}, rolling back`, level:3, timestamp: new Date().toISOString(), 'userID': userID});
          const { error5 } = await db.from('recipeIngredients').delete().eq('recipeIngredientID', recipeIngredient.recipeIngredientID);
          if (error5) {
            throw errorGen(`Error rolling back recipeIngredient: ${error5.message}`, 514, 'failSupabaseDelete', true, 3);
          }
          throw errorGen(`Error updating recipe status`, 513, 'failSupabaseUpdate', true, 3);
        }
      }

      //add a 'created' log entry
      const logID1 = await createRecipeLog(userID, authorization, 'createRecipeIngredient', recipeIngredient.recipeIngredientID, recipeIngredient.recipeID, null, null, `Added ${measurement} ${measurementUnit} of ${existingIngredient[0].name} to recipe`);
      //increment recipe version and add a 'recipeIngredientAdded' log entry to the recipe
      const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, existingRecipe[0].version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID1), String(existingRecipe[0].version), String(newVersion), `Updated Recipe ${recipeID} to Version: ${newVersion}`);

      return {
        recipeIngredientID: recipeIngredient.recipeIngredientID,
        recipeID: recipeIngredient.recipeID,
        ingredientID: recipeIngredient.ingredientID,
        measurementUnit: recipeIngredient.measurementUnit,
        measurement: recipeIngredient.measurement,
        purchaseUnitRatio: recipeIngredient.purchaseUnitRatio,
        preparation,
        component,
        RIneedsReview,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeIngredients create', err.code || 520, err.name || 'unhandledError_recipeIngredients-create', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function update(options) {
    const { userID, authorization, recipeIngredientID, measurement, purchaseUnitRatio } = options;

    try {
      //verify that the provided recipeIngredientID exists, return error if not
      const { data: existingRecipeIngredient, error } = await db.from('recipeIngredients').select().filter('userID', 'eq', userID).filter('recipeIngredientID', 'eq', recipeIngredientID);
      if (error) {
        throw errorGen(`Error validating provided recipeIngredientID: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingRecipeIngredient.length === 0) {
        throw errorGen(`RecipeIngredientID does not exist, cannot update recipeIngredient`, 515, 'cannotComplete', true, 3);
      }

      //if provided, verify that the provided measurement is a positive number, return error if not
      if (measurement && measurement <= 0) {
        throw errorGen(`positive measurement number is required`, 510, 'dataValidationErr', false, 3);
      }

      //if provided, verify that the provided purchaseUnitRatio is a positive number, return error if not
      if (purchaseUnitRatio && purchaseUnitRatio <= 0) {
        throw errorGen(`positive purchaseUnitRatio number is required`, 510, 'dataValidationErr', false, 3);
      }

      //update the recipeIngredient
      const updateFields = {};

      for (let key in options) {
        if (key !== 'recipeIngredientID' && options[key] !== undefined && key !== 'authorization') {
          updateFields[key] = options[key];
        }
      }

      // always set RIneedsReview to false when updating
      updateFields['RIneedsReview'] = false;

      const updatedRecipeIngredient = await updater(userID, authorization, 'recipeIngredientID', recipeIngredientID, 'recipeIngredients', updateFields);
      return updatedRecipeIngredient;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeIngredients update', err.code || 520, err.name || 'unhandledError_recipeIngredients-update', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function deleteRecipeIngredient(options) {
    const { userID, authorization, recipeIngredientID } = options;

    try {
      //verify that the provided recipeIngredientID exists, return error if not
      const { data: existingRecipeIngredient, error } = await db.from('recipeIngredients').select().eq('recipeIngredientID', recipeIngredientID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error validating provided recipeIngredientID`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingRecipeIngredient.length === 0) {
        throw errorGen(`RecipeIngredientID does not exist, cannot delete recipeIngredient`, 515, 'cannotComplete', true, 3);
      }

      //delete the recipeIngredient
      const { error2 } = await db.from('recipeIngredients').update({ deleted: true }).eq('recipeIngredientID', recipeIngredientID);

      if (error2) {
        throw errorGen(`Error deleting recipeIngredient ID: ${recipeIngredientID}`, 512, 'failSupabaseDelete', true, 3);
      }

      //add a 'deleted' log entry
      const logID1 = createRecipeLog(userID, authorization, 'deleteRecipeIngredient', Number(recipeIngredientID), Number(existingRecipeIngredient[0].recipeID), null, null, `Removed Ingredient from RecipeID  ${existingRecipeIngredient[0].recipeID}`);

      //increment version of associated recipe and add a log entry
      const recipeVersion = await getRecipeVersion(existingRecipeIngredient[0].recipeID);
      const newVersion = await incrementVersion('recipes', 'recipeID', existingRecipeIngredient[0].recipeID, recipeVersion);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(existingRecipeIngredient[0].recipeID), Number(logID1), String(recipeVersion), String(newVersion), `Updated Version of Recipe ${existingRecipeIngredient[0].recipeID} from ${recipeVersion} to ${newVersion}`);

      //if existingRecipe has no more recipeIngredients, update status to 'noIngredients'
      const { data: recipeIngredients, error: recipeIngredientsError } = await db.from('recipeIngredients').select().eq('recipeID', existingRecipeIngredient[0].recipeID).eq('deleted', false);
      if (recipeIngredientsError) {
        throw errorGen(`Error getting remaining recipeIngredients for recipe`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipeIngredients.length) {
        //get current recipe status
        const { data: existingRecipe } = await db.from('recipes').select().eq('recipeID', existingRecipeIngredient[0].recipeID).single();
        const { error: updateError } = await db.from('recipes').update({ status: 'noIngredients' }).eq('recipeID', existingRecipeIngredient[0].recipeID);
        if (updateError) {
          throw errorGen(`Error updating recipe status`, 513, 'failSupabaseUpdate', true, 3);
        }
        //log the change
        createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(existingRecipeIngredient[0].recipeID), Number(logID1), `${existingRecipe.status}`, 'noIngredients', `Updated Status of Recipe: ${existingRecipe.title} to 'noIngredients'`);
      }
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeIngredients deleteRecipeIngredient', err.code || 520, err.name || 'unhandledError_recipeIngredients-deleteReciepIngredient', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function getPurEst(options) {
    const { userID, authorization, ingredientName, measurementUnit, purchaseUnit } = options;

    try {
      global.logger.info({message:`*recipeIngredients-getPurEst* GETTING PURCHASE UNIT RATIO ESTIMATE FOR ${ingredientName} ${measurementUnit} and ${purchaseUnit}`, level:6, timestamp: new Date().toISOString(), 'userID': userID});

      const data = await getUnitRatio(userID, authorization, ingredientName, measurementUnit, purchaseUnit);
      const parsedData = JSON.parse(data.response);
      global.logger.info({message:`*recipeIngredients-getPurEst* PURCHASE UNIT RATIO EST RESULT: ${JSON.stringify(parsedData)}`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      if (!parsedData.unitRatio) {
        global.logger.warn({message:`Error getting unitRatioEstimate from openAI for ${ingredientName} ${measurementUnit} and ${purchaseUnit}. Defaulting to 1`, level:4, timestamp: new Date().toISOString(), 'userID': userID});
        return 1;
      }
      return Number(parsedData.unitRatio);
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeIngredients getPurEst', err.code || 520, err.name || 'unhandledError_recipeIngredients-getPurEst', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  return {
    get: {
      all: getAll,
      byID: getRecipeIngredientByID,
      purEst: getPurEst,
    },
    create,
    update,
    delete: deleteRecipeIngredient,
  };
};
