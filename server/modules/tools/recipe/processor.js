('use strict');

const { updater, incrementVersion } = require('../../../db');
const { createRecipeLog } = require('../../../services/dbLogger');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeToolIDs, recipeID, toolID } = options;

    let q = db.from('recipeTools').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeToolID', { ascending: true });

    if (recipeToolIDs) {
      q = q.in('recipeToolID', recipeToolIDs);
    }
    if (recipeID) {
      q = q.filter('recipeID', 'eq', recipeID);
    }
    if (toolID) {
      q = q.filter('toolID', 'eq', toolID);
    }

    const { data: recipeTools, error } = await q;

    if (error) {
      global.logger.info(`Error getting recipeTools: ${error}`);
      return { error };
    }
    global.logger.info(`Got ${recipeTools.length} recipeTools`);
    return recipeTools;
  }

  async function getByID(options) {
    const { recipeToolID } = options;

    const { data: recipeTool, error } = await db.from('recipeTools').select().eq('recipeToolID', recipeToolID).eq('deleted', false).single();

    if (error) {
      global.logger.info(`Error getting recipeTool by ID: ${recipeToolID}: ${error}`);
      return { error };
    }
    global.logger.info(`Got recipeTool ${recipeToolID}`);
    return recipeTool;
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, toolID, quantity } = options;

    //validate that provided recipeID exists
    const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', recipeID);
    if (recipeError) {
      global.logger.info(`Error validating recipe ID: ${recipeID}: ${recipeError}`);
      return { error: recipeError };
    }
    if (!recipe.length) {
      global.logger.info(`Provided recipe ID: ${recipeID} does not exist, cannot create recipeTool`);
      return { error: `Provided recipe ID: ${recipeID} does not exist, cannot create recipeTool` };
    }

    //accept case of dummy recipeTool
    if (quantity === -1) {
      let dummyRecipeTool;
      //check for existing dummy recipeTool
      const { data: existingDummyRecipeTool, error: existingDummyRecipeToolError } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('quantity', -1);
      if (existingDummyRecipeToolError) {
        global.logger.info(`Error checking for existing dummy recipeTool: ${existingDummyRecipeToolError}`);
        return { error: existingDummyRecipeToolError };
      }
      if (!existingDummyRecipeTool.length) {
        //create dummy recipeTool
        const { data: newDummyRecipeTool, error: newDummyRecipeToolError } = await db.from('recipeTools').insert({ recipeToolID: customID, userID, recipeID, quantity, version: 1 }).select().single();
        if (newDummyRecipeToolError) {
          global.logger.info(`Error creating dummy recipeTool: ${newDummyRecipeToolError}`);
          return { error: newDummyRecipeToolError };
        }
        dummyRecipeTool = newDummyRecipeTool;
      }
      if (!dummyRecipeTool) {
        dummyRecipeTool = existingDummyRecipeTool[0];
        //undelete dummy recipeTool if deleted, also reset version to 1
        const { error: undeleteError } = await db.from('recipeTools').update({ deleted: false, version: 1 }).eq('recipeToolID', dummyRecipeTool.recipeToolID);
        if (undeleteError) {
          global.logger.info(`Error undeleting dummy recipeTool: ${undeleteError}`);
          return { error: undeleteError };
        }
      }
      //if status of existingRecipe is 'noTools', update status to 'noSteps'
      if (recipe[0].status === 'noTools') {
        await db.from('recipes').update({ status: 'noSteps' }).eq('recipeID', recipeID);
        //log recipe status update
        const logID1 = await createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeID), null, 'noTools', 'noSteps', `updated recipe status from 'noTools' to 'noSteps'`);
        //increment recipe version and add a 'updatedRecipeVersion' log entry
        const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
        createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID1), String(recipe[0].version), String(newVersion), `updated recipe, ID: ${recipeID} to version: ${newVersion}`);
      }
      //log dummy recipeTool creation
      const logID2 = await createRecipeLog(userID, authorization, 'createDummyRecipeTool', Number(dummyRecipeTool.recipeToolID), Number(recipeID), null, null, `created dummy recipeTool with ID: ${dummyRecipeTool.recipeToolID}`);
      //increment recipe version and add a 'updatedRecipeVersion' log entry
      const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID2), String(recipe[0].version), String(newVersion), `Updated Recipe, ID: ${recipeID} to version: ${newVersion}`);
      return {
        recipeToolID: dummyRecipeTool.recipeToolID,
        recipeID: dummyRecipeTool.recipeID,
        toolID: -1,
        quantity: dummyRecipeTool.quantity,
        version: 1,
      };
    }

    //validate that provided toolID exists
    const { data: tool, error: toolError } = await db.from('tools').select().eq('toolID', toolID);
    if (toolError) {
      global.logger.info(`Error validating tool ID: ${toolID}: ${toolError}`);
      return { error: toolError };
    }
    if (!tool.length) {
      global.logger.info(`Provided tool ID: ${toolID} does not exist, cannot create recipeTool`);
      return { error: `Provided tool ID: ${toolID} does not exist, cannot create recipeTool` };
    }

    //validate that provided quantity is a positive integer
    if (quantity < 1) {
      global.logger.info(`Provided quantity: ${quantity} is not a positive integer, cannot create recipeTool`);
      return { error: `Provided quantity: ${quantity} is not a positive integer, cannot create recipeTool` };
    }

    //validate that recipeTool does not already exist
    const { data: recipeTool, error: recipeToolError } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('toolID', toolID);
    if (recipeToolError) {
      global.logger.info(`Error checking for duplicate recipeTool: ${recipeToolError}`);
      return { error: recipeToolError };
    }
    if (recipeTool.length) {
      global.logger.info(`RecipeTool already exists, cannot create recipeTool`);
      return { error: `RecipeTool already exists, cannot create recipeTool` };
    }

    //create recipeTool
    const { data: newRecipeTool, error: newRecipeToolError } = await db.from('recipeTools').insert({ recipeToolID: customID, userID, recipeID, toolID, quantity, version: 1 }).select().single();

    if (newRecipeToolError) {
      global.logger.info(`Error creating recipeTool: ${newRecipeToolError}`);
      return { error: newRecipeToolError };
    }

    //add a 'created' log entry
    const logID3 = await createRecipeLog(userID, authorization, 'createRecipeTool', Number(newRecipeTool.recipeToolID), Number(recipeID), null, null, `created recipeTool with ID: ${newRecipeTool.recipeToolID}`);
    //increment recipe version and add a 'updatedRecipeVersion' log entry
    const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
    createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID3), String(recipe[0].version), String(newVersion), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion}`);

    //if status of existingRecipe is 'noTools', update status to 'noSteps'
    if (recipe[0].status === 'noTools') {
      const { error: updateError } = await db.from('recipes').update({ status: 'noSteps' }).eq('recipeID', recipeID);
      if (updateError) {
        global.logger.info(`Error updating recipe status: ${updateError}`);
        //rollback recipeTool creation
        const { error: rollbackError } = await db.from('recipeTools').delete().eq('recipeToolID', newRecipeTool.recipeToolID);
        if (rollbackError) {
          global.logger.info(`Error rolling back recipeTool: ${rollbackError}`);
          return { error: rollbackError };
        }
        return { error: updateError };
      }
      const logID4 = createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeID), null, 'noTools', 'noSteps', `updated recipe status from 'noTools' to 'noSteps'`);
      //increment recipe version and add a 'updatedRecipeVersion' log entry
      const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID4), String(recipe[0].version), String(newVersion), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion}`);
    }

    return {
      recipeToolID: newRecipeTool.recipeToolID,
      recipeID: newRecipeTool.recipeID,
      toolID: newRecipeTool.toolID,
      quantity: newRecipeTool.quantity,
    };
  }

  async function update(options) {
    const { authorization, recipeToolID, quantity } = options;

    //validate that provided recipeToolID exists
    const { data: recipeTool, error: recipeToolError } = await db.from('recipeTools').select().eq('recipeToolID', recipeToolID);
    if (recipeToolError) {
      global.logger.info(`Error validating recipeTool ID: ${recipeToolID}: ${recipeToolError}`);
      return { error: recipeToolError };
    }
    if (!recipeTool.length) {
      global.logger.info(`Provided recipeTool ID: ${recipeToolID} does not exist, cannot update recipeTool`);
      return { error: `Provided recipeTool ID: ${recipeToolID} does not exist, cannot update recipeTool` };
    }

    //validate that provided quantity is a positive integer
    if (quantity < 1) {
      global.logger.info(`Provided quantity: ${quantity} is not a positive integer, cannot update recipeTool`);
      return { error: `Provided quantity: ${quantity} is not a positive integer, cannot update recipeTool` };
    }

    //update recipeTool
    const updateFields = {};
    for (let key in options) {
      if (key !== 'recipeToolID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipeTool = await updater(options.userID, authorization, 'recipeToolID', recipeToolID, 'recipeTools', updateFields);
      return updatedRecipeTool;
    } catch (error) {
      global.logger.info(`Error updating recipeTool: ${error}`);
      return { error };
    }
  }

  async function deleteRecipeTool(options) {
    const { userID, authorization, recipeToolID } = options;
    //validate that provided recipeToolID exists
    const { data: recipeTool, error: recipeToolError } = await db.from('recipeTools').select().eq('recipeToolID', recipeToolID).eq('deleted', false);
    if (recipeToolError) {
      global.logger.info(`Error validating recipeTool ID: ${recipeToolID}: ${recipeToolError}`);
      return { error: recipeToolError };
    }
    if (!recipeTool.length) {
      global.logger.info(`Provided recipeTool ID: ${recipeToolID} does not exist, cannot delete recipeTool`);
      return { error: `Provided recipeTool ID: ${recipeToolID} does not exist, cannot delete recipeTool` };
    }

    //delete recipeTool
    const { error: deleteError } = await db.from('recipeTools').update({ deleted: true }).eq('recipeToolID', recipeToolID);
    if (deleteError) {
      global.logger.info(`Error deleting recipeTool: ${deleteError}`);
      return { error: deleteError };
    }

    //get current details of associated recipe
    const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', recipeTool[0].recipeID).single();
    if (recipeError) {
      global.logger.info(`Error getting associated recipe: ${recipeError}`);
      return { error: recipeError };
    }
    //add a 'deleted' log entry
    const logID1 = createRecipeLog(userID, authorization, 'deleteRecipeTool', Number(recipeToolID), Number(recipeTool[0].recipeID), null, null, `deleted recipeTool with ID: ${recipeToolID}`);
    //increment recipe version and add a 'updatedRecipeVersion' log entry
    const newVersion = await incrementVersion('recipes', 'recipeID', recipeTool[0].recipeID, recipe.version);
    createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeTool[0].recipeID), Number(logID1), String(recipe.version), String(newVersion), `updated version of recipe ID: ${recipeTool[0].recipeID} from ${recipe.version} to ${newVersion}`);

    //if existing recipe has no more recipeTools, set recipe status to 'noTools'
    const { data: recipeTools, error: recipeToolsError } = await db.from('recipeTools').select().eq('recipeID', recipeTool[0].recipeID).eq('deleted', false);
    if (recipeToolsError) {
      global.logger.info(`Error getting remaining recipeTools for recipe: ${recipeToolsError}`);
      return { error: recipeToolsError };
    }
    if (!recipeTools.length) {
      const { error: updateError } = await db.from('recipes').update({ status: 'noTools' }).eq('recipeID', recipeTool[0].recipeID);
      if (updateError) {
        global.logger.info(`Error updating recipe status: ${updateError}`);
        return { error: updateError };
      }
      //log recipe status update
      const logID2 = await createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeTool[0].recipeID), null, `${recipe.status}`, 'noTools', `updated recipe status from '${recipe.status}' to 'noTools'`);
      //increment recipe version and add a 'updatedRecipeVersion' log entry
      const newVersion = await incrementVersion('recipes', 'recipeID', recipeTool[0].recipeID, recipe.version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeTool[0].recipeID), Number(logID2), String(recipe.version), String(newVersion), `updated version of recipe ID: ${recipeTool[0].recipeID} from ${recipe.version} to ${newVersion}`);
    }

    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteRecipeTool,
  };
};
