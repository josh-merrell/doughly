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
        throw errorGen(`Error getting shopping list ${shoppingListID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got shoppingList`, level: 6, timestamp: new Date().toISOString(), userID: shoppingList.userID || 0 });
      return shoppingList;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in shoppingLists getShoppingListByID', err.code || 520, err.name || 'unhandledError_shoppingLists-getShoppingListByID', err.isOperational || false, err.severity || 2);
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
        throw errorGen(`Error getting shopping lists: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
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
          throw errorGen(createListError.message || `Error creating new shopping list: ${createListError.message}`, createListError.code || 520, createListError.name || 'unhandledError_shoppingLists-getShoppingLists', createListError.isOperational || false, createListError.severity || 2);
        }
        const { data: newShoppingLists, error: newShoppingListsError } = await q;
        if (newShoppingListsError) {
          throw errorGen(`Error getting shopping lists: ${newShoppingListsError.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        returnData = newShoppingLists;
      } else {
        returnData = shoppingLists;
      }
      global.logger.info({ message: `Got ${returnData.length} shopping lists`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return returnData;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in shoppingLists getShoppingLists', err.code || 520, err.name || 'unhandledError_shoppingLists-getShoppingLists', err.isOperational || false, err.severity || 2);
    }
  }

  async function getShared(options) {
    const { invitedUserID } = options;

    try {
      const { data: sharedLists, error } = await db.from('sharedShoppingLists').select('*').filter('invitedUserID', 'eq', invitedUserID);
      if (error) {
        throw errorGen(`Error getting shared shopping lists: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got ${sharedLists.length} shared shopping lists`, level: 6, timestamp: new Date().toISOString(), userID: invitedUserID });
      return sharedLists;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in shoppingLists shared', err.code || 520, err.name || 'unhandledError_shoppingLists-shared', err.isOperational || false, err.severity || 2);
    }
  }

  async function createShoppingList(options) {
    const { userID, customID, authorization } = options;

    try {
      if (!customID) {
        throw errorGen(`Error creating shoppingList: customID is missing`, 510, 'dataValidationErr', false, 3);
      }

      //only create a shoppingList if one doesn't already exist for user with 'status' = 'draft' or 'shopping'
      const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('userID', 'eq', userID).in('status', ['draft', 'shopping']);
      if (existingShoppingListError) {
        throw errorGen(`Error creating shoppingList: ${existingShoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingShoppingList.length > 0) {
        throw errorGen(`Error creating shoppingList: shoppingList already exists`, 515, 'cannotComplete', false, 3);
      }

      //create the shoppingList
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').insert({ userID, shoppingListID: customID, status: 'draft' }).select().single();
      if (shoppingListError) {
        throw errorGen(`Error creating shoppingList: ${shoppingListError.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      //add a 'created' log entry
      createShoppingLog(userID, authorization, 'createShoppingList', shoppingList.shoppingListID, null, null, null, `createdShoppingList: ${shoppingList.shoppingListID}`);
      return { shoppingListID: shoppingList.shoppingListID };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in shoppingLists createShoppingList', err.code || 520, err.name || 'unhandledError_shoppingLists-createShoppingList', err.isOperational || false, err.severity || 2);
    }
  }

  async function updateShoppingList(options) {
    const { userID, authorization, shoppingListID, status, fulfilledMethod } = options;

    try {
      //verify that the provided shoppingListID exists
      const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select().filter('shoppingListID', 'eq', shoppingListID).single();
      if (existingShoppingListError) {
        throw errorGen(`Error updating shoppingList: ${existingShoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!existingShoppingList) {
        throw errorGen(`Error updating shoppingList: shoppingList does not exist`, 515, 'cannotComplete', false, 3);
      }

      //If provided, verify that the status is 'shopping', 'draft', or 'fulfilled'
      if (status && !['shopping', 'draft', 'fulfilled'].includes(status)) {
        throw errorGen(`Error updating shoppingList: status must be "shopping", "draft", or "fulfilled"`, 510, 'dataValidationErr', false, 3);
      }

      //if status is 'fulfilled', verify that fulfilledMethod exists and is either 'manual' or 'pickup'
      if (status === 'fulfilled' && (!fulfilledMethod || !['manual', 'pickup'].includes(fulfilledMethod))) {
        throw errorGen(`Error updating shoppingList: fulfilledMethod must be "manual" or "pickup"`, 510, 'dataValidationErr', false, 3);
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
          throw errorGen(
            createListError.message || `Error creating new shopping list after updating ${shoppingListID} to 'fulfilled': ${createListError.message}`,
            createListError.code || 520,
            createListError.name || 'unhandledError_shoppingLists-updateShoppingList',
            createListError.isOperational || false,
            createListError.severity || 2,
          );
        }
      }
      return updatedShoppingList;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in shoppingLists updateShoppingList', err.code || 520, err.name || 'unhandledError_shoppingLists-updateShoppingList', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteShoppingList(options) {
    const { shoppingListID } = options;

    try {
      // attempt to delete the children of the shopping list
      const { data, error2 } = await dbPublic.rpc('shopping_list_children_delete', { shoppinglist: Number(shoppingListID) });
      if (error2) {
        throw errorGen(`Error deleting shoppingList children: ${error2.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      if (data === 'NONE') {
        throw errorGen(`Shopping List with ID ${shoppingListID} does not exist, cannot delete`, 515, 'cannotComplete', false, 3);
      } else if (!data) {
        throw errorGen(`Error deleting shoppingList children: ${error2.message}`, 514, 'failSupabaseDelete', true, 3);
      }

      global.logger.info({ message: ``, level: 6, timestamp: new Date().toISOString(), userID: options.userID || 0 });

      //we don't actually delete the list, we just remove the child recipes and standalone ingredients
      return { shoppingListID: shoppingListID };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in shoppingLists deleteShoppingList', err.code || 520, err.name || 'unhandledError_shoppingLists-deleteShoppingList', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    get: {
      byID: getShoppingListByID,
      all: getShoppingLists,
      shared: getShared,
    },
    create: createShoppingList,
    update: updateShoppingList,
    delete: deleteShoppingList,
  };
};
