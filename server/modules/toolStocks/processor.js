('use strict');

const { updater } = require('../../db');
const { createKitchenLog } = require('../../services/dbLogger');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, toolStockIDs, toolID, purchasedBy } = options;
    let q = db.from('toolStocks').select().filter('userID', 'eq', userID).eq('deleted', false).order('toolStockID', { ascending: true });
    if (toolStockIDs) {
      q = q.in('toolStockID', toolStockIDs);
    }
    if (toolID) {
      q = q.filter('toolID', 'eq', toolID);
    }
    if (purchasedBy) {
      q = q.filter('purchasedBy', 'eq', purchasedBy);
    }

    const { data: toolStocks, error } = await q;

    if (error) {
      global.logger.info(`Error getting toolStocks: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${toolStocks.length} toolStocks`);
    return toolStocks;
  }

  async function getByID(options) {
    const { toolStockID } = options;
    const { data: toolStock, error } = await db.from('toolStocks').select().eq('toolStockID', toolStockID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting toolStock: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got toolStock ID: ${toolStockID}`);
    return toolStock;
  }

  async function create(options) {
    const { customID, authorization, userID, toolID, purchasedBy, purchaseDate } = options;

    //validate that the provided toolID is valid
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID);
    if (existingToolError) {
      global.logger.info(`Error validating tool ID: ${toolID}: ${existingToolError.message}`);
      return { error: existingToolError.message };
    }
    if (existingTool.length === 0) {
      global.logger.info(`Tool ID ${toolID} does not exist, cannot create toolStock`);
      return { error: `Tool ID ${toolID} does not exist, cannot create toolStock` };
    }

    const { data: toolStock, error } = await db.from('toolStocks').insert({ toolStockID: customID, userID, toolID, purchasedBy, purchaseDate }).select('toolStockID').single();
    if (error) {
      global.logger.info(`Error creating toolStock: ${error.message}`);
      return { error: error.message };
    }
    createKitchenLog(userID, authorization, 'createToolStock', Number(toolStock.toolStockID), Number(toolID), null, null, `created toolStock with ID: ${toolStock.toolStockID}`);
    return {
      toolStockID: toolStock.toolStockID,
      toolID: toolID,
      purchasedBy: purchasedBy,
      purchaseDate: purchaseDate,
    };
  }

  async function update(options) {
    const { userID, authorization, toolStockID } = options;

    //validate that the provided toolStockID exists
    const { data: existingToolStock, error: existingToolStockError } = await db.from('toolStocks').select().eq('toolStockID', toolStockID);
    if (existingToolStockError) {
      global.logger.info(`Error validating toolStock ID: ${toolStockID}: ${existingToolStockError.message}`);
      return { error: existingToolStockError.message };
    }
    if (existingToolStock.length === 0) {
      global.logger.info(`ToolStock ID ${toolStockID} does not exist, cannot update toolStock`);
      return { error: `ToolStock ID ${toolStockID} does not exist, cannot update toolStock` };
    }

    //update toolStock
    const updateFields = {};
    for (let key in options) {
      if (key !== 'toolStockID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedToolStock = await updater(userID, authorization, 'toolStockID', toolStockID, 'toolStocks', updateFields);
      return updatedToolStock;
    } catch (error) {
      global.logger.info(`Error updating toolStock ID: ${toolStockID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteToolStock(options) {
    const { userID, authorization, toolStockID } = options;

    //validate that the provided toolStockID exists
    const { data: existingToolStock, error: existingToolStockError } = await db.from('toolStocks').select().eq('toolStockID', toolStockID).eq('deleted', false);
    if (existingToolStockError) {
      global.logger.info(`Error validating toolStock ID: ${toolStockID}: ${existingToolStockError.message}`);
      return { error: existingToolStockError.message };
    }
    if (existingToolStock.length === 0) {
      global.logger.info(`ToolStock ID ${toolStockID} does not exist, cannot delete toolStock`);
      return { error: `ToolStock ID ${toolStockID} does not exist, cannot delete toolStock` };
    }

    //delete toolStock
    const { error } = await db.from('toolStocks').update({ deleted: true }).eq('toolStockID', toolStockID);

    if (error) {
      global.logger.info(`Error deleting toolStock ID: ${toolStockID}: ${error.message}`);
      return { error: error.message };
    }

    //add a 'deleted' log entry
    createKitchenLog(userID, authorization, 'deleteToolStock', Number(toolStockID), Number(existingToolStock[0].toolID), null, null, `deleted toolStock with ID: ${toolStockID}`);
    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteToolStock,
  };
};
