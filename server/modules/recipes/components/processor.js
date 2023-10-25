('use strict');

const { createRecipeLog } = require('../../services/dbLogger');
const { updater, incrementVersion } = require('../../../db');

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
      global.logger.info(`Error getting recipeComponents: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipeComponents`);
    return recipeComponents;
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, componentID, componentAdvanceDays } = options;

    //if params are not present, return error
    if (!recipeID || !componentID || !componentAdvanceDays) {
      global.logger.info(`RecipeID, componentID, and componentAdvanceDays are required`);
      return { error: `RecipeID, componentID, and componentAdvanceDays are required` };
    }

    if (recipeID === componentID) {
      global.logger.info(`RecipeID and componentID cannot be the same`);
      return { error: `RecipeID and componentID cannot be the same` };
    }

    //verify that provided recipeID and compomentID (recipe) exist, return error if not
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID);
    if (error) {
      global.logger.info(`Error getting recipe: ${error.message}`);
      return { error: error.message };
    }
    if (!recipe.length) {
      global.logger.info(`Recipe with provided ID (${recipeID}) does not exist`);
      return { error: `Recipe with provided ID (${recipeID}) does not exist` };
    }
    const { data: component, error: error2 } = await db.from('recipes').select().eq('recipeID', componentID);
    if (error2) {
      global.logger.info(`Error getting component Recipe: ${error2.message}`);
      return { error: error2.message };
    }
    if (!component.length) {
      global.logger.info(`Component Recipe with provided ID (${componentID}) does not exist`);
      return { error: `Component Recipe with provided ID (${componentID}) does not exist` };
    }

    const { data, errorInsert } = await db.from('recipeComponents').insert({ recipeComponentID: customID, userID, recipeID, componentID, componentAdvanceDays }).select().single();

    if (error) {
      global.logger.info(`Error creating recipeComponent: ${errorInsert.message}`);
      return { error: errorInsert.message };
    }

    //add a 'created' log entry
    const logID1 = createRecipeLog(userID, authorization, 'addedComponentToRecipe', Number(recipeID), Number(data.recipeComponentID), null, null, `added recipeComponent with ID: ${data.recipeComponentID} to recipe ${recipeID}`);

    //increment recipe version and add a 'recipeComponentAdded' log entry to the component recipe
    const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
    createRecipeLog(userID, authorization, 'updatedRecipeVersion', Number(recipeID), Number(logID1), String(recipe[0].version), String(newVersion), `Updated Recipe, ID: ${recipeID} to version: ${newVersion}`);
    return data;
  }

  async function update(options) {
    //verify that the provided recipeComponentID exists, return error if not
    const { data: recipeComponent, error } = await db.from('recipeComponents').select().eq('recipeComponentID', options.recipeComponentID);

    if (error) {
      global.logger.info(`Error getting recipeComponent: ${error.message}`);
      return { error: error.message };
    }
    if (!recipeComponent.length) {
      global.logger.info(`RecipeComponent with provided ID (${options.recipeComponentID}) does not exist`);
      return { error: `RecipeComponent with provided ID (${options.recipeComponentID}) does not exist` };
    }

    //update recipeComponent
    const updateFields = {};
    for (let key in options) {
      if (key !== 'recipeComponentID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipeComponent = await updater('recipeComponentID', options.recipeComponentID, 'recipeComponents', updateFields);
      global.logger.info(`Updated recipeComponent`);
      return updatedRecipeComponent;
    } catch (error) {
      global.logger.info(`Error updating recipeComponent ID: ${options.recipeComponentID}: ${error.message}`);
      return { error: `Error updating recipeComponent: ${error.message}` };
    }
  }

  async function deleteRecipeComponent(options) {
    //verify that the provided recipeComponentID exists, return error if not
    const { data: recipeComponent, error } = await db.from('recipeComponents').select().eq('recipeComponentID', options.recipeComponentID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipeComponent: ${error.message}`);
      return { error: error.message };
    }
    if (!recipeComponent.length) {
      global.logger.info(`RecipeComponent with provided ID (${options.recipeComponentID}) does not exist`);
      return { error: `RecipeComponent with provided ID (${options.recipeComponentID}) does not exist` };
    }

    //delete recipeComponent
    const { data, error: deleteError } = await db.from('recipeComponents').update({ deleted: true }).match({ recipeComponentID: options.recipeComponentID });

    if (deleteError) {
      global.logger.info(`Error deleting recipeComponent: ${deleteError.message}`);
      return { error: deleteError.message };
    }

    //add a 'deleted' log entry
    createRecipeLog(options.userID, options.authorization, 'deletedRecipeComponent', Number(options.recipeComponentID), Number(recipeComponent.recipeID), null, null, `deleted recipeComponent with ID: ${options.recipeComponentID}`);

    global.logger.info(`Deleted recipeComponent`);
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
