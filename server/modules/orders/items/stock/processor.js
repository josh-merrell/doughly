('use strict');

const { updater } = require('../../../../db');

const { supplyCheck } = require('../../../../services/supply');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { stockItemIDs, orderID, stockProductID, stockStatus } = options;
    let q = db.from('orderStockItems').select().order('stockItemID', { ascending: true });

    if (stockItemIDs) {
      q = q.in('stockItemID', stockItemIDs);
    }
    if (orderID) {
      q = q.eq('orderID', orderID);
    }
    if (stockProductID) {
      q = q.eq('stockProductID', stockProductID);
    }
    if (stockStatus) {
      q = q.eq('stockStatus', stockStatus);
    }

    const { data: orderStockItems, error } = await q;

    if (error) {
      global.logger.info(`Error getting orderStockItems: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${orderStockItems.length} orderStockItems`);
    return orderStockItems;
  }

  async function getByID(options) {
    const { data, error } = await db.from('orderStockItems').select().eq('stockItemID', options.stockItemID).single();
    if (error) {
      global.logger.info(`Error getting orderStockItem by ID: ${options.stockItemID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    const { orderID, stockProductID, quantity, unitIncome } = options;

    //validate that provided orderID exists
    const { data: order, error } = await db.from('orders').select().eq('orderID', orderID);
    if (error) {
      global.logger.info(`Error validating order ID: ${orderID} while creating orderStockItem ${error.message}`);
      return { error: error.message };
    }
    if (!order.length) {
      global.logger.info(`order ID: ${orderID} does not exist, cannot add orderStockItem`);
      return { error: `order ID: ${orderID} does not exist, cannot add orderStockItem` };
    }

    //validate that provided stockProductID exists
    const { data: stockProduct, error: stockProductError } = await db.from('stockProducts').select().eq('stockProductID', stockProductID);
    if (stockProductError) {
      global.logger.info(`Error validating stockProduct ID: ${stockProductID} while creating orderStockItem ${stockProductError.message}`);
      return { error: stockProductError.message };
    }
    if (!stockProduct.length) {
      global.logger.info(`stockProduct ID: ${stockProductID} does not exist, cannot add orderStockItem`);
      return { error: `stockProduct ID: ${stockProductID} does not exist, cannot add orderStockItem` };
    }

    //validate that provided quantity is a positive integer
    if (!Number.isInteger(quantity) || quantity < 1) {
      global.logger.info(`quantity: ${quantity} is not a positive integer, cannot add orderStockItem`);
      return { error: `quantity: ${quantity} is not a positive integer, cannot add orderStockItem` };
    }

    //validate that provided unitIncome is a positive number
    if (!unitIncome || unitIncome < 0) {
      global.logger.info(`unitIncome: ${unitIncome} is not a positive number, cannot add orderStockItem`);
      return { error: `unitIncome: ${unitIncome} is not a positive number, cannot add orderStockItem` };
    }

    const scheduledDeliveryDate = order[0].scheduledDeliveryDate;
    //call helper to determine 'stockStatus' of this new recipe stockItem
    const stockStatus = await supplyCheck(quantity, stockProductID, scheduledDeliveryDate);

    //create orderStockItem
    const { data: orderStockItem, error: orderStockItemError } = await db
      .from('orderStockItems')
      .insert({ orderID, stockProductID, quantity, unitIncome, stockStatus })
      .select('stockItemID')
      .single();

    if (orderStockItemError) {
      global.logger.info(`Error creating orderStockItem: ${orderStockItemError.message}`);
      return { error: orderStockItemError.message };
    }
    global.logger.info(`Created orderStockItem: ${orderStockItem.stockItemID}`);
    return orderStockItem;
  }

  async function update(options) {
    const { stockItemID, quantity, unitIncome } = options;

    //validate that provided stockItemID exists
    const { data: orderStock, error } = await db.from('orderStockItems').select().eq('stockItemID', stockItemID);
    if (error) {
      global.logger.info(`Error validating orderStock ID: ${stockItemID} while updating orderStockItem ${error.message}`);
      return { error: error.message };
    }
    if (!orderStock.length) {
      global.logger.info(`orderStock ID: ${stockItemID} does not exist, cannot update orderStockItem`);
      return { error: `orderStock ID: ${stockItemID} does not exist, cannot update orderStockItem` };
    }

    //validate that provided quantity is a positive integer
    if (quantity && quantity < 1) {
      global.logger.info(`quantity: ${quantity} is not a positive integer, cannot update orderStockItem`);
      return { error: `quantity: ${quantity} is not a positive integer, cannot update orderStockItem` };
    }

    //validate that provided unitIncome is a positive number
    if (unitIncome && unitIncome <= 0) {
      global.logger.info(`unitIncome: ${unitIncome} is not a positive number, cannot update orderStockItem`);
      return { error: `unitIncome: ${unitIncome} is not a positive number, cannot update orderStockItem` };
    }

    //get order associated with this orderStockItem
    const { data: order, error: orderError } = await db.from('orders').select().eq('orderID', orderStock[0].orderID);
    if (orderError) {
      global.logger.info(`Error getting order associated with orderStockItem: ${stockItemID} while updating orderStockItem ${orderError.message}`);
      return { error: orderError.message };
    }
    if (!order.length) {
      global.logger.info(`order associated with orderStockItem: ${stockItemID} does not exist, cannot update orderStockItem`);
      return { error: `order associated with orderStockItem: ${stockItemID} does not exist, cannot update orderStockItem` };
    }

    //calculate new stockStatus based on provided quantity
    const stockStatus = await supplyCheck(quantity, orderStock[0].stockProductID, order[0].scheduledDeliveryDate);

    //update the orderStockItem
    const updateFields = {};

    for (let key in options) {
      if (key !== 'stockItemID' && options[key]) {
        updateFields[key] = options[key];
      }
    }
    updateFields.stockStatus = stockStatus;

    try {
      const updatedOrderStockItem = await updater('stockItemID', stockItemID, 'orderStockItems', updateFields);
      global.logger.info(`Updated orderStockItem: ${stockItemID}`);
      return updatedOrderStockItem;
    } catch (error) {
      global.logger.info(`Error updating orderStockItem: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteByID(options) {
    const { stockItemID } = options;

    //validate that provided stockItemID exists
    const { data: orderStock, error } = await db.from('orderStockItems').select().eq('stockItemID', stockItemID);
    if (error) {
      global.logger.info(`Error validating orderStockItem ${error.message}`);
      return { error: error.message };
    }
    if (!orderStock.length) {
      global.logger.info(`orderStock ID: ${stockItemID} does not exist, cannot delete orderStockItem`);
      return { error: `orderStock ID: ${stockItemID} does not exist, cannot delete orderStockItem` };
    }

    const { errorDelete } = await db.from('orderStockItems').delete().eq('stockItemID', stockItemID);
    if (errorDelete) {
      global.logger.info(`Error deleting orderStockItem ${errorDelete.message}`);
      return { error: errorDelete.message };
    }
    global.logger.info(`Deleted orderStockItem: ${stockItemID}`);
    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteByID,
  };
};
