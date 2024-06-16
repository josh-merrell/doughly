('use strict');

const { updater } = require('../../db');
const { createKitchenLog } = require('../../services/dbLogger');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, toolStockIDs, toolID, purchasedBy } = options;

    try {
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
        global.logger.error(`Error getting toolStocks: ${error.message}`);
        throw errorGen('Error getting toolStocks', 400);
      }
      global.logger.info(`Got ${toolStocks.length} toolStocks`);
      return toolStocks;
    } catch (err) {
      throw errorGen('Unhandled Error in toolStocks getAll', 520, 'unhandledError_toolStocks-getAll', false, 2); //message, code, name, operational, severity
    }
  }

  async function getByID(options) {
    const { toolStockID } = options;

    try {
      const { data: toolStock, error } = await db.from('toolStocks').select().eq('toolStockID', toolStockID).eq('deleted', false);

      if (error) {
        global.logger.error(`Error getting toolStock: ${error.message}`);
        throw errorGen('Error getting toolStock', 400);
      }
      global.logger.info(`Got toolStock ID: ${toolStockID}`);
      return toolStock;
    } catch (err) {
      throw errorGen('Unhandled Error in toolStocks getByID', 520, 'unhandledError_toolStocks-getByID', false, 2); //message, code, name, operational, severity
    }
  }

  async function create(options) {
    const { customID, authorization, userID, toolID, quantity = 1 } = options;

    try {
      //validate that the provided quantity is valid integer
      if (quantity < 1 || !Number.isInteger(quantity)) {
        global.logger.error(`Invalid quantity for new Tool Stock: ${quantity}`);
        throw errorGen(`Invalid quantity for new Tool Stock: ${quantity}`, 400);
      }

      //validate that the provided toolID is valid
      const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID);
      if (existingToolError) {
        global.logger.error(`Error validating tool ID: ${toolID}: ${existingToolError.message}`);
        throw errorGen(`Error validating tool ID: ${toolID}`, 400);
      }
      if (existingTool.length === 0) {
        global.logger.error(`Tool ID ${toolID} does not exist, cannot create toolStock`);
        throw errorGen(`Tool ID ${toolID} does not exist, cannot create toolStock`, 400);
      }

      const { data: toolStock, error } = await db.from('toolStocks').insert({ toolStockID: customID, userID, toolID, quantity }).select().single();
      if (error) {
        global.logger.error(`Error creating toolStock: ${error.message}`);
        throw errorGen('Error creating toolStock', 400);
      }
      createKitchenLog(userID, authorization, 'createToolStock', Number(toolStock.toolStockID), Number(toolID), null, null, `Added ${quantity} ${existingTool[0].name}`);
      return {
        toolStockID: toolStock.toolStockID,
        toolID: toolID,
        quantity: quantity,
      };
    } catch (err) {
      throw errorGen('Unhandled Error in toolStocks create', 520, 'unhandledError_toolStocks-create', false, 2); //message, code, name, operational, severity
    }
  }

  async function update(options) {
    const { userID, authorization, toolStockID, quantity } = options;

    try {
      //validate that the provided quantity is valid integer
      if (quantity < 1 || !Number.isInteger(quantity)) {
        global.logger.error(`Invalid quantity for Tool Stock. Can't Update: ${quantity}`);
        throw errorGen(`Invalid quantity for Tool Stock. Can't Update: ${quantity}`, 400);
      }

      //validate that the provided toolStockID exists
      const { data: existingToolStock, error: existingToolStockError } = await db.from('toolStocks').select().eq('toolStockID', toolStockID);
      if (existingToolStockError) {
        global.logger.error(`Error validating toolStock ID: ${toolStockID}: ${existingToolStockError.message}`);
        throw errorGen(`Error validating toolStock ID: ${toolStockID}`, 400);
      }
      if (existingToolStock.length === 0) {
        global.logger.error(`ToolStock ID ${toolStockID} does not exist, cannot update toolStock`);
        throw errorGen(`ToolStock ID ${toolStockID} does not exist, cannot update toolStock`, 400);
      }

      //update toolStock
      const updateFields = {};
      for (let key in options) {
        if (key !== 'toolStockID' && options[key] !== undefined && key !== 'authorization') {
          updateFields[key] = options[key];
        }
      }
      const updatedToolStock = await updater(userID, authorization, 'toolStockID', toolStockID, 'toolStocks', updateFields);
      return updatedToolStock;
    } catch (err) {
      throw errorGen('Unhandled Error in toolStocks update', 520, 'unhandledError_toolStocks-update', false, 2); //message, code, name, operational, severity
    }
  }

  async function deleteToolStock(options) {
    const { userID, authorization, toolStockID } = options;

    try {
      //validate that the provided toolStockID exists
      const { data: existingToolStock, error: existingToolStockError } = await db.from('toolStocks').select().eq('toolStockID', toolStockID).eq('deleted', false);
      if (existingToolStockError) {
        global.logger.error(`Error validating toolStock ID: ${toolStockID}: ${existingToolStockError.message}`);
        throw errorGen(`Error validating toolStock ID: ${toolStockID}`, 400);
      }
      if (existingToolStock.length === 0) {
        global.logger.error(`ToolStock ID ${toolStockID} does not exist, cannot delete toolStock`);
        throw errorGen(`ToolStock ID ${toolStockID} does not exist, cannot delete toolStock`, 400);
      }

      //validate that the associated toolID exists
      const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', existingToolStock[0].toolID);
      if (existingToolError) {
        global.logger.error(`Error validating tool ID: ${existingToolStock[0].toolID}: ${existingToolError.message}`);
        throw errorGen(`Error validating tool ID: ${existingToolStock[0].toolID}`, 400);
      }
      if (existingTool.length === 0) {
        global.logger.error(`Tool ID ${existingToolStock[0].toolID} does not exist, cannot delete toolStock`);
        throw errorGen(`Tool ID ${existingToolStock[0].toolID} does not exist, cannot delete toolStock`, 400);
      }

      //delete toolStock
      const { error } = await db.from('toolStocks').update({ deleted: true }).eq('toolStockID', toolStockID);

      if (error) {
        global.logger.error(`Error deleting toolStock ID: ${toolStockID}: ${error.message}`);
        throw errorGen(`Error deleting toolStock ID: ${toolStockID}`, 400);
      }

      //add a 'deleted' log entry
      createKitchenLog(userID, authorization, 'deleteToolStock', Number(toolStockID), Number(existingToolStock[0].toolID), null, null, `Deleted ${existingToolStock[0].quantity} ${existingTool[0].name}`);
      return { success: true };
    } catch (err) {
      throw errorGen('Unhandled Error in toolStocks deleteToolStock', 520, 'unhandledError_toolStocks-deleteToolStock', false, 2); //message, code, name, operational, severity
    }
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
