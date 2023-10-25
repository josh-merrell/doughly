('use strict');

const { updater } = require('../../db');
const axios = require('axios');
const { createKitchenLog, createRecipeLog } = require('../../services/dbLogger');

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
      global.logger.info(`Error getting tools: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${tools.length} tools`);
    return tools;
  }

  async function getByID(options) {
    const { toolID } = options;
    const { data: tool, error } = await db.from('tools').select().eq('toolID', toolID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting tool: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got tool`);
    return tool;
  }

  async function create(options) {
    const { customID, authorization, userID, name, brand } = options;

    //validate that the provided name is not already used by another tool
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('name', name).filter('deleted', 'eq', false);
    if (existingToolError) {
      global.logger.info(`Error getting existing tools: ${existingToolError.message}`);
      return { error: existingToolError.message };
    }
    if (existingTool.length > 0) {
      global.logger.info(`Tool with name ${name} already exists`);
      return { error: `Tool with name ${name} already exists` };
    }

    //create the tool
    const { data: tool, error } = await db.from('tools').insert({ toolID: customID, userID, name, brand }).select('*').single();

    if (error) {
      global.logger.info(`Error creating tool: ${error.message}`);
      return { error: error.message };
    }

    //add a 'created' log entry
    createKitchenLog(userID, authorization, 'createTool', tool.toolID, null, null, null, `created tool with ID: ${tool.toolID}`);

    global.logger.info(`Created tool ID ${tool.toolID}`);
    return {
      toolID: tool.toolID,
      name: tool.name,
      brand: tool.brand,
    };
  }

  async function update(options) {
    const { toolID, name } = options;

    //validate that the provided toolID exists
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID);
    if (existingToolError) {
      global.logger.info(`Error checking for existing tool: ${existingToolError.message}`);
      return { error: existingToolError.message };
    }
    if (existingTool.length === 0) {
      global.logger.info(`Tool with ID ${toolID} does not exist, cannot update tool`);
      return { error: `Tool with ID ${toolID} does not exist, cannot update tool` };
    }

    //validate that the provided name is not already used by another tool
    const { data: existingTool2, error: existingToolError2 } = await db.from('tools').select().eq('name', name);
    if (existingToolError2) {
      global.logger.info(`Error checking for duplicated tool name: ${existingToolError2.message}`);
      return { error: existingToolError2.message };
    }
    if (existingTool2.length) {
      global.logger.info(`Tool with name ${name} already exists`);
      return { error: `Tool with name ${name} already exists` };
    }

    //update the tool
    const updateFields = {};
    for (let key in options) {
      if (key !== 'toolID') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedTool = await updater('toolID', toolID, 'tools', updateFields);
      global.logger.info(`Updated tool ID ${toolID}`);
      return {
        toolID: updatedTool.toolID,
        name: updatedTool.name,
        brand: updatedTool.brand,
      };
    } catch (error) {
      global.logger.info(`Error updating tool: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteTool(options) {
    const { userID, authorization, toolID } = options;

    //validate that the provided toolID exists
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID).eq('deleted', false);
    if (existingToolError) {
      global.logger.info(`Error checking for existing tool: ${existingToolError.message}`);
      return { error: existingToolError.message };
    }
    if (!existingTool.length) {
      global.logger.info(`Tool with ID ${toolID} does not exist, cannot delete tool`);
      return { error: `Tool with ID ${toolID} does not exist, cannot delete tool` };
    }

    //get list of related recipeTools
    try {
      const { data: relatedRecipeTools, error: toolError } = await db.from('recipeTools').select().eq('toolID', toolID).eq('deleted', false);
      if (toolError) {
        global.logger.info(`Error getting related recipeTools for tool to delete: ${toolID} : ${toolError.message}`);
        return { error: toolError.message };
      }

      //delete any associated recipeTools entries;
      for (let i = 0; i < relatedRecipeTools.length; i++) {
        const { data: recipeToolDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipeTools/${relatedRecipeTools[i].recipeToolID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeToolDeleteResult.error) {
          global.logger.info(`Error deleting recipeToolID: ${relatedRecipeTools[i].recipeToolID} prior to deleting tool ID: ${toolID} : ${recipeToolDeleteResult.error}`);
          return { error: recipeToolDeleteResult.error };
        }

        //add a 'deleted' log entry
        createRecipeLog(userID, authorization, 'deletedRecipeTool', Number(relatedRecipeTools[i].recipeToolID), Number(relatedRecipeTools[i].recipeID), null, null, `deleted recipeTool with ID: ${relatedRecipeTools[i].recipeToolID}`);
      }
    } catch (error) {
      global.logger.info(`Error deleting related recipeTools: ${error.message}`);
      return { error: error.message };
    }

    //get list of related toolStocks
    try {
      const { data: relatedToolStocks, error: toolStockError } = await db.from('recipeTools').select().eq('toolID', toolID).eq('deleted', false);
      if (toolStockError) {
        global.logger.info(`Error getting related recipeTools for tool to delete: ${toolID} : ${toolStockError.message}`);
        return { error: toolStockError.message };
      }

      //delete any associated toolStocks entries;
      for (let i = 0; i < relatedToolStocks.length; i++) {
        const { data: toolStockDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/toolStocks/${relatedToolStocks[i].recipeToolID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (toolStockDeleteResult.error) {
          global.logger.info(`Error deleting toolStockID: ${relatedToolStocks[i].toolStockID} prior to deleting tool ID: ${toolID} : ${toolStockDeleteResult.error}`);
          return { error: toolStockDeleteResult.error };
        }

        //add a 'deleted' log entry
        createKitchenLog(userID, authorization, 'deleteToolStock', Number(relatedToolStocks[i].toolStockID), Number(relatedToolStocks[i].toolID), null, null, `deleted toolStock with ID: ${relatedToolStocks[i].toolStockID}`);
      }
    } catch (error) {
      global.logger.info(`Error deleting related toolStocks: ${error.message}`);
      return { error: error.message };
    }

    //delete the tool
    const { error } = await db.from('tools').update({ deleted: true }).eq('toolID', toolID);

    if (error) {
      global.logger.info(`Error deleting tool: ${error.message}`);
      return { error: error.message };
    }
    //add a 'deleted' log entry
    createKitchenLog(userID, authorization, 'deleteTool', Number(toolID), null, null, null, `deleted tool with ID: ${toolID}`);

    global.logger.info(`Deleted tool ID ${toolID}`);
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
