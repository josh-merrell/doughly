('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');
const { updater } = require('../../../db');
const { default: axios } = require('axios');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db, dbPublic }) => {
  async function getShoppingListByID(options) {
    const { shoppingListID } = options;

    try {
      const { data: shoppingList, error } = await db.from('shoppingLists').select('shoppingListID, status, fulfilledDate, fulfilledMethod').where('shoppingListID', shoppingListID).single();
      if (error) {
        global.logger.error(`Error getting shopping list ${shoppingListID}: ${error.message}`);
        throw errorGen(`Error getting shopping list ${shoppingListID}`, 400);
      }
      global.logger.info('Got shoppingList');
      return shoppingList;
    } catch (err) {
      throw errorGen('Unhandled Error in shoppingLists getShoppingListByID', 520, 'unhandledError_shoppingLists-getShoppingListByID', false, 2); //message, code, name, operational, severity
    }
  }

  async function getShoppingLists(options) {
    const { userID, shoppingListIDs } = options;

    try {
      let q = db.from('shoppingLists').select('shoppingListID, status, fulfilledDate, fulfilledMethod').filter('userID', 'eq', userID).neq('status', 'deleted').neq('status', 'fulfilled').order('shoppingListID', { descending: true });
      if (shoppingListIDs) {
        q = q.in('shoppingListID', shoppingListIDs);
      }
      let returnData;
      const { data: shoppingLists, error } = await q;

      if (error) {
        global.logger.error(`Error getting shopping lists: ${error.message}`);
        throw errorGen('Error getting shopping lists', 400);
      }
      if (shoppingLists.length === 0) {
        // create a new shopping list if none exist with new axios call
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
          global.logger.error(`Error creating new shopping list: ${createListError.message}`);
          throw errorGen(`Error creating new shopping list`, 400);
        }
        const { data: newShoppingLists, error: newShoppingListsError } = await q;
        if (newShoppingListsError) {
          global.logger.error(`Error getting shopping lists: ${newShoppingListsError.message}`);
          throw errorGen('Error getting shopping lists', 400);
        }
        returnData = newShoppingLists;
      } else {
        returnData = shoppingLists;
      }
      global.logger.info(`Got ${returnData.length} shopping lists`);
      return returnData;
    } catch (err) {
      throw errorGen('Unhandled Error in shoppingLists getShoppingLists', 520, 'unhandledError_shoppingLists-getShoppingLists', false, 2); //message, code, name, operational, severity
    }
  }

  async function createShoppingList(options) {
    const { userID, customID, authorization } = options;

    try {
      //verify that 'customID' exists on the request
      if (!customID) {
        global.logger.error('Error creating shoppingList: customID is missing');
        throw errorGen('customID is missing', 400);
      }

      //only create a shoppingList if one doesn't already exist for user with 'status' = 'draft' or 'shopping'
      const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('userID', 'eq', userID).in('status', ['draft', 'shopping']);
      if (existingShoppingListError) {
        global.logger.error(`Error creating shoppingList: ${existingShoppingListError.message}`);
        throw errorGen('Error creating shoppingList', 400);
      }
      if (existingShoppingList.length > 0) {
        global.logger.error('Error creating shoppingList: shoppingList already exists');
        throw errorGen('shoppingList already exists', 400);
      }

      //create the shoppingList
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').insert({ userID, shoppingListID: customID, status: 'draft' }).select().single();
      if (shoppingListError) {
        global.logger.error(`Error creating shoppingList: ${shoppingListError.message}`);
        throw errorGen('Error creating shoppingList', 400);
      }
      //add a 'created' log entry
      createShoppingLog(userID, authorization, 'createShoppingList', shoppingList.shoppingListID, null, null, null, `createdShoppingList: ${shoppingList.shoppingListID}`);
      return { shoppingListID: shoppingList.shoppingListID };
    } catch (err) {
      throw errorGen('Unhandled Error in shoppingLists', 520, 'unhandledError_shoppingLists-createShoppingLists', false, 2); //message, code, name, operational, severity
    }
  }

  async function updateShoppingList(options) {
    const { userID, authorization, shoppingListID, status, fulfilledMethod } = options;

    try {
      //verify that the provided shoppingListID exists
      const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select().filter('shoppingListID', 'eq', shoppingListID).single();
      if (existingShoppingListError) {
        global.logger.error(`Error updating shoppingList: ${existingShoppingListError.message}`);
        throw errorGen(`Error updating shoppingList`, 400);
      }
      if (!existingShoppingList) {
        global.logger.error('Error updating shoppingList: shoppingList does not exist');
        throw errorGen('shoppingList does not exist', 400);
      }

      //If provided, verify that the status is 'shopping', 'draft', or 'fulfilled'
      if (status && !['shopping', 'draft', 'fulfilled'].includes(status)) {
        global.logger.error('Error updating shoppingList: status must be "shopping", "draft", or "fulfilled"');
        throw errorGen('status must be "shopping", "draft", or "fulfilled"', 400);
      }

      //if status is 'fulfilled', verify that fulfilledMethod exists and is either 'manual' or 'pickup'
      if (status === 'fulfilled' && (!fulfilledMethod || !['manual', 'pickup'].includes(fulfilledMethod))) {
        global.logger.error('Error updating shoppingList: fulfilledMethod must be "manual" or "pickup"');
        throw errorGen('fulfilledMethod must be "manual" or "pickup"', 400);
      }

      //update the shoppingList
      const updateFields = {};
      for (let key in options) {
        if (key !== 'authorization' && key !== 'shoppingListID' && options[key] !== undefined) {
          updateFields[key] = options[key];
        }
      }

      const updatedShoppingList = await updater(userID, authorization, 'shoppingListID', shoppingListID, 'shoppingLists', updateFields);
      //if the list was fulfilled, create a new draft list using axios
      if (status === 'fulfilled') {
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
          global.logger.error(`Error creating new shopping list after updating ${shoppingListID} to 'fulfilled': ${createListError.message}`);
          throw errorGen(`Error creating new shopping list after updating ${shoppingListID} to 'fulfilled'`, 400);
        }
      }
      return updatedShoppingList;
    } catch (err) {
      throw errorGen('Unhandled Error in shoppingLists updateShoppingList', 520, 'unhandledError_shoppingLists-updateShoppingList', false, 2); //message, code, name, operational, severity
    }
  }

  async function deleteShoppingList(options) {
    const { shoppingListID } = options;

    try {
      // attempt to delete the children of the shopping list
      const { data, error2 } = await dbPublic.rpc('shopping_list_children_delete', { shoppinglist: Number(shoppingListID) });
      if (error2) {
        global.logger.error(`Error deleting shoppingList children: ${error2.message}`);
        throw errorGen('Error deleting shoppingList children', 400);
      }
      if (data === 'NONE') {
        global.logger.error(`Shopping List with ID ${shoppingListID} does not exist, cannot delete`);
        throw errorGen(`Shopping List with ID ${shoppingListID} does not exist, cannot delete`, 400);
      } else if (!data) {
        global.logger.error(`Error deleting shoppingList children for list ID: ${shoppingListID}`);
        throw errorGen('Error deleting shoppingList children', 400);
      }

      global.logger.info(`Deleted recipes and ingredients for shoppingListID: ${shoppingListID}`);

      //we don't actually delete the list, we just remove the child recipes and standalone ingredients
      return { shoppingListID: shoppingListID };
    } catch (err) {
      throw errorGen('Unhandled Error in shoppingLists deleteShoppingList', 520, 'unhandledError_shoppingLists-deleteShoppingList', false, 2); //message, code, name, operational, severity
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
