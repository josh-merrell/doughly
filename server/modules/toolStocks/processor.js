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
        throw errorGen(`Error getting toolStocks: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*toolStocks-getAll* Got ${toolStocks.length} toolStocks`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return toolStocks;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in toolStocks getAll', err.code || 520, err.name || 'unhandledError_toolStocks-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getByID(options) {
    const { toolStockID } = options;

    try {
      const { data: toolStock, error } = await db.from('toolStocks').select().eq('toolStockID', toolStockID).eq('deleted', false);

      if (error) {
        throw errorGen(`Error getting toolStock: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*toolStocks-getByID* Got toolStock ID: ${toolStockID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return toolStock;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in toolStocks getByID', err.code || 520, err.name || 'unhandledError_toolStocks-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, toolID, quantity = 1 } = options;

    try {
      //validate that the provided quantity is valid integer
      if (quantity < 1 || !Number.isInteger(quantity)) {
        throw errorGen(`Invalid quantity for new Tool Stock: ${quantity}`, 510, 'dataValidationErr', false, 3);
      }

      //validate that the provided toolID is valid
      const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID);
      if (existingToolError) {
        throw errorGen(`Error validating tool ID: ${toolID}: ${existingToolError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingTool.length === 0) {
        throw errorGen(`Tool ID ${toolID} does not exist, cannot create toolStock`, 515, 'cannotComplete', false, 3);
      }

      const { data: toolStock, error } = await db.from('toolStocks').insert({ toolStockID: customID, userID, toolID, quantity }).select().single();
      if (error) {
        throw errorGen(`Error creating toolStock: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      createKitchenLog(userID, authorization, 'createToolStock', Number(toolStock.toolStockID), Number(toolID), null, null, `Added ${quantity} ${existingTool[0].name}`);
      return {
        toolStockID: toolStock.toolStockID,
        toolID: toolID,
        quantity: quantity,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in toolStocks create', err.code || 520, err.name || 'unhandledError_toolStocks-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    const { userID, authorization, toolStockID, quantity } = options;

    try {
      //validate that the provided quantity is valid integer
      if (quantity < 1 || !Number.isInteger(quantity)) {
        throw errorGen(`Invalid quantity for Tool Stock. Can't Update: ${quantity}`, 510, 'dataValidationErr', false, 3);
      }

      //validate that the provided toolStockID exists
      const { data: existingToolStock, error: existingToolStockError } = await db.from('toolStocks').select().eq('toolStockID', toolStockID);
      if (existingToolStockError) {
        throw errorGen(`Error validating toolStock ID: ${toolStockID}: ${existingToolStockError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingToolStock.length === 0) {
        throw errorGen(`ToolStock ID ${toolStockID} does not exist, cannot update toolStock`, 515, 'cannotComplete', false, 3);
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
      throw errorGen(err.message || 'Unhandled Error in toolStocks update', err.code || 520, err.name || 'unhandledError_toolStocks-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteToolStock(options) {
    const { userID, authorization, toolStockID } = options;

    try {
      //validate that the provided toolStockID exists
      const { data: existingToolStock, error: existingToolStockError } = await db.from('toolStocks').select().eq('toolStockID', toolStockID).eq('deleted', false);
      if (existingToolStockError) {
        throw errorGen(`Error validating toolStock ID: ${toolStockID}: ${existingToolStockError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingToolStock.length === 0) {
        throw errorGen(`ToolStock ID ${toolStockID} does not exist, cannot delete toolStock`, 515, 'cannotComplete', false, 3);
      }

      //validate that the associated toolID exists
      const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', existingToolStock[0].toolID);
      if (existingToolError) {
        throw errorGen(`Error validating tool ID: ${existingToolStock[0].toolID}: ${existingToolError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingTool.length === 0) {
        throw errorGen(`Tool ID ${existingToolStock[0].toolID} does not exist, cannot delete toolStock`, 515, 'cannotComplete', false, 3);
      }

      //delete toolStock
      const { error } = await db.from('toolStocks').update({ deleted: true }).eq('toolStockID', toolStockID);

      if (error) {
        throw errorGen(`Error deleting toolStock ID: ${toolStockID}: ${error.message}`, 514, 'failSupabaseDelete', true, 3);
      }

      //add a 'deleted' log entry
      createKitchenLog(userID, authorization, 'deleteToolStock', Number(toolStockID), Number(existingToolStock[0].toolID), null, null, `Deleted ${existingToolStock[0].quantity} ${existingTool[0].name}`);
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in toolStocks deleteToolStock', err.code || 520, err.name || 'unhandledError_toolStocks-deleteToolStock', err.isOperational || false, err.severity || 2);
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
