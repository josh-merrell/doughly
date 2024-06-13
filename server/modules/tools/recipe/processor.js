('use strict');

const { updater, incrementVersion, getRecipeVersion } = require('../../../db');
const { createRecipeLog } = require('../../../services/dbLogger');
const { errorGen } = require('../../../middleware/errorHandling');

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
      global.logger.error(`Error getting recipeTools: ${error}`);
      throw errorGen('error getting recipeTools', 400);
    }
    global.logger.info(`Got ${recipeTools.length} recipeTools`);
    return recipeTools;
  }

  async function getByID(options) {
    const { recipeToolID } = options;

    const { data: recipeTool, error } = await db.from('recipeTools').select().eq('recipeToolID', recipeToolID).eq('deleted', false).single();

    if (error) {
      global.logger.error(`Error getting recipeTool by ID: ${recipeToolID}: ${error}`);
      throw errorGen(`error getting recipeTool by ID: ${recipeToolID}`, 400);
    }
    global.logger.info(`Got recipeTool ${recipeToolID}`);
    return recipeTool;
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, toolID, quantity } = options;

    //validate that provided recipeID exists
    const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', recipeID);
    if (recipeError) {
      global.logger.error(`Error validating recipe ID: ${recipeID}: ${recipeError}`);
      throw errorGen(`Error validating recipe ID: ${recipeID}`, 400);
    }
    if (!recipe.length) {
      global.logger.error(`Provided recipe ID: ${recipeID} does not exist, cannot create recipeTool`);
      throw errorGen(`Provided recipe ID: ${recipeID} does not exist, cannot create recipeTool`, 400);
    }

    //accept case of dummy recipeTool
    if (quantity === -1) {
      let dummyRecipeTool;
      //check for existing dummy recipeTool
      const { data: existingDummyRecipeTool, error: existingDummyRecipeToolError } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('quantity', -1);
      if (existingDummyRecipeToolError) {
        global.logger.error(`Error checking for existing dummy recipeTool: ${existingDummyRecipeToolError}`);
        throw errorGen(`Error checking for existing dummy recipeTool: ${existingDummyRecipeToolError}`, 400);
      }
      if (!existingDummyRecipeTool.length) {
        //create dummy recipeTool
        const { data: newDummyRecipeTool, error: newDummyRecipeToolError } = await db.from('recipeTools').insert({ recipeToolID: customID, userID, recipeID, quantity, version: 1 }).select().single();
        if (newDummyRecipeToolError) {
          global.logger.error(`Error creating dummy recipeTool: ${newDummyRecipeToolError}`);
          throw errorGen(`Error creating dummy recipeTool: ${newDummyRecipeToolError}`, 400);
        }
        dummyRecipeTool = newDummyRecipeTool;
      }
      if (!dummyRecipeTool) {
        dummyRecipeTool = existingDummyRecipeTool[0];
        //undelete dummy recipeTool if deleted, also reset version to 1
        const { error: undeleteError } = await db.from('recipeTools').update({ deleted: false, version: 1 }).eq('recipeToolID', dummyRecipeTool.recipeToolID);
        if (undeleteError) {
          global.logger.error(`Error undeleting dummy recipeTool: ${undeleteError}`);
          throw errorGen(`Error undeleting dummy recipeTool: ${undeleteError}`, 400);
        }
      }
      //if status of existingRecipe is 'noTools', check whether there are any recipeSteps
      if (recipe[0].status === 'noTools') {
        const { data: recipeSteps, error: recipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('deleted', false);
        if (recipeStepsError) {
          global.logger.error(`Error getting recipeSteps for recipe: ${recipeStepsError}`);
          throw errorGen(`Error getting recipeSteps for recipe: ${recipeStepsError}`, 400);
        }
        //if there are any, update status to 'published'
        if (recipeSteps.length) {
          const { error: updateError } = await db.from('recipes').update({ status: 'published' }).eq('recipeID', recipeID);
          if (updateError) {
            global.logger.error(`Error updating recipe status: ${updateError}`);
            throw errorGen(`Error updating recipe status: ${updateError}`, 400);
          }
          //log recipe status update
          const logID1 = await createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeID), null, 'noTools', 'published', `updated recipe status from 'noTools' to 'published'`);
          //increment recipe version and add a 'updatedRecipeVersion' log entry
          const newVersion1 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
          createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID1), String(recipe[0].version), String(newVersion1), `updated recipe, ID: ${recipeID} to version: ${newVersion1}`);
        } else {
          await db.from('recipes').update({ status: 'noSteps' }).eq('recipeID', recipeID);
          //log recipe status update
          const logID2 = await createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeID), null, 'noTools', 'noSteps', `updated recipe status from 'noTools' to 'noSteps'`);
          //increment recipe version and add a 'updatedRecipeVersion' log entry
          const newVersion2 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
          createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID2), String(recipe[0].version), String(newVersion2), `updated recipe, ID: ${recipeID} to version: ${newVersion2}`);
        }
      }
      //log dummy recipeTool creation
      const logID3 = await createRecipeLog(userID, authorization, 'createDummyRecipeTool', Number(dummyRecipeTool.recipeToolID), Number(recipeID), null, null, `created dummy recipeTool with ID: ${dummyRecipeTool.recipeToolID}`);
      try {
        //increment recipe version and add a 'updatedRecipeVersion' log entry
        const newVersion3 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
        createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID3), String(recipe[0].version), String(newVersion3), `Updated Recipe, ID: ${recipeID} to version: ${newVersion3}`);
        return {
          recipeToolID: dummyRecipeTool.recipeToolID,
          recipeID: dummyRecipeTool.recipeID,
          toolID: -1,
          quantity: dummyRecipeTool.quantity,
          version: 1,
        };
      } catch (error) {
        global.logger.error(`Error incrementing recipe version: ${error}`);
        throw errorGen(`Error incrementing recipe version: ${error}`, 400);
      }
    }

    //validate that provided toolID exists
    const { data: tool, error: toolError } = await db.from('tools').select().eq('toolID', toolID);
    if (toolError) {
      global.logger.error(`Error validating tool ID: ${toolID}: ${toolError}`);
      throw errorGen(`Error validating tool ID: ${toolID}`, 400);
    }
    if (!tool.length) {
      global.logger.error(`Provided tool ID: ${toolID} does not exist, cannot create recipeTool`);
      throw errorGen(`Provided tool ID: ${toolID} does not exist, cannot create recipeTool`, 400);
    }

    //validate that provided quantity is a positive integer
    if (quantity < 1) {
      global.logger.error(`Provided quantity: ${quantity} is not a positive integer, cannot create recipeTool`);
      throw errorGen(`Provided quantity: ${quantity} is not a positive integer, cannot create recipeTool`, 400);
    }

    //validate that recipeTool does not already exist
    const { data: recipeTool, error: recipeToolError } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('toolID', toolID).eq;
    if (recipeToolError) {
      global.logger.error(`Error checking for duplicate recipeTool: ${recipeToolError}`);
      throw errorGen(`Error checking for duplicate recipeTool: ${recipeToolError}`, 400);
    }
    if (recipeTool && recipeTool[0].deleted === false) {
      global.logger.error(`RecipeTool already exists, cannot create recipeTool`);
      throw errorGen(`RecipeTool already exists, cannot create recipeTool`, 400);
    }
    if (recipeTool && recipeTool[0].deleted === true) {
      //undelete existing recipeTool
      const { data: undeletedRecipeTool, error: undeleteError } = await db.from('recipeTools').update({ deleted: false }).eq('recipeToolID', recipeTool[0].recipeToolID).select().single();
      if (undeleteError) {
        global.logger.error(`Error undeleting recipeTool: ${undeleteError}`);
        throw errorGen(`Error undeleting recipeTool: ${undeleteError}`, 400);
      }
      //add a 'created' log entry
      const logID6 = await createRecipeLog(userID, authorization, 'createRecipeTool', Number(undeletedRecipeTool.recipeToolID), Number(recipeID), null, null, `created recipeTool with ID: ${undeletedRecipeTool.recipeToolID}`);
      //increment recipe version and add a 'updatedRecipeVersion' log entry
      try {
        const newVersion6 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
        createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID6), String(recipe[0].version), String(newVersion6), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion6}`);
      } catch (error) {
        global.logger.error(`Error incrementing recipe version: ${error}`);
        throw errorGen(`Error incrementing recipe version: ${error}`, 400);
      }
    }

    //create recipeTool
    const { data: newRecipeTool, error: newRecipeToolError } = await db.from('recipeTools').insert({ recipeToolID: customID, userID, recipeID, toolID, quantity, version: 1 }).select().single();
    if (newRecipeToolError) {
      global.logger.error(`Error creating recipeTool: ${newRecipeToolError}`);
      throw errorGen(`Error creating recipeTool: ${newRecipeToolError}`, 400);
    }

    //add a 'created' log entry
    const logID4 = await createRecipeLog(userID, authorization, 'createRecipeTool', Number(newRecipeTool.recipeToolID), Number(recipeID), null, null, `created recipeTool with ID: ${newRecipeTool.recipeToolID}`);
    try {
      //increment recipe version and add a 'updatedRecipeVersion' log entry
      const newVersion4 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID4), String(recipe[0].version), String(newVersion4), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion4}`);
    } catch (error) {
      global.logger.error(`Error incrementing recipe version: ${error}`);
      throw errorGen(`Error incrementing recipe version: ${error}`, 400);
    }

    //if status of existingRecipe is 'noTools', check whether there are any recipeSteps
    if (recipe[0].status === 'noTools') {
      const { data: recipeSteps, error: recipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('deleted', false);
      if (recipeStepsError) {
        global.logger.error(`Error getting recipeSteps for recipe: ${recipeStepsError}`);
        throw errorGen(`Error getting recipeSteps for recipe: ${recipeStepsError}`, 400);
      }
      //if there are any, update status to 'published'
      if (recipeSteps.length) {
        const { error: updateError } = await db.from('recipes').update({ status: 'published' }).eq('recipeID', recipeID);
        if (updateError) {
          global.logger.error(`Error updating recipe status: ${updateError}`);
          throw errorGen(`Error updating recipe status: ${updateError}`, 400);
        }
        //log recipe status update
        const logID5 = await createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeID), null, 'noTools', 'published', `updated recipe status from 'noTools' to 'published'`);
        //increment recipe version and add a 'updatedRecipeVersion' log entry
        const newVersion5 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
        createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID5), String(recipe[0].version), String(newVersion5), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion5}`);
      } else {
        // if there are no recipeSteps, update status to 'noSteps'
        const { error: updateError } = await db.from('recipes').update({ status: 'noSteps' }).eq('recipeID', recipeID);
        if (updateError) {
          global.logger.error(`Error updating recipe status: ${updateError}`);
          const { error: rollbackError } = await db.from('recipeTools').delete().eq('recipeToolID', newRecipeTool.recipeToolID);
          if (rollbackError) {
            global.logger.error(`Error rolling back recipeTool: ${rollbackError}`);
            throw errorGen(`Error rolling back recipeTool: ${rollbackError}`, 400);
          }
          throw errorGen(`Error updating recipe status: ${updateError}`, 400);
        }
        const logID5 = createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeID), null, 'noTools', 'noSteps', `updated recipe status from 'noTools' to 'noSteps'`);
        try {
          //increment recipe version and add a 'updatedRecipeVersion' log entry
          const newVersion5 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
          createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID5), String(recipe[0].version), String(newVersion5), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion5}`);
        } catch (error) {
          global.logger.error(`Error incrementing recipe version: ${error}`);
          throw errorGen(`Error incrementing recipe version: ${error}`, 400);
        }
      }
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
      global.logger.error(`Error validating recipeTool ID: ${recipeToolID}: ${recipeToolError}`);
      throw errorGen(`Error validating recipeTool ID: ${recipeToolID}`, 400);
    }
    if (!recipeTool.length) {
      global.logger.error(`Provided recipeTool ID: ${recipeToolID} does not exist, cannot update recipeTool`);
      throw errorGen(`Provided recipeTool ID: ${recipeToolID} does not exist, cannot update recipeTool`, 400);
    }

    //validate that provided quantity is a positive integer
    if (quantity < 1) {
      global.logger.error(`Provided quantity: ${quantity} is not a positive integer, cannot update recipeTool`);
      throw errorGen(`Provided quantity: ${quantity} is not a positive integer, cannot update recipeTool`, 400);
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
      global.logger.error(`Error updating recipeTool: ${error}`);
      throw errorGen(`Error updating recipeTool: ${error}`, 400);
    }
  }

  async function deleteRecipeTool(options) {
    const { userID, authorization, recipeToolID } = options;
    //validate that provided recipeToolID exists
    const { data: recipeTool, error: recipeToolError } = await db.from('recipeTools').select().eq('recipeToolID', recipeToolID).eq('deleted', false);
    if (recipeToolError) {
      global.logger.error(`Error validating recipeTool ID: ${recipeToolID}: ${recipeToolError}`);
      throw errorGen(`Error validating recipeTool ID: ${recipeToolID}`, 400);
    }
    if (recipeTool.length === 0) {
      global.logger.error(`Provided recipeTool ID: ${recipeToolID} does not exist, cannot delete recipeTool`);
      throw errorGen(`Provided recipeTool ID: ${recipeToolID} does not exist, cannot delete recipeTool`, 400);
    }

    //delete recipeTool
    const { error: deleteError } = await db.from('recipeTools').update({ deleted: true }).eq('recipeToolID', recipeToolID);
    if (deleteError) {
      global.logger.error(`Error deleting recipeTool: ${deleteError}`);
      throw errorGen(`Error deleting recipeTool: ${deleteError}`, 400);
    }

    //get current details of associated recipe
    const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', recipeTool[0].recipeID);
    if (recipeError) {
      global.logger.error(`Error getting associated recipe: ${recipeError}`);
      throw errorGen(`Error getting associated recipe: ${recipeError}`, 400);
    }
    //add a 'deleted' log entry
    const logID1 = createRecipeLog(userID, authorization, 'deleteRecipeTool', Number(recipeToolID), Number(recipeTool[0].recipeID), null, null, `deleted recipeTool with ID: ${recipeToolID}`);
    //increment recipe version and add a 'updatedRecipeVersion' log entry
    const recipeVersion = await getRecipeVersion(recipeTool[0].recipeID);
    const newVersion = await incrementVersion('recipes', 'recipeID', recipeTool[0].recipeID, recipeVersion);
    createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeTool[0].recipeID), Number(logID1), String(recipe.version), String(newVersion), `updated version of recipe ID: ${recipeTool[0].recipeID} from ${recipe.version} to ${newVersion}`);

    //if existing recipe has no more recipeTools, set recipe status to 'noTools'
    const { data: recipeTools, error: recipeToolsError } = await db.from('recipeTools').select().eq('recipeID', recipeTool[0].recipeID).eq('deleted', false);
    if (recipeToolsError) {
      global.logger.error(`Error getting remaining recipeTools for recipe: ${recipeToolsError}`);
      throw errorGen(`Error getting remaining recipeTools for recipe: ${recipeToolsError}`, 400);
    }
    if (!recipeTools.length) {
      const { error: updateError } = await db.from('recipes').update({ status: 'noTools' }).eq('recipeID', recipeTool[0].recipeID);
      if (updateError) {
        global.logger.error(`Error updating recipe status: ${updateError}`);
        throw errorGen(`Error updating recipe status: ${updateError}`, 400);
      }
      //log recipe status update
      const logID2 = await createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeTool[0].recipeID), null, `${recipe.status}`, 'noTools', `updated recipe status from '${recipe.status}' to 'noTools'`);
      try {
        //increment recipe version and add a 'updatedRecipeVersion' log entry
        const newVersion = await incrementVersion('recipes', 'recipeID', recipeTool[0].recipeID, recipe.version);
        createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeTool[0].recipeID), Number(logID2), String(recipe.version), String(newVersion), `updated version of recipe ID: ${recipeTool[0].recipeID} from ${recipe.version} to ${newVersion}`);
      } catch (error) {
        global.logger.error(`Error incrementing recipe version: ${error}`);
        throw errorGen(`Error incrementing recipe version: ${error}`, 400);
      }
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
