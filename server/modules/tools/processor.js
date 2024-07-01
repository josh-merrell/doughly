('use strict');

const { updater } = require('../../db');
const axios = require('axios');
const { createKitchenLog, createRecipeLog } = require('../../services/dbLogger');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, toolIDs, name, brand } = options;

    try {
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
        throw errorGen(`Error getting tools: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got ${tools.length} tools`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // return tools;
      // return tools and add one dummy tool
      return [...tools, { toolID: 999999, name: 'dummy', brand: 'dummy' }];
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in tools getAll', err.code || 520, err.name || 'unhandledError_tools-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getByID(options) {
    const { toolID, userID } = options;

    try {
      const { data: tool, error } = await db.from('tools').select().eq('toolID', toolID).eq('deleted', false);

      if (error) {
        throw errorGen(`Error getting tool: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got tool`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      return tool;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in tools getByID', err.code || 520, err.name || 'unhandledError_tools-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, name, brand } = options;

    try {
      //validate that the provided name is not already used by another tool
      const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('name', name).eq('userID', userID).filter('deleted', 'eq', false);
      if (existingToolError) {
        throw errorGen(`Error getting existing tools: ${existingToolError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingTool.length > 0) {
        throw errorGen(`Tool with name ${name} already exists, cannot create tool`, 515, 'cannotComplete', false, 3);
      }

      //create the tool
      const { data: tool, error } = await db.from('tools').insert({ toolID: customID, userID, name, brand }).select('*').single();

      if (error) {
        throw errorGen(`Error creating tool: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }

      //add a 'created' log entry
      createKitchenLog(userID, authorization, 'createTool', Number(tool.toolID), null, null, null, `Created Tool: ${name}`);

      return {
        toolID: tool.toolID,
        name: tool.name,
        brand: tool.brand,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in tools create', err.code || 520, err.name || 'unhandledError_tools-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    const { userID, authorization, toolID, name } = options;

    try {
      //validate that the provided toolID exists
      const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID);
      if (existingToolError) {
        throw errorGen(`Error checking for existing tool: ${existingToolError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingTool.length === 0) {
        throw errorGen(`Tool with ID ${toolID} does not exist, cannot update tool`, 515, 'cannotComplete', false, 3);
      }

      //validate that the provided name is not already used by another tool
      const { data: existingTool2, error: existingToolError2 } = await db.from('tools').select().eq('name', name);
      if (existingToolError2) {
        throw errorGen(`Error checking for duplicated tool name: ${existingToolError2.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingTool2.length) {
        throw errorGen(`Tool with name ${name} already exists, cannot create tool`, 515, 'cannotComplete', false, 3);
      }

      //update the tool
      const updateFields = {};
      for (let key in options) {
        if (key !== 'toolID' && key !== 'authorization' && options[key] !== undefined) {
          updateFields[key] = options[key];
        }
      }
      const updatedTool = await updater(userID, authorization, 'toolID', toolID, 'tools', updateFields);
      return {
        toolID: updatedTool.toolID,
        name: updatedTool.name,
        brand: updatedTool.brand,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in tools update', err.code || 520, err.name || 'unhandledError_tools-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteTool(options) {
    const { userID, authorization, toolID } = options;

    try {
      //validate that the provided toolID exists
      const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID).eq('deleted', false);
      if (existingToolError) {
        throw errorGen(`Error checking for existing tool: ${existingToolError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!existingTool.length) {
        throw errorGen(`Tool with ID ${toolID} does not exist, cannot delete tool`, 515, 'cannotComplete', false, 3);
      }

      //get list of related recipeTools
      const { data: relatedRecipeTools, error: toolError } = await db.from('recipeTools').select().eq('toolID', toolID).eq('deleted', false);
      if (toolError) {
        throw errorGen(`Error getting related recipeTools for tool to delete: ${toolID} : ${toolError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      //delete any associated recipeTools entries;
      for (let i = 0; i < relatedRecipeTools.length; i++) {
        const { data: recipeToolDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipeTools/${relatedRecipeTools[i].recipeToolID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeToolDeleteResult.error) {
          throw errorGen(`Error deleting recipeToolID: ${relatedRecipeTools[i].recipeToolID} prior to deleting tool ID: ${toolID} : ${recipeToolDeleteResult.error}`, 514, 'failSupabaseDelete', true, 3);
        }

        //add a 'deleted' log entry
        createRecipeLog(userID, authorization, 'deleteRecipeTool', Number(relatedRecipeTools[i].recipeToolID), Number(relatedRecipeTools[i].recipeID), null, null, `deleted recipeTool with ID: ${relatedRecipeTools[i].recipeToolID}`);
      }

      //get list of related toolStocks
      const { data: relatedToolStocks, error: toolStockError } = await db.from('recipeTools').select().eq('toolID', toolID).eq('deleted', false);
      if (toolStockError) {
        throw errorGen(`Error getting related recipeTools for tool to delete: ${toolID} : ${toolStockError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      //delete any associated toolStocks entries;
      for (let i = 0; i < relatedToolStocks.length; i++) {
        const { data: toolStockDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/toolStocks/${relatedToolStocks[i].recipeToolID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (toolStockDeleteResult.error) {
          throw errorGen(`Error deleting toolStockID: ${relatedToolStocks[i].toolStockID} prior to deleting tool ID: ${toolID} : ${toolStockDeleteResult.error}`, 514, 'failSupabaseDelete', true, 3);
        }

        //add a 'deleted' log entry
        createKitchenLog(userID, authorization, 'deleteToolStock', Number(relatedToolStocks[i].toolStockID), Number(relatedToolStocks[i].toolID), null, null, `deleted toolStock with ID: ${relatedToolStocks[i].toolStockID}`);
      }

      //delete the tool
      const { error } = await db.from('tools').update({ deleted: true }).eq('toolID', toolID);

      if (error) {
        throw errorGen(`Error deleting tool: ${error.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      //add a 'deleted' log entry
      createKitchenLog(userID, authorization, 'deleteTool', Number(toolID), null, null, null, `Deleted Tool: ${existingTool[0].name}`);
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in tools deleteTool', err.code || 520, err.name || 'unhandledError_tools-deleteTool', err.isOperational || false, err.severity || 2);
    }
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
