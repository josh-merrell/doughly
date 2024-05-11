('use strict');

const { createRecipeLog } = require('../../../services/dbLogger');
const { updater, incrementVersion, getRecipeVersion } = require('../../../db');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeComponentIDs, recipeID } = options;
    let q = db.from('recipeComponents').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeComponentID', { ascending: true });

    if (recipeComponentIDs) {
      q = q.in('recipeComponentID', recipeComponentIDs);
    }
    if (recipeID) {
      q = q.filter('recipeID', 'eq', recipeID);
    }

    const { data: recipeComponents, error } = await q;

    if (error) {
      global.logger.error(`Error getting recipeComponents: ${error.message}`);
      throw errorGen('Error getting recipeComponents', 400);
    }
    global.logger.info(`Got recipeComponents`);
    return recipeComponents;
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, componentID, componentAdvanceDays } = options;

    //if params are not present, return error
    if (!recipeID || !componentID || !componentAdvanceDays) {
      global.logger.error(`RecipeID, componentID, and componentAdvanceDays are required`);
      throw errorGen(`RecipeID, componentID, and componentAdvanceDays are required`, 400);
    }

    if (recipeID === componentID) {
      global.logger.error(`RecipeID and componentID cannot be the same`);
      throw errorGen(`RecipeID and componentID cannot be the same`, 400);
    }

    //verify that provided recipeID and compomentID (recipe) exist, return error if not
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('hidden', false);
    if (error) {
      global.logger.error(`Error getting recipe: ${error.message}`);
      throw errorGen(`Error getting recipe`, 400);
    }
    if (!recipe.length) {
      global.logger.error(`Recipe with provided ID (${recipeID}) does not exist`);
      throw errorGen(`Recipe with provided ID (${recipeID}) does not exist`, 400);
    }
    const { data: component, error: error2 } = await db.from('recipes').select().eq('recipeID', componentID).eq('hidden', false);
    if (error2) {
      global.logger.error(`Error getting component Recipe: ${error2.message}`);
      throw errorGen(`Error getting component Recipe`, 400);
    }
    if (!component.length) {
      global.logger.error(`Component Recipe with provided ID (${componentID}) does not exist`);
      throw errorGen(`Component Recipe with provided ID (${componentID}) does not exist`, 400);
    }

    const { data, errorInsert } = await db.from('recipeComponents').insert({ recipeComponentID: customID, userID, recipeID, componentID, componentAdvanceDays }).select().single();
    if (error) {
      global.logger.error(`Error creating recipeComponent: ${errorInsert.message}`);
      throw errorGen(`Error creating recipeComponent`, 400);
    }

    //add a 'created' log entry
    const logID1 = await createRecipeLog(userID, authorization, 'createRecipeComponent', Number(recipeID), Number(data.recipeComponentID), null, null, `created recipeComponent with ID: ${data.recipeComponentID} to recipe ${recipeID}`);

    //increment recipe version and add a 'recipeComponentAdded' log entry to the component recipe
    const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
    createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID1), String(recipe[0].version), String(newVersion), `updated Recipe, ID: ${recipeID} to version: ${newVersion}`);
    return data;
  }

  async function update(options) {
    //verify that the provided recipeComponentID exists, return error if not
    const { data: recipeComponent, error } = await db.from('recipeComponents').select().eq('recipeComponentID', options.recipeComponentID);

    if (error) {
      global.logger.error(`Error getting recipeComponent: ${error.message}`);
      throw errorGen(`Error getting recipeComponent`, 400);
    }
    if (!recipeComponent.length) {
      global.logger.error(`RecipeComponent with provided ID (${options.recipeComponentID}) does not exist`);
      throw errorGen(`RecipeComponent with provided ID (${options.recipeComponentID}) does not exist`, 400);
    }

    //update recipeComponent
    const updateFields = {};
    for (let key in options) {
      if (key !== 'recipeComponentID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipeComponent = await updater(options.userID, options.authorization, 'recipeComponentID', options.recipeComponentID, 'recipeComponents', updateFields);
      return updatedRecipeComponent;
    } catch (error) {
      global.logger.error(`Error updating recipeComponent ID: ${options.recipeComponentID}: ${error.message}`);
      throw errorGen(`Error updating recipeComponent`, 400);
    }
  }

  async function deleteRecipeComponent(options) {
    //verify that the provided recipeComponentID exists, return error if not
    const { data: recipeComponent, error } = await db.from('recipeComponents').select().eq('recipeComponentID', options.recipeComponentID).eq('deleted', false);

    if (error) {
      global.logger.error(`Error getting recipeComponent: ${error.message}`);
      throw errorGen(`Error getting recipeComponent`, 400);
    }
    if (!recipeComponent.length) {
      global.logger.error(`RecipeComponent with provided ID (${options.recipeComponentID}) does not exist`);
      throw errorGen(`RecipeComponent with provided ID (${options.recipeComponentID}) does not exist`, 400);
    }

    //delete recipeComponent
    const { data, error: deleteError } = await db.from('recipeComponents').update({ deleted: true }).match({ recipeComponentID: options.recipeComponentID });
    if (deleteError) {
      global.logger.error(`Error deleting recipeComponent: ${deleteError.message}`);
      throw errorGen(`Error deleting recipeComponent`, 400);
    }
    //add a 'deleted' log entry
    const logID1 = await createRecipeLog(options.userID, options.authorization, 'deleteRecipeComponent', Number(options.recipeComponentID), Number(recipeComponent[0].recipeID), null, null, `deleted recipeComponent with ID: ${options.recipeComponentID}`);

    //update version of associated recipe and log the change
    const recipeVersion = await getRecipeVersion(recipeComponent[0].recipeID);
    const newVersion = await incrementVersion('recipes', 'recipeID', recipeComponent[0].recipeID, recipeVersion);
    createRecipeLog(options.userID, options.authorization, 'updateRecipeVersion', Number(recipeComponent[0].recipeID), Number(logID1), String(recipeVersion), String(newVersion), `updated version of recipe ID:${recipeComponent[0].recipeID} from ${recipeVersion} to ${newVersion}`);

    return data;
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
