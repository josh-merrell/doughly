('use strict');

const { updater } = require('../../db');
const axios = require('axios');
const { createKitchenLog, createRecipeLog } = require('../../services/dbLogger');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, toolIDs, name, brand } = options;
    let q = db.from('tools').select().filter('userID', 'eq', userID).eq('deleted', false).order('toolID', { ascending: true });
    if (toolIDs) {
      q = q.in('toolID', toolIDs);
    }
    if (name) {
      q = q.like('name', name);
    }
    if (brand) {
      q = q.like('brand', brand);
    }
    const { data: tools, error } = await q;

    if (error) {
      global.logger.error(`Error getting tools: ${error.message}`);
      throw errorGen('error getting tools', 400);
    }
    global.logger.info(`Got ${tools.length} tools`);
    return tools;
  }

  async function getByID(options) {
    const { toolID } = options;
    const { data: tool, error } = await db.from('tools').select().eq('toolID', toolID).eq('deleted', false);

    if (error) {
      global.logger.error(`Error getting tool: ${error.message}`);
      throw errorGen('error getting tool', 400);
    }
    global.logger.info(`Got tool`);
    return tool;
  }

  async function create(options) {
    const { customID, authorization, userID, name, brand } = options;

    //validate that the provided name is not already used by another tool
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('name', name).eq('userID', userID).filter('deleted', 'eq', false);
    if (existingToolError) {
      global.logger.error(`Error getting existing tools: ${existingToolError.message}`);
      throw errorGen('error getting existing tools', 400);
    }
    if (existingTool.length > 0) {
      global.logger.error(`Tool with name ${name} already exists`);
      throw errorGen(`Tool with name ${name} already exists`, 400);
    }

    //create the tool
    const { data: tool, error } = await db.from('tools').insert({ toolID: customID, userID, name, brand }).select('*').single();

    if (error) {
      global.logger.error(`Error creating tool: ${error.message}`);
      throw errorGen('error creating tool', 400);
    }

    //add a 'created' log entry
    createKitchenLog(userID, authorization, 'createTool', Number(tool.toolID), null, null, null, `Created Tool: ${name}`);

    return {
      toolID: tool.toolID,
      name: tool.name,
      brand: tool.brand,
    };
  }

  async function update(options) {
    const { userID, authorization, toolID, name } = options;

    //validate that the provided toolID exists
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID);
    if (existingToolError) {
      global.logger.error(`Error checking for existing tool: ${existingToolError.message}`);
      throw errorGen('error checking for existing tool', 400);
    }
    if (existingTool.length === 0) {
      global.logger.error(`Tool with ID ${toolID} does not exist, cannot update tool`);
      throw errorGen(`Tool with ID ${toolID} does not exist, cannot update tool`, 400);
    }

    //validate that the provided name is not already used by another tool
    const { data: existingTool2, error: existingToolError2 } = await db.from('tools').select().eq('name', name);
    if (existingToolError2) {
      global.logger.error(`Error checking for duplicated tool name: ${existingToolError2.message}`);
      throw errorGen('error checking for duplicated tool name', 400);
    }
    if (existingTool2.length) {
      global.logger.error(`Tool with name ${name} already exists`);
      throw errorGen(`Tool with name ${name} already exists`, 400);
    }

    //update the tool
    const updateFields = {};
    for (let key in options) {
      if (key !== 'toolID' && key !== 'authorization' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedTool = await updater(userID, authorization, 'toolID', toolID, 'tools', updateFields);
      return {
        toolID: updatedTool.toolID,
        name: updatedTool.name,
        brand: updatedTool.brand,
      };
    } catch (error) {
      global.logger.error(`Error updating tool: ${error.message}`);
      throw errorGen('error updating tool', 400);
    }
  }

  async function deleteTool(options) {
    const { userID, authorization, toolID } = options;

    //validate that the provided toolID exists
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID).eq('deleted', false);
    if (existingToolError) {
      global.logger.error(`Error checking for existing tool: ${existingToolError.message}`);
      throw errorGen('error checking for existing tool', 400);
    }
    if (!existingTool.length) {
      global.logger.error(`Tool with ID ${toolID} does not exist, cannot delete tool`);
      throw errorGen(`Tool with ID ${toolID} does not exist, cannot delete tool`, 400);
    }

    //get list of related recipeTools
    try {
      const { data: relatedRecipeTools, error: toolError } = await db.from('recipeTools').select().eq('toolID', toolID).eq('deleted', false);
      if (toolError) {
        global.logger.error(`Error getting related recipeTools for tool to delete: ${toolID} : ${toolError.message}`);
        throw errorGen(`Error getting related recipeTools for tool to delete: ${toolID} : ${toolError.message}`, 400);
      }

      //delete any associated recipeTools entries;
      for (let i = 0; i < relatedRecipeTools.length; i++) {
        const { data: recipeToolDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipeTools/${relatedRecipeTools[i].recipeToolID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeToolDeleteResult.error) {
          global.logger.error(`Error deleting recipeToolID: ${relatedRecipeTools[i].recipeToolID} prior to deleting tool ID: ${toolID} : ${recipeToolDeleteResult.error}`);
          throw errorGen(`Error deleting recipeToolID: ${relatedRecipeTools[i].recipeToolID} prior to deleting tool ID: ${toolID} : ${recipeToolDeleteResult.error}`, 400);
        }

        //add a 'deleted' log entry
        createRecipeLog(userID, authorization, 'deleteRecipeTool', Number(relatedRecipeTools[i].recipeToolID), Number(relatedRecipeTools[i].recipeID), null, null, `deleted recipeTool with ID: ${relatedRecipeTools[i].recipeToolID}`);
      }
    } catch (error) {
      global.logger.error(`Error deleting related recipeTools: ${error.message}`);
      throw errorGen(`Error deleting related recipeTools: ${error.message}`, 400);
    }

    //get list of related toolStocks
    try {
      const { data: relatedToolStocks, error: toolStockError } = await db.from('recipeTools').select().eq('toolID', toolID).eq('deleted', false);
      if (toolStockError) {
        global.logger.error(`Error getting related recipeTools for tool to delete: ${toolID} : ${toolStockError.message}`);
        throw errorGen(`Error getting related recipeTools for tool to delete: ${toolID} : ${toolStockError.message}`, 400);
      }

      //delete any associated toolStocks entries;
      for (let i = 0; i < relatedToolStocks.length; i++) {
        const { data: toolStockDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/toolStocks/${relatedToolStocks[i].recipeToolID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (toolStockDeleteResult.error) {
          global.logger.error(`Error deleting toolStockID: ${relatedToolStocks[i].toolStockID} prior to deleting tool ID: ${toolID} : ${toolStockDeleteResult.error}`);
          throw errorGen(`Error deleting toolStockID: ${relatedToolStocks[i].toolStockID} prior to deleting tool ID: ${toolID} : ${toolStockDeleteResult.error}`, 400);
        }

        //add a 'deleted' log entry
        createKitchenLog(userID, authorization, 'deleteToolStock', Number(relatedToolStocks[i].toolStockID), Number(relatedToolStocks[i].toolID), null, null, `deleted toolStock with ID: ${relatedToolStocks[i].toolStockID}`);
      }
    } catch (error) {
      global.logger.error(`Error deleting related toolStocks: ${error.message}`);
      throw errorGen(`Error deleting related toolStocks: ${error.message}`, 400);
    }

    //delete the tool
    const { error } = await db.from('tools').update({ deleted: true }).eq('toolID', toolID);

    if (error) {
      global.logger.error(`Error deleting tool: ${error.message}`);
      throw errorGen('error deleting tool', 400);
    }
    //add a 'deleted' log entry
    createKitchenLog(userID, authorization, 'deleteTool', Number(toolID), null, null, null, `Deleted Tool: ${existingTool[0].name}`);
    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteTool,
  };
};
