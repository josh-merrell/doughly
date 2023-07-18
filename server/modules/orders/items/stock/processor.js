('use strict');

const { updater } = require('../../../../db');

const { supplyCheckMoreDemand, supplyCheckLessDemand } = require('../../../../services/supply');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, stockItemIDs, orderID, stockProductID, stockStatus } = options;
    let q = db.from('orderStockItems').select().filter('userID', 'eq', userID).eq('deleted', false).order('stockItemID', { ascending: true });

    if (stockItemIDs) {
      q = q.in('stockItemID', stockItemIDs);
    }
    if (orderID) {
      q = q.filter('orderID', 'eq', orderID);
    }
    if (stockProductID) {
      q = q.filter('stockProductID', 'eq', stockProductID);
    }
    if (stockStatus) {
      q = q.filter('stockStatus', 'eq', stockStatus);
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
    const { data, error } = await db.from('orderStockItems').select().filter('userID', 'eq', options.userID).filter('stockItemID', 'eq', options.stockItemID).eq('deleted', false).single();
    if (error) {
      global.logger.info(`Error getting orderStockItem by ID: ${options.stockItemID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    const { userID, orderID, stockProductID, quantity, unitIncome } = options;

    //validate that provided orderID exists
    const { data: order, error } = await db.from('orders').select().filter('userID', 'eq', userID).filter('orderID', 'eq', orderID);
    if (error) {
      global.logger.info(`Error validating order ID: ${orderID} while creating orderStockItem ${error.message}`);
      return { error: error.message };
    }
    if (!order.length) {
      global.logger.info(`order ID: ${orderID} does not exist, cannot add orderStockItem`);
      return { error: `order ID: ${orderID} does not exist, cannot add orderStockItem` };
    }

    //validate that provided stockProductID exists
    const { data: stockProduct, error: stockProductError } = await db.from('stockProducts').select().filter('userID', 'eq', userID).filter('stockProductID', 'eq', stockProductID);
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

    const scheduledDeliveryTime = order[0].scheduledDeliveryTime;
    //call helper to determine 'stockStatus' of this new recipe stockItem
    const stockStatus = await supplyCheckMoreDemand(quantity, order[0].orderID, stockProductID, scheduledDeliveryTime);

    //create orderStockItem
    const { data: orderStockItem, error: orderStockItemError } = await db.from('orderStockItems').insert({ userID, orderID, stockProductID, quantity, unitIncome, stockStatus }).select('stockItemID').single();

    if (orderStockItemError) {
      global.logger.info(`Error creating orderStockItem: ${orderStockItemError.message}`);
      return { error: orderStockItemError.message };
    }
    global.logger.info(`Created orderStockItem: ${orderStockItem.stockItemID}`);
    return orderStockItem;
  }

  async function update(options) {
    const { userID, stockItemID, quantity, unitIncome } = options;

    //validate that provided stockItemID exists
    const { data: orderStock, error } = await db.from('orderStockItems').select().filter('userID', 'eq', userID).filter('stockItemID', 'eq', stockItemID);
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
    const { data: order, error: orderError } = await db.from('orders').select().filter('userID', 'eq', userID).filter('orderID', 'eq', orderStock[0].orderID);
    if (orderError) {
      global.logger.info(`Error getting order associated with orderStockItem: ${stockItemID} while updating orderStockItem ${orderError.message}`);
      return { error: orderError.message };
    }
    if (!order.length) {
      global.logger.info(`order associated with orderStockItem: ${stockItemID} does not exist, cannot update orderStockItem`);
      return { error: `order associated with orderStockItem: ${stockItemID} does not exist, cannot update orderStockItem` };
    }

    //calculate new stockStatus based on provided quantity
    let stockStatus;
    if (quantity > orderStock[0].quantity) {
      stockStatus = await supplyCheckMoreDemand(userID, quantity, order[0].orderID, orderStock[0].stockProductID, order[0].scheduledDeliveryTime, stockItemID);
    } else {
      stockStatus = await supplyCheckLessDemand(userID, quantity, order[0].orderID, orderStock[0].stockProductID, order[0].scheduledDeliveryTime, stockItemID);
    }

    //update the orderStockItem
    const updateFields = {};

    for (let key in options) {
      if (key !== 'stockItemID' && options[key] !== undefined) {
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
    const { data: orderStock, error } = await db.from('orderStockItems').select().eq('stockItemID', stockItemID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error validating orderStockItem ${error.message}`);
      return { error: error.message };
    }
    if (!orderStock.length) {
      global.logger.info(`orderStock ID: ${stockItemID} does not exist, cannot delete orderStockItem`);
      return { error: `orderStock ID: ${stockItemID} does not exist, cannot delete orderStockItem` };
    }
    const { errorDelete } = await db.from('orderStockItems').update({ deleted: true }).eq('stockItemID', stockItemID);
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
