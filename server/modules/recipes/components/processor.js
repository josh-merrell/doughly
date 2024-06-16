('use strict');

const { createRecipeLog } = require('../../../services/dbLogger');
const { updater, incrementVersion, getRecipeVersion } = require('../../../db');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeComponentIDs, recipeID } = options;

    try {
      let q = db.from('recipeComponents').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeComponentID', { ascending: true });

      if (recipeComponentIDs) {
        q = q.in('recipeComponentID', recipeComponentIDs);
      }
      if (recipeID) {
        q = q.filter('recipeID', 'eq', recipeID);
      }

      const { data: recipeComponents, error } = await q;

      if (error) {
        throw errorGen(`Error getting recipeComponents: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got recipeComponents for recipe`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return recipeComponents;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeComponents getAll', err.code || 520, err.name || 'unhandledError_recipeComponents-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, componentID, componentAdvanceDays } = options;

    try {
      //if params are not present, return error
      if (!recipeID || !componentID || !componentAdvanceDays) {
        throw errorGen(`RecipeID, componentID, and componentAdvanceDays are required to create component`, 510, 'dataValidationErr', false, 3);
      }

      if (recipeID === componentID) {
        throw errorGen(`RecipeID and componentID cannot be the same when creating recipe component`, 515, 'cannotComplete', false, 2);
      }

      //verify that provided recipeID and compomentID (recipe) exist, return error if not
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID);
      if (error) {
        throw errorGen(`Error getting recipe: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipe.length) {
        throw errorGen(`Recipe with provided ID (${recipeID}) does not exist, cannot create component`, 515, 'cannotComplete', false, 2);
      }
      const { data: component, error: error2 } = await db.from('recipes').select().eq('recipeID', componentID);
      if (error2) {
        throw errorGen(`Error getting component Recipe: ${error2.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!component.length) {
        throw errorGen(`Component Recipe with provided ID (${componentID}) does not exist, cannot create component`, 515, 'cannotComplete', false, 2);
      }

      const { data, errorInsert } = await db.from('recipeComponents').insert({ recipeComponentID: customID, userID, recipeID, componentID, componentAdvanceDays }).select().single();
      if (error) {
        throw errorGen(`Error creating recipeComponent: ${errorInsert.message}`, 512, 'failSupabaseInsert', true, 3);
      }

      //add a 'created' log entry
      const logID1 = await createRecipeLog(userID, authorization, 'createRecipeComponent', Number(recipeID), Number(data.recipeComponentID), null, null, `created recipeComponent with ID: ${data.recipeComponentID} to recipe ${recipeID}`);

      //increment recipe version and add a 'recipeComponentAdded' log entry to the component recipe
      const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID1), String(recipe[0].version), String(newVersion), `updated Recipe, ID: ${recipeID} to version: ${newVersion}`);
      return data;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeComponents create', err.code || 520, err.name || 'unhandledError_recipeComponents-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    try {
      //verify that the provided recipeComponentID exists, return error if not
      const { data: recipeComponent, error } = await db.from('recipeComponents').select().eq('recipeComponentID', options.recipeComponentID);

      if (error) {
        throw errorGen(`Error getting recipeComponent: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipeComponent.length) {
        throw errorGen(`RecipeComponent with provided ID (${options.recipeComponentID}) does not exist, cannot update`, 515, 'cannotComplete', false, 2);
      }

      //update recipeComponent
      const updateFields = {};
      for (let key in options) {
        if (key !== 'recipeComponentID' && options[key] !== undefined && key !== 'authorization') {
          updateFields[key] = options[key];
        }
      }

      const updatedRecipeComponent = await updater(options.userID, options.authorization, 'recipeComponentID', options.recipeComponentID, 'recipeComponents', updateFields);
      return updatedRecipeComponent;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeComponents update', err.code || 520, err.name || 'unhandledError_recipeComponents-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteRecipeComponent(options) {
    try {
      //verify that the provided recipeComponentID exists, return error if not
      const { data: recipeComponent, error } = await db.from('recipeComponents').select().eq('recipeComponentID', options.recipeComponentID).eq('deleted', false);

      if (error) {
        throw errorGen(`Error getting recipeComponent: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipeComponent.length) {
        throw errorGen(`RecipeComponent with provided ID (${options.recipeComponentID}) does not exist, cannot delete`, 515, 'cannotComplete', false, 3);
      }

      //delete recipeComponent
      const { data, error: deleteError } = await db.from('recipeComponents').update({ deleted: true }).match({ recipeComponentID: options.recipeComponentID });
      if (deleteError) {
        throw errorGen(`Error deleting recipeComponent: ${deleteError.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      //add a 'deleted' log entry
      const logID1 = await createRecipeLog(options.userID, options.authorization, 'deleteRecipeComponent', Number(options.recipeComponentID), Number(recipeComponent[0].recipeID), null, null, `deleted recipeComponent with ID: ${options.recipeComponentID}`);

      //update version of associated recipe and log the change
      const recipeVersion = await getRecipeVersion(recipeComponent[0].recipeID);
      const newVersion = await incrementVersion('recipes', 'recipeID', recipeComponent[0].recipeID, recipeVersion);
      createRecipeLog(options.userID, options.authorization, 'updateRecipeVersion', Number(recipeComponent[0].recipeID), Number(logID1), String(recipeVersion), String(newVersion), `updated version of recipe ID:${recipeComponent[0].recipeID} from ${recipeVersion} to ${newVersion}`);

      return data;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeComponents deleteRecipeComponent', err.code || 520, err.name || 'unhandledError_recipeComponents-deleteRecipeComponent', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    get: {
      all: getAll,
    },
    create,
    update,
    delete: deleteRecipeComponent,
  };
};
