('use strict');

const { updater, incrementVersion, getRecipeVersion } = require('../../../db');
const { createRecipeLog } = require('../../../services/dbLogger');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeToolIDs, recipeID, toolID } = options;

    try {
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
        throw errorGen(`*recipeTools-getAll* Error getting recipeTools: ${error}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*recipeTools-getAll* Error getting recipeTools: ${error}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return recipeTools;
    } catch (err) {
      throw errorGen(err.message || '*recipeTools-getAll* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeTools-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getByID(options) {
    const { recipeToolID } = options;

    try {
      const { data: recipeTool, error } = await db.from('recipeTools').select().eq('recipeToolID', recipeToolID).eq('deleted', false).single();

      if (error) {
        throw errorGen(`*recipeTools-getByID* Error getting recipeTool by ID: ${recipeToolID}: ${error}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*recipeTools-getByID* Got recipeTool ${recipeToolID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return recipeTool;
    } catch (err) {
      throw errorGen(err.message || '*recipeTools-getByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeTools-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, toolID, quantity } = options;

    try {
      //validate that provided recipeID exists
      const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', recipeID);
      if (recipeError) {
        throw errorGen(`*recipeTools-creat* Error validating recipe ID: ${recipeID}: ${recipeError}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipe.length) {
        throw errorGen(`*recipeTools-creat* Provided recipe ID: ${recipeID} does not exist, cannot create recipeTool`, 515, 'cannotComplete', false, 3);
      }

      //accept case of dummy recipeTool
      if (quantity === -1) {
        let dummyRecipeTool;
        //check for existing dummy recipeTool
        const { data: existingDummyRecipeTool, error: existingDummyRecipeToolError } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('quantity', -1);
        if (existingDummyRecipeToolError) {
          throw errorGen(`*recipeTools-creat* Error checking for existing dummy recipeTool: ${existingDummyRecipeToolError}`, 511, 'failSupabaseSelect', true, 3);
        }
        if (!existingDummyRecipeTool.length) {
          //create dummy recipeTool
          const { data: newDummyRecipeTool, error: newDummyRecipeToolError } = await db.from('recipeTools').insert({ recipeToolID: customID, userID, recipeID, quantity, version: 1 }).select().single();
          if (newDummyRecipeToolError) {
            throw errorGen(`*recipeTools-creat* Error creating dummy recipeTool: ${newDummyRecipeToolError}`, 512, 'failSupabaseInsert', true, 3);
          }
          dummyRecipeTool = newDummyRecipeTool;
        }
        if (!dummyRecipeTool) {
          dummyRecipeTool = existingDummyRecipeTool[0];
          //undelete dummy recipeTool if deleted, also reset version to 1
          const { error: undeleteError } = await db.from('recipeTools').update({ deleted: false, version: 1 }).eq('recipeToolID', dummyRecipeTool.recipeToolID);
          if (undeleteError) {
            throw errorGen(`*recipeTools-creat* Error undeleting dummy recipeTool: ${undeleteError}`, 513, 'failSupabaseUpdate', true, 3);
          }
        }
        //if status of existingRecipe is 'noTools', check whether there are any recipeSteps
        if (recipe[0].status === 'noTools') {
          const { data: recipeSteps, error: recipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('deleted', false);
          if (recipeStepsError) {
            throw errorGen(`*recipeTools-creat* Error getting recipeSteps for recipe: ${recipeStepsError}`, 511, 'failSupabaseSelect', true, 3);
          }
          //if there are any, update status to 'published'
          if (recipeSteps.length) {
            const { error: updateError } = await db.from('recipes').update({ status: 'published' }).eq('recipeID', recipeID);
            if (updateError) {
              throw errorGen(`*recipeTools-creat* Error updating recipe status: ${updateError}`, 513, 'failSupabaseUpdate', true, 3);
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
      }

      //validate that provided toolID exists
      const { data: tool, error: toolError } = await db.from('tools').select().eq('toolID', toolID);
      if (toolError) {
        throw errorGen(`*recipeTools-creat* Error validating tool ID: ${toolID}: ${toolError}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!tool.length) {
        throw errorGen(`*recipeTools-creat* Provided tool ID: ${toolID} does not exist, cannot create recipeTool`, 515, 'cannotComplete', false, 3);
      }

      //validate that provided quantity is a positive integer
      if (quantity < 1) {
        throw errorGen(`*recipeTools-creat* Provided quantity: ${quantity} is not a positive integer, cannot create recipeTool`, 510, 'dataValidationErr', false, 3);
      }

      //validate that recipeTool does not already exist
      const { data: recipeTool, error: recipeToolError } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('toolID', toolID).eq;
      if (recipeToolError) {
        throw errorGen(`*recipeTools-creat* Error checking for duplicate recipeTool: ${recipeToolError}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (recipeTool && recipeTool[0].deleted === false) {
        throw errorGen(`*recipeTools-creat* RecipeTool already exists, cannot create recipeTool`, 515, 'cannotComplete', false, 3);
      }
      if (recipeTool && recipeTool[0].deleted === true) {
        //undelete existing recipeTool
        const { data: undeletedRecipeTool, error: undeleteError } = await db.from('recipeTools').update({ deleted: false }).eq('recipeToolID', recipeTool[0].recipeToolID).select().single();
        if (undeleteError) {
          throw errorGen(`*recipeTools-creat* Error undeleting recipeTool: ${undeleteError}`, 513, 'failSupabaseUpdate', true, 3);
        }
        //add a 'created' log entry
        const logID6 = await createRecipeLog(userID, authorization, 'createRecipeTool', Number(undeletedRecipeTool.recipeToolID), Number(recipeID), null, null, `created recipeTool with ID: ${undeletedRecipeTool.recipeToolID}`);
        //increment recipe version and add a 'updatedRecipeVersion' log entry
        const newVersion6 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
        createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID6), String(recipe[0].version), String(newVersion6), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion6}`);
      }

      //create recipeTool
      const { data: newRecipeTool, error: newRecipeToolError } = await db.from('recipeTools').insert({ recipeToolID: customID, userID, recipeID, toolID, quantity, version: 1 }).select().single();
      if (newRecipeToolError) {
        throw errorGen(`*recipeTools-creat* Error creating recipeTool: ${newRecipeToolError}`, 512, 'failSupabaseInsert', true, 3);
      }

      //add a 'created' log entry
      const logID4 = await createRecipeLog(userID, authorization, 'createRecipeTool', Number(newRecipeTool.recipeToolID), Number(recipeID), null, null, `created recipeTool with ID: ${newRecipeTool.recipeToolID}`);
      //increment recipe version and add a 'updatedRecipeVersion' log entry
      const newVersion4 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID4), String(recipe[0].version), String(newVersion4), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion4}`);

      //if status of existingRecipe is 'noTools', check whether there are any recipeSteps
      if (recipe[0].status === 'noTools') {
        const { data: recipeSteps, error: recipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('deleted', false);
        if (recipeStepsError) {
          throw errorGen(`*recipeTools-creat* Error getting recipeSteps for recipe: ${recipeStepsError}`, 511, 'failSupabaseSelect', true, 3);
        }
        //if there are any, update status to 'published'
        if (recipeSteps.length) {
          const { error: updateError } = await db.from('recipes').update({ status: 'published' }).eq('recipeID', recipeID);
          if (updateError) {
            throw errorGen(`*recipeTools-creat* Error updating recipe status: ${updateError}`, 513, 'failSupabaseUpdate', true, 3);
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
            global.logger.info({ message: `*recipeTools-create* Error updating recipe status: ${updateError}, rolling back recipeTool create`, level: 3, timestamp: new Date().toISOString(), userID: userID });
            const { error: rollbackError } = await db.from('recipeTools').delete().eq('recipeToolID', newRecipeTool.recipeToolID);
            if (rollbackError) {
              throw errorGen(`*recipeTools-creat* Error rolling back recipeTool: ${rollbackError}`, 514, 'failSupabaseDelete', true, 3);
            }
            throw errorGen(`*recipeTools-creat* Error updating recipe status: ${updateError}, rolled back`, 513, 'failSupabaseUpdate', true, 3);
          }
          const logID5 = createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeID), null, 'noTools', 'noSteps', `updated recipe status from 'noTools' to 'noSteps'`);
          //increment recipe version and add a 'updatedRecipeVersion' log entry
          const newVersion5 = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
          createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID5), String(recipe[0].version), String(newVersion5), `updated recipe, ID: ${recipeID} from ${recipe[0].version} to ${newVersion5}`);
        }
      }

      return {
        recipeToolID: newRecipeTool.recipeToolID,
        recipeID: newRecipeTool.recipeID,
        toolID: newRecipeTool.toolID,
        quantity: newRecipeTool.quantity,
      };
    } catch (err) {
      throw errorGen(err.message || '*recipeTools-creat* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeTools-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    const { authorization, recipeToolID, quantity } = options;

    try {
      //validate that provided recipeToolID exists
      const { data: recipeTool, error: recipeToolError } = await db.from('recipeTools').select().eq('recipeToolID', recipeToolID);
      if (recipeToolError) {
        throw errorGen(`*recipeTools-update* Error validating recipeTool ID: ${recipeToolID}: ${recipeToolError}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipeTool.length) {
        throw errorGen(`*recipeTools-update* Provided recipeTool ID: ${recipeToolID} does not exist, cannot update recipeTool`, 515, 'cannotComplete', false, 3);
      }

      //validate that provided quantity is a positive integer
      if (quantity < 1) {
        throw errorGen(`*recipeTools-update* Provided quantity: ${quantity} is not a positive integer, cannot update recipeTool`, 510, 'dataValidationErr', false, 3);
      }

      //update recipeTool
      const updateFields = {};
      for (let key in options) {
        if (key !== 'recipeToolID' && options[key] !== undefined && key !== 'authorization') {
          updateFields[key] = options[key];
        }
      }
      const updatedRecipeTool = await updater(options.userID, authorization, 'recipeToolID', recipeToolID, 'recipeTools', updateFields);
      return updatedRecipeTool;
    } catch (err) {
      throw errorGen(err.message || '*recipeTools-update* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeTools-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteRecipeTool(options) {
    const { userID, authorization, recipeToolID } = options;

    try {
      //validate that provided recipeToolID exists
      const { data: recipeTool, error: recipeToolError } = await db.from('recipeTools').select().eq('recipeToolID', recipeToolID).eq('deleted', false);
      if (recipeToolError) {
        throw errorGen(`*recipeTools-deleteRecipeTool* Error validating recipeTool ID: ${recipeToolID}: ${recipeToolError}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (recipeTool.length === 0) {
        throw errorGen(`*recipeTools-deleteRecipeTool* Provided recipeTool ID: ${recipeToolID} does not exist, cannot delete recipeTool`, 515, 'cannotComplete', false, 3);
      }

      //delete recipeTool
      const { error: deleteError } = await db.from('recipeTools').update({ deleted: true }).eq('recipeToolID', recipeToolID);
      if (deleteError) {
        throw errorGen(`*recipeTools-deleteRecipeTool* Error deleting recipeTool: ${deleteError}`, 514, 'failSupabaseDelete', true, 3);
      }

      //get current details of associated recipe
      const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', recipeTool[0].recipeID);
      if (recipeError) {
        throw errorGen(`*recipeTools-deleteRecipeTool* Error getting associated recipe: ${recipeError}`, 511, 'failSupabaseSelect', true, 3);
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
        throw errorGen(`*recipeTools-deleteRecipeTool* Error getting remaining recipeTools for recipe: ${recipeToolsError}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipeTools.length) {
        const { error: updateError } = await db.from('recipes').update({ status: 'noTools' }).eq('recipeID', recipeTool[0].recipeID);
        if (updateError) {
          throw errorGen(`*recipeTools-deleteRecipeTool* Error updating recipe status: ${updateError}`, 513, 'failSupabaseUpdate', true, 3);
        }
        //log recipe status update
        const logID2 = await createRecipeLog(userID, authorization, 'updateRecipeStatus', Number(recipeTool[0].recipeID), null, `${recipe.status}`, 'noTools', `updated recipe status from '${recipe.status}' to 'noTools'`);
        //increment recipe version and add a 'updatedRecipeVersion' log entry
        const newVersion = await incrementVersion('recipes', 'recipeID', recipeTool[0].recipeID, recipe.version);
        createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeTool[0].recipeID), Number(logID2), String(recipe.version), String(newVersion), `updated version of recipe ID: ${recipeTool[0].recipeID} from ${recipe.version} to ${newVersion}`);
      }

      return { success: true };
    } catch (err) {
      throw errorGen(err.message || '*recipeTools-deleteRecipeTool* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeTools-deleteRecipeTool', err.isOperational || false, err.severity || 2);
    }
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
