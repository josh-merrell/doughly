('use strict');

const { updater } = require('../../../db');

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
    const { userID, recipeID, toolID, quantity } = options;
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
    const { data: newRecipeTool, error: newRecipeToolError } = await db.from('recipeTools').insert({ userID, recipeID, toolID, quantity }).select().single();

    if (newRecipeToolError) {
      global.logger.info(`Error creating recipeTool: ${newRecipeToolError}`);
      return { error: newRecipeToolError };
    }

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
    }

    global.logger.info(`Created recipeTool ${newRecipeTool.recipeToolID}`);
    return {
      recipeToolID: newRecipeTool.recipeToolID,
      recipeID: newRecipeTool.recipeID,
      toolID: newRecipeTool.toolID,
      quantity: newRecipeTool.quantity,
    };
  }

  async function update(options) {
    const { recipeToolID, quantity } = options;

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
      if (key !== 'recipeToolID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipeTool = await updater('recipeToolID', recipeToolID, 'recipeTools', updateFields);
      global.logger.info(`Updated recipeTool ${recipeToolID}`);
      return updatedRecipeTool;
    } catch (error) {
      global.logger.info(`Error updating recipeTool: ${error}`);
      return { error };
    }
  }

  async function deleteRecipeStep(options) {
    const { recipeToolID } = options;
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
    global.logger.info(`Deleted recipeTool ${recipeToolID}`);

    //if existingRecipe has no more recipeTools, update status to 'noTools'
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
      global.logger.info(`Recipe now has no recipeTools, Updated recipe status to 'noTools'`);
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
    delete: deleteRecipeStep,
  };
};
