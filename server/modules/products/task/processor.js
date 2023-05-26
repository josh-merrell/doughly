('use strict');

const { updater } = require('../../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { orderTaskIDs, orderID, recipeID, status } = options;

    let q = db.from('orderTaskProducts').select().order('orderTaskID', { ascending: true });

    if (orderTaskIDs) {
      q = q.in('orderTaskID', orderTaskIDs);
    }
    if (orderID) {
      q = q.eq('orderID', orderID);
    }
    if (recipeID) {
      q = q.eq('recipeID', recipeID);
    }
    if (status) {
      q = q.eq('status', status);
    }

    const { data: orderTaskProducts, error } = await q;

    if (error) {
      global.logger.info(`Error getting orderTaskProducts: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${orderTaskProducts.length} orderTaskProducts`);
    return orderTaskProducts;
  }

  async function getByID(options) {
    const { data, error } = await db.from('orderTaskProducts').select().eq('orderTaskID', options.orderTaskID).single();
    if (error) {
      global.logger.info(`Error getting orderTaskProduct by ID: ${options.orderTaskID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    const { orderID, recipeID, quantity, unitIncome } = options;

    //verify that provided orderID exists
    const { data: order, error } = await db.from('orders').select().eq('orderID', orderID);
    if (error) {
      global.logger.info(`Error validating order ID: ${orderID} while creating orderTaskProduct ${error.message}`);
      return { error: error.message };
    }
    if (!order.length) {
      global.logger.info(`order ID: ${orderID} does not exist, cannot add orderTaskProduct`);
      return { error: `order ID: ${orderID} does not exist, cannot add orderTaskProduct` };
    }

    //verify that provided recipeID exists
    const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', recipeID);
    if (recipeError) {
      global.logger.info(`Error validating recipe ID: ${recipeID} while creating orderTaskProduct ${recipeError.message}`);
      return { error: recipeError.message };
    }
    if (!recipe.length) {
      global.logger.info(`recipe ID: ${recipeID} does not exist, cannot add orderTaskProduct`);
      return { error: `recipe ID: ${recipeID} does not exist, cannot add orderTaskProduct` };
    }

    //verify that quantity is a positive integer
    if (quantity < 1 || !Number.isInteger(quantity)) {
      global.logger.info(`quantity must be a positive integer, received ${quantity}`);
      return { error: `quantity must be a positive integer, received ${quantity}` };
    }

    //verify that unitIncome is a positive number
    if (unitIncome < 0) {
      global.logger.info(`unitIncome must be a positive number, received ${unitIncome}`);
      return { error: `unitIncome must be a positive number, received ${unitIncome}` };
    }

    //create orderTaskProduct
    const { data: orderTaskProduct, error: orderTaskProductError } = await db
      .from('orderTaskProducts')
      .insert({ orderID, recipeID, quantity, unitIncome, status: 'created' })
      .select('orderTaskID');
    if (orderTaskProductError) {
      global.logger.info(`Error creating orderTaskProduct ${orderTaskProductError.message}`);
      return { error: orderTaskProductError.message };
    }

    global.logger.info(`Created orderTaskProduct ${orderTaskProduct.orderTaskID}`);
    return orderTaskProduct;
  }

  async function update(options) {
    const { orderTaskID, quantity, unitIncome } = options;

    //verify that provided orderTaskID exists
    const { data: orderTaskProduct, error } = await db.from('orderTaskProducts').select().eq('orderTaskID', orderTaskID);
    if (error) {
      global.logger.info(`Error validating orderTaskID: ${orderTaskID} while updating orderTaskProduct ${error.message}`);
      return { error: error.message };
    }
    if (!orderTaskProduct.length) {
      global.logger.info(`orderTaskID: ${orderTaskID} does not exist, cannot update orderTaskProduct`);
      return { error: `orderTaskID: ${orderTaskID} does not exist, cannot update orderTaskProduct` };
    }

    //verify that quantity is a positive integer if it is provided
    if (quantity && (quantity < 1 || !Number.isInteger(quantity))) {
      global.logger.info(`quantity must be a positive integer, received ${quantity}`);
      return { error: `quantity must be a positive integer, received ${quantity}` };
    }

    //verify that unitIncome is a positive number if it is provided
    if (unitIncome && unitIncome < 0) {
      global.logger.info(`unitIncome must be a positive number, received ${unitIncome}`);
      return { error: `unitIncome must be a positive number, received ${unitIncome}` };
    }

    const updateFields = {};
    for (let key in options) {
      if (key !== 'orderTaskID' && options[key]) updateFields[key] = options[key];
    }

    try {
      const updatedOrder = await updater('orderTaskID', orderTaskID, 'orderTaskProducts', updateFields);
      global.logger.info(`Updated orderTaskProduct ${orderTaskID}`);
      return updatedOrder;
    } catch (error) {
      global.logger.info(`Error updating orderTaskProduct ${orderTaskID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteOrderTask(options) {
    //verify that provided orderTaskID exists
    const { data: orderTaskProduct, errorVerify } = await db.from('orderTaskProducts').select().eq('orderTaskID', options.orderTaskID).single();
    if (errorVerify) {
      global.logger.info(`Error validating orderTaskID: ${options.orderTaskID} while removing orderTaskProduct ${errorVerify.message}`);
      return { error: errorVerify.message };
    }
    if (!orderTaskProduct) {
      global.logger.info(`orderTaskID: ${options.orderTaskID} does not exist, cannot remove orderTaskProduct`);
      return { error: `orderTaskID: ${options.orderTaskID} does not exist, cannot remove orderTaskProduct` };
    }

    const { data: deletedTaskProduct, errorDelete } = await db.from('orderTaskProducts').delete().match({ orderTaskID: options.orderTaskID });
    if (errorDelete) {
      global.logger.info(`Error getting orderTaskProduct by ID: ${options.orderTaskID}:${errorDelete.message}`);
      return { error: errorDelete.message };
    }
    global.logger.info(`Deleted orderTaskProduct ${options.orderTaskID}`);
    return deletedTaskProduct;
  }

  return {
    create,
    update,
    delete: deleteOrderTask,
    get: {
      byID: getByID,
      all: getAll,
    },
  };
};
