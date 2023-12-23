('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');
const { updater } = require('../../../db');
const { getShoppingListByID } = require('./handler');
const { default: axios } = require('axios');

module.exports = ({ db }) => {
  async function getShoppingListByID(options) {
    const { shoppingListID } = options;
    const { data: shoppingList, error } = await db.from('shoppingLists').select('shoppingListID, status, fulfilledDate, fulfilledMethod').where('shoppingListID', shoppingListID).single();
    if (error) {
      global.logger.info(`Error getting shopping list ${shoppingListID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info('Got shoppingList');
    return shoppingList;
  }

  async function getShoppingLists(options) {
    const { userID, shoppingListIDs } = options;
    let q = db.from('shoppingLists').select('shoppingListID, status, fulfilledDate, fulfilledMethod').filter('userID', 'eq', userID).neq('status', 'deleted').neq('status', 'fulfilled').order('shoppingListID', { descending: true });
    if (shoppingListIDs) {
      q = q.in('shoppingListID', shoppingListIDs);
    }
    const { data: shoppingLists, error } = await q;

    if (error) {
      global.logger.info(`Error getting shopping lists: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${shoppingLists.length} shopping lists`);
    return shoppingLists;
  }

  async function createShoppingList(options) {
    const { userID, customID, authorization } = options;
    //verify that 'customID' exists on the request
    if (!customID) {
      global.logger.info('Error creating shoppingList: customID is missing');
      return { error: 'customID is missing' };
    }

    //only create a shoppingList if one doesn't already exist for user with 'status' = 'draft' or 'shopping'
    const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('userID', 'eq', userID).in('status', ['draft', 'shopping']);
    if (existingShoppingListError) {
      global.logger.info(`Error creating shoppingList: ${existingShoppingListError.message}`);
      return { error: existingShoppingListError.message };
    }
    if (existingShoppingList.length > 0) {
      global.logger.info('Error creating shoppingList: shoppingList already exists');
      return { error: 'shoppingList already exists' };
    }

    //create the shoppingList
    const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').insert({ userID, shoppingListID: customID, status: 'draft' }).select().single();
    if (shoppingListError) {
      global.logger.info(`Error creating shoppingList: ${shoppingListError.message}`);
      return { error: shoppingListError.message };
    }
    //add a 'created' log entry
    createShoppingLog(userID, authorization, 'createShoppingList', shoppingList.shoppingListID, null, null, null, `createdShoppingList: ${shoppingList.shoppingListID}`);
    return { shoppingListID: shoppingList.shoppingListID };
  }

  async function updateShoppingList(options) {
    const { userID, authorization, shoppingListID, status, fulfilledMethod } = options;

    //verify that the provided shoppingListID exists
    const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select().filter('shoppingListID', 'eq', shoppingListID).single();
    if (existingShoppingListError) {
      global.logger.info(`Error updating shoppingList: ${existingShoppingListError.message}`);
      return { error: existingShoppingListError.message };
    }
    if (!existingShoppingList) {
      global.logger.info('Error updating shoppingList: shoppingList does not exist');
      return { error: 'shoppingList does not exist' };
    }

    //If provided, verify that the status is 'shopping', 'draft', or 'fulfilled'
    if (status && !['shopping', 'draft', 'fulfilled'].includes(status)) {
      global.logger.info('Error updating shoppingList: status must be "shopping", "draft", or "fulfilled"');
      return { error: 'status must be "shopping", "draft", or "fulfilled"' };
    }

    //if status is 'fulfilled', verify that fulfilledMethod exists and is either 'manual' or 'pickup'
    if (status === 'fulfilled' && (!fulfilledMethod || !['manual', 'pickup'].includes(fulfilledMethod))) {
      global.logger.info('Error updating shoppingList: fulfilledMethod must be "manual" or "pickup"');
      return { error: 'fulfilledMethod must be "manual" or "pickup"' };
    }

    //update the shoppingList
    const updateFields = {};
    for (let key in options) {
      if (key !== 'authorization' && key !== 'shoppingListID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedShoppingList = await updater(userID, authorization, 'shoppingListID', shoppingListID, 'shoppingLists', updateFields);
      //if the list was fulfilled, create a new draft list using axios
      const { error: createListError } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/shopping/lists`,
        {
          userID: userID,
          IDtype: 26,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        },
      );
      if (createListError) {
        global.logger.info(`Error creating new shopping list after updating ${shoppingListID} to 'fulfilled': ${createListError.message}`);
        return { error: createListError.message };
      }
      return updatedShoppingList;
    } catch (error) {
      global.logger.info(`Error updating shoppingList with ID: ${shoppingListID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteShoppingList(options) {
    const { userID, authorization, shoppingListID } = options;

    //verify that the provided shoppingListID exists
    const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListID).single();
    if (existingShoppingListError) {
      global.logger.info(`Error deleting shoppingList: ${existingShoppingListError.message}`);
      return { error: existingShoppingListError.message };
    }
    if (!existingShoppingList) {
      global.logger.info('Error deleting shoppingList: shoppingList does not exist');
      return { error: 'shoppingList does not exist' };
    }

    //delete the shoppingList
    try {
      await updater(userID, authorization, 'shoppingListID', shoppingListID, 'shoppingLists', { status: 'deleted' });
    } catch (error) {
      global.logger.info(`Error deleting shoppingList ID: ${shoppingListID}: ${error.message}`);
      return { error: error.message };
    }
  }

  return {
    get: {
      byID: getShoppingListByID,
      all: getShoppingLists,
    },
    create: createShoppingList,
    update: updateShoppingList,
    delete: deleteShoppingList,
  };
};
