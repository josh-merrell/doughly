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
    const { customID, authorization, userID, toolID, purchasedBy, purchaseDate, quantity } = options;

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

    //validate that the provided purchasedBy is valid
    const { data: existingEmployee, error: existingEmployeeError } = await db.from('employees').select().eq('employeeID', purchasedBy);
    if (existingEmployeeError) {
      global.logger.info(`Error validating employee ID: ${purchasedBy}: ${existingEmployeeError.message}`);
      return { error: existingEmployeeError.message };
    }
    if (existingEmployee.length === 0) {
      global.logger.info(`Employee ID ${purchasedBy} does not exist, cannot create toolStock`);
      return { error: `Employee ID ${purchasedBy} does not exist, cannot create toolStock` };
    }

    //validate that provided quantity is positive integer
    if (quantity < 1 || !Number.isInteger(quantity)) {
      global.logger.info(`Quantity must be a positive integer, got ${quantity}`);
      return { error: `Quantity must be a positive integer, got ${quantity}` };
    }

    const toolStockPromises = [];
    const toolStockIDs = [];

    for (let i = 0; i < quantity; i++) {
      // take number of digits in quantity and replace that number of digits from the end of customID with i padded with 0s
      const toolStockID = customID.slice(0, -quantity.toString().length) + i.toString().padStart(quantity.toString().length, '0');
      toolStockPromises.push(
        db
          .from('toolStocks')
          .insert({
            toolStockID,
            userID,
            toolID,
            purchasedBy,
            purchaseDate,
          })
          .select('toolStockID')
          .single(),
      );
    }

    try {
      const results = await Promise.all(toolStockPromises);

      results.forEach((result) => {
        if (result.error) {
          throw new Error(result.error.message);
        } else {
          //add a 'created' log entry
          createKitchenLog(userID, authorization, 'createToolStock', Number(result.data.toolStockID), Number(toolID), null, null, `created toolStock with ID: ${result.data.toolStockID}`);

          toolStockIDs.push(result.data.toolStockID);
        }
      });

      global.logger.info(`Created ${toolStockIDs.length} toolStocks`);
      return { toolStockIDs };
    } catch (error) {
      global.logger.info(`Error creating toolStock: ${error.message}`);
      return { error: error.message };
    }
  }

  async function update(options) {
    const { toolStockID, purchasedBy } = options;

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

    //validate that the provided purchasedBy is valid
    const { data: existingEmployee, error: existingEmployeeError } = await db.from('employees').select().eq('employeeID', purchasedBy);
    if (existingEmployeeError) {
      global.logger.info(`Error validating employee ID: ${purchasedBy}: ${existingEmployeeError.message}`);
      return { error: existingEmployeeError.message };
    }
    if (existingEmployee.length === 0) {
      global.logger.info(`Employee ID ${purchasedBy} does not exist, cannot update toolStock`);
      return { error: `Employee ID ${purchasedBy} does not exist, cannot update toolStock` };
    }

    //update toolStock
    const updateFields = {};
    for (let key in options) {
      if (key !== 'toolStockID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedToolStock = await updater('toolStockID', toolStockID, 'toolStocks', updateFields);
      global.logger.info(`Updated toolStock ID: ${toolStockID}`);
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

    global.logger.info(`Deleted toolStock ID: ${toolStockID}`);
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
