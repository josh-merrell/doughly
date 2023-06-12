('use strict');

const { updater } = require('../../../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, taskItemIDs, orderID, recipeID, status } = options;

    let q = db.from('orderTaskItems').select().filter('userID', 'eq', userID).order('taskItemID', { ascending: true });

    if (taskItemIDs) {
      q = q.in('taskItemID', taskItemIDs);
    }
    if (orderID) {
      q = q.filter('orderID', 'eq', orderID);
    }
    if (recipeID) {
      q = q.filter('recipeID', 'eq', recipeID);
    }
    if (status) {
      q = q.filter('status', 'eq', status);
    }

    const { data: orderTaskItems, error } = await q;

    if (error) {
      global.logger.info(`Error getting orderTaskItems: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${orderTaskItems.length} orderTaskItems`);
    return orderTaskItems;
  }

  async function getByID(options) {
    const { data, error } = await db.from('orderTaskItems').select().eq('taskItemID', options.taskItemID).single();
    if (error) {
      global.logger.info(`Error getting orderTaskItem by ID: ${options.taskItemID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    const { userID, orderID, recipeID, quantity, unitIncome } = options;

    //verify that provided orderID exists
    const { data: order, error } = await db.from('orders').select().eq('orderID', orderID);
    if (error) {
      global.logger.info(`Error validating order ID: ${orderID} while creating orderTaskItem ${error.message}`);
      return { error: error.message };
    }
    if (!order.length) {
      global.logger.info(`order ID: ${orderID} does not exist, cannot add orderTaskItem`);
      return { error: `order ID: ${orderID} does not exist, cannot add orderTaskItem` };
    }

    //verify that provided recipeID exists
    const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', recipeID);
    if (recipeError) {
      global.logger.info(`Error validating recipe ID: ${recipeID} while creating orderTaskItem ${recipeError.message}`);
      return { error: recipeError.message };
    }
    if (!recipe.length) {
      global.logger.info(`recipe ID: ${recipeID} does not exist, cannot add orderTaskItem`);
      return { error: `recipe ID: ${recipeID} does not exist, cannot add orderTaskItem` };
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

    //create orderTaskItem
    const { data: orderTaskItem, error: orderTaskItemError } = await db.from('orderTaskItems').insert({ userID, orderID, recipeID, quantity, unitIncome, status: 'created' }).select('taskItemID');
    if (orderTaskItemError) {
      global.logger.info(`Error creating orderTaskItem ${orderTaskItemError.message}`);
      return { error: orderTaskItemError.message };
    }

    global.logger.info(`Created orderTaskItem ${orderTaskItem.taskItemID}`);
    return orderTaskItem;
  }

  async function update(options) {
    const { taskItemID, quantity, unitIncome } = options;

    //verify that provided taskItemID exists
    const { data: orderTaskItem, error } = await db.from('orderTaskItems').select().eq('taskItemID', taskItemID);
    if (error) {
      global.logger.info(`Error validating taskItemID: ${taskItemID} while updating orderTaskItem ${error.message}`);
      return { error: error.message };
    }
    if (!orderTaskItem.length) {
      global.logger.info(`taskItemID: ${taskItemID} does not exist, cannot update orderTaskItem`);
      return { error: `taskItemID: ${taskItemID} does not exist, cannot update orderTaskItem` };
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
      if (key !== 'taskItemID' && options[key]) updateFields[key] = options[key];
    }

    try {
      const updatedOrder = await updater('taskItemID', taskItemID, 'orderTaskItems', updateFields);
      global.logger.info(`Updated orderTaskItem ${taskItemID}`);
      return updatedOrder;
    } catch (error) {
      global.logger.info(`Error updating orderTaskItem ${taskItemID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteOrderTask(options) {
    //verify that provided taskItemID exists
    const { data: orderTaskItem, errorVerify } = await db.from('orderTaskItems').select().eq('taskItemID', options.taskItemID).single();
    if (errorVerify) {
      global.logger.info(`Error validating taskItemID: ${options.taskItemID} while removing orderTaskItem ${errorVerify.message}`);
      return { error: errorVerify.message };
    }
    if (!orderTaskItem) {
      global.logger.info(`taskItemID: ${options.taskItemID} does not exist, cannot remove orderTaskItem`);
      return { error: `taskItemID: ${options.taskItemID} does not exist, cannot remove orderTaskItem` };
    }

    const { data: deletedTaskProduct, errorDelete } = await db.from('orderTaskItems').delete().match({ taskItemID: options.taskItemID });
    if (errorDelete) {
      global.logger.info(`Error getting orderTaskItem by ID: ${options.taskItemID}:${errorDelete.message}`);
      return { error: errorDelete.message };
    }
    global.logger.info(`Deleted orderTaskItem ${options.taskItemID}`);
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
