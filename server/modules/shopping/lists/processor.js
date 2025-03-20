('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');
const { updater } = require('../../../db');
const { default: axios } = require('axios');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db, dbPublic }) => {
  async function getShoppingListByID(options) {
    const { shoppingListID } = options;

    try {
      // first check state of each to ensure they're marked as fulfilled if needed
      await refreshShoppingLists({ userID });
      const { data: shoppingList, error } = await db.from('shoppingLists').select('shoppingListID, status, fulfilledDate, fulfilledMethod').where('shoppingListID', shoppingListID).single();
      if (error) {
        throw errorGen(`*shoppingLists-getShoppingListByID* Error getting shopping list ${shoppingListID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*shoppingLists-getShoppingListByID* Got shoppingList`, level: 6, timestamp: new Date().toISOString(), userID: shoppingList.userID || 0 });
      return shoppingList;
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-getShoppingListByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-getShoppingListByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function getShoppingLists(options) {
    const { userID, shoppingListIDs } = options;

    try {
      // first check state of each to ensure they're marked as fulfilled if needed
      await refreshShoppingLists({ userID });
      let q = db.from('shoppingLists').select('shoppingListID, status, fulfilledDate, fulfilledMethod').filter('userID', 'eq', userID).neq('status', 'deleted').neq('status', 'fulfilled').order('shoppingListID', { descending: true });
      if (shoppingListIDs) {
        q = q.in('shoppingListID', shoppingListIDs);
      }
      let returnData;
      const { data: shoppingLists, error } = await q;

      if (error) {
        throw errorGen(`*shoppingLists-getShoppingLists* Error getting shopping lists: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
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
          throw errorGen(
            createListError.message || `*shoppingLists-getShoppingLists* Error creating new shopping list: ${createListError.message}`,
            createListError.code || 520,
            createListError.name || 'unhandledError_shoppingLists-getShoppingLists',
            createListError.isOperational || false,
            createListError.severity || 2,
          );
        }
        const { data: newShoppingLists, error: newShoppingListsError } = await q;
        if (newShoppingListsError) {
          throw errorGen(`*shoppingLists-getShoppingLists* Error getting shopping lists: ${newShoppingListsError.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        returnData = newShoppingLists;
      } else {
        returnData = shoppingLists;
      }
      global.logger.info({ message: `*shoppingLists-getShoppingLists* Got ${returnData.length} shopping lists`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return returnData;
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-getShoppingLists* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-getShoppingLists', err.isOperational || false, err.severity || 2);
    }
  }

  async function getShared(options) {
    const { userID } = options;

    try {
      // first check state of each to ensure they're marked as fulfilled if needed
      await refreshShoppingLists({ userID });
      const { data: sharedLists, error } = await db.from('sharedShoppingLists').select('*').or(`userID.eq.${userID},invitedUserID.eq.${userID}`);
      if (error) {
        throw errorGen(`*shoppingLists-getShared* Error getting shared shopping lists: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*shoppingLists-getShared* Got ${sharedLists.length} shared shopping lists`, level: 6, timestamp: new Date().toISOString(), userID });
      return sharedLists;
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-getShared* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-shared', err.isOperational || false, err.severity || 2);
    }
  }

  async function createShoppingList(options) {
    const { userID, customID, authorization } = options;

    try {
      if (!customID) {
        throw errorGen(`*shoppingLists-createShoppingList* Error creating shoppingList: customID is missing`, 510, 'dataValidationErr', false, 3);
      }

      //only create a shoppingList if one doesn't already exist for user with 'status' = 'draft' or 'shopping'
      const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('userID', 'eq', userID).in('status', ['draft', 'shopping']);
      if (existingShoppingListError) {
        throw errorGen(`*shoppingLists-createShoppingList* Error creating shoppingList: ${existingShoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingShoppingList.length > 0) {
        throw errorGen(`*shoppingLists-createShoppingList* Error creating shoppingList: shoppingList already exists`, 515, 'cannotComplete', false, 3);
      }

      //create the shoppingList
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').insert({ userID, shoppingListID: customID, status: 'draft' }).select().single();
      if (shoppingListError) {
        throw errorGen(`*shoppingLists-createShoppingList* Error creating shoppingList: ${shoppingListError.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      //add a 'created' log entry
      createShoppingLog(userID, authorization, 'createShoppingList', shoppingList.shoppingListID, null, null, null, `createdShoppingList: ${shoppingList.shoppingListID}`);
      return { shoppingListID: shoppingList.shoppingListID };
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-createShoppingList* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-createShoppingList', err.isOperational || false, err.severity || 2);
    }
  }

  async function updateShoppingList(options) {
    const { userID, authorization, shoppingListID, status, fulfilledMethod } = options;

    try {
      global.logger.info({ message: `*shoppingLists-updateShoppingList* Updating shoppingList ${shoppingListID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      //verify that the provided shoppingListID exists
      const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select().filter('shoppingListID', 'eq', shoppingListID).single();
      if (existingShoppingListError) {
        throw errorGen(`*shoppingLists-updateShoppingList* Error updating shoppingList: ${existingShoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!existingShoppingList) {
        throw errorGen(`*shoppingLists-updateShoppingList* Error updating shoppingList: shoppingList does not exist`, 515, 'cannotComplete', false, 3);
      }

      //If provided, verify that the status is 'shopping', 'draft', or 'fulfilled'
      if (status && !['shopping', 'draft', 'fulfilled'].includes(status)) {
        throw errorGen(`*shoppingLists-updateShoppingList* Error updating shoppingList: status must be "shopping", "draft", or "fulfilled"`, 510, 'dataValidationErr', false, 3);
      }

      //if status is 'fulfilled', verify that fulfilledMethod exists and is either 'manual' or 'pickup'
      if (status === 'fulfilled' && (!fulfilledMethod || !['manual', 'pickup'].includes(fulfilledMethod))) {
        throw errorGen(`*shoppingLists-updateShoppingList* Error updating shoppingList: fulfilledMethod must be "manual" or "pickup"`, 510, 'dataValidationErr', false, 3);
      }

      //update the shoppingList
      const updateFields = {};
      for (let key in options) {
        if (key !== 'authorization' && key !== 'shoppingListID' && options[key] !== undefined) {
          updateFields[key] = options[key];
        }
      }

      const updatedShoppingList = await updater(userID, authorization, 'shoppingListID', shoppingListID, 'shoppingLists', updateFields);
      //if the list was fulfilled, create a new draft list using axios, only if none currently exists
      if (status === 'fulfilled') {
        const { data: shoppingLists, error: shoppingListsError } = await db.from('shoppingLists').select('shoppingListID').filter('userID', 'eq', userID).in('status', ['draft', 'shopping']);
        if (shoppingListsError) {
          throw errorGen(`*shoppingLists-updateShoppingList* Error getting shoppingLists: ${shoppingListsError.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        if (shoppingLists.length === 0) {
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
              createListError.message || `*shoppingLists-updateShoppingList* Error creating new shopping list after updating ${shoppingListID} to 'fulfilled': ${createListError.message}`,
              createListError.code || 520,
              createListError.name || 'unhandledError_shoppingLists-updateShoppingList',
              createListError.isOperational || false,
              createListError.severity || 2,
            );
          }
        }

        // also need to delete any sharedShoppingLists associated with the fulfilled list
        const { data: sharedShoppingLists, error: sharedShoppingListsError } = await db.from('sharedShoppingLists').delete().eq('shoppingListID', shoppingListID);
        if (sharedShoppingListsError) {
          throw errorGen(`*shoppingLists-updateShoppingList* Error deleting sharedShoppingLists for shoppingList ${shoppingListID}: ${sharedShoppingListsError.message}`, 513, 'failSupabaseDelete', true, 3);
        }
      }
      return updatedShoppingList;
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-updateShoppingList* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-updateShoppingList', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteShoppingList(options) {
    const { shoppingListID } = options;

    try {
      // attempt to delete the children of the shopping list
      const { data, error2 } = await dbPublic.rpc('shopping_list_children_delete', { shoppinglist: Number(shoppingListID) });
      if (error2) {
        throw errorGen(`*shoppingLists-deleteShoppingList* Error deleting shoppingList children: ${error2.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      if (data === 'NONE') {
        throw errorGen(`*shoppingLists-deleteShoppingList* Shopping List with ID ${shoppingListID} does not exist, cannot delete`, 515, 'cannotComplete', false, 3);
      } else if (!data) {
        throw errorGen(`*shoppingLists-deleteShoppingList* Error deleting shoppingList children: ${error2.message}`, 514, 'failSupabaseDelete', true, 3);
      }

      global.logger.info({ message: `*shoppingLists-deleteShoppingList* here`, level: 6, timestamp: new Date().toISOString(), userID: options.userID || 0 });

      //we don't actually delete the list, we just remove the child recipes and standalone ingredients
      return { shoppingListID: shoppingListID };
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-deleteShoppingList* Unhandled Error in shoppingLists deleteShoppingList', err.code || 520, err.name || 'unhandledError_shoppingLists-deleteShoppingList', err.isOperational || false, err.severity || 2);
    }
  }

  async function receiveItems(options) {
    const { authorization, userID, purchasedBy, shoppingListID, items, store } = options;
    console.log(`SLI: ${JSON.stringify(items)}, store: ${store}, purchasedBy: ${purchasedBy}, shoppingListID: ${shoppingListID}, userID: ${userID}`);

    try {
      if (!shoppingListID) {
        throw errorGen(`*shoppingLists-receiveItems* Error updating shoppingList: shoppingListID is missing`, 510, 'dataValidationErr', false, 3);
      }
      // get the shoppingList
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select().filter('shoppingListID', 'eq', shoppingListID).single();
      if (shoppingListError) {
        throw errorGen(`*shoppingLists-receiveItems* Error getting shoppingList ${shoppingListID}: ${shoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!shoppingList) {
        throw errorGen(`*shoppingLists-receiveItems* Error updating shoppingList: shoppingList does not exist`, 515, 'cannotComplete', false, 3);
      }

      if (!store) {
        throw errorGen(`*shoppingLists-receiveItems* Error updating shoppingList: store is missing`, 510, 'dataValidationErr', false, 3);
      }
      // validate each provided items has needed properties
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.ingredientID || !item.purchasedMeasurement || !item.purchasedDate || item.purchasedMeasurement < 0) {
          throw errorGen(`*shoppingLists-receiveItems* Error updating shoppingList: items must have ingredientID, measurement, and purchasedDate`, 510, 'dataValidationErr', false, 3);
        }
      }

      // build list of promises to create items
      const itemPromises = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        itemPromises.push(createIngredientStockEntry(authorization, userID, item));
      }
      itemResults = await Promise.all(itemPromises);

      // if any failed, or if any are missing 'ingredientStockID', throw error
      if (itemResults.some((result) => !result.ingredientStockID)) {
        throw errorGen(`*shoppingLists-receiveItems* Error while adding ingredientStocks during shoppingList receiveItems`, 520, 'unhandledError_shoppingLists-receiveItems', false, 3);
      }

      // build list of promises to update shoppingListIngredients
      const shoppingListIngredientUpdatePromises = [];
      for (let i = 0; i < items.length; i++) {
        const sli = items[i];
        shoppingListIngredientUpdatePromises.push(updateShoppingListIngredient(authorization, userID, sli.purchasedMeasurement, purchasedBy, store, sli.shoppingListIngredientID));
      }
      shoppingListIngredientUpdateResults = await Promise.all(shoppingListIngredientUpdatePromises);

      // if any failed, throw error
      if (shoppingListIngredientUpdateResults.some((result) => !result)) {
        throw errorGen(`*shoppingLists-receiveItems* Error while updating shoppingListIngredients during shoppingList receiveItems`, 520, 'unhandledError_shoppingLists-receiveItems', false, 3);
      }

      // get all shoppingListIngredients for the shoppingList
      const { data: shoppingListIngredients, error: shoppingListIngredientsError } = await db.from('shoppingListIngredients').select('shoppingListIngredientID, needMeasurement, purchasedMeasurement').filter('shoppingListID', 'eq', shoppingListID).filter('deleted', 'eq', false);
      if (shoppingListIngredientsError) {
        throw errorGen(`*shoppingLists-receiveItems* Error getting shoppingListIngredients for shoppingList ${shoppingListID}: ${shoppingListIngredientsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // if all have been purchased (greater than or equal to needMeasurement), update the shoppingList to 'fulfilled' and remove any associated sharedShoppingLists
      if (shoppingListIngredients.every((sli) => sli.purchasedMeasurement >= sli.needMeasurement)) {
        await updateShoppingList({ userID, authorization, shoppingListID, status: 'fulfilled', fulfilledMethod: 'manual', fulfilledDate: new Date().toISOString() });
      }

      global.logger.info({ message: `*shoppingLists-receiveItems* Received ${items.length} items for shoppingList ${shoppingListID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return { shoppingListID: shoppingListID };
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-receiveItems* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-receiveItems', err.isOperational || false, err.severity || 2);
    }
  }

  createIngredientStockEntry = async (authorization, userID, item) => {
    try {
      global.logger.info({ message: `*shoppingLists-createIngredientStockEntry* Creating ingredientStock entry for item: ${JSON.stringify(item)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      const { data } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks`,
        {
          authorization,
          IDtype: 13,
          ingredientID: item.ingredientID,
          userID,
          measurement: item.purchasedMeasurement,
          purchasedDate: item.purchasedDate,
        },
        { headers: { authorization } },
      );
      return { ingredientStockID: data.ingredientStockID };
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-createIngredientStockEntry* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-createIngredientStockEntry', err.isOperational || false, err.severity || 2);
    }
  };

  updateShoppingListIngredient = async (authorization, userID, purchasedMeasurement, purchasedBy, store, shoppingListIngredientID) => {
    try {
      global.logger.info({ message: `*shoppingLists-updateShoppingListIngredient* Updating shoppingListIngredient ${shoppingListIngredientID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      const { data } = await axios.patch(
        `${process.env.NODE_HOST}:${process.env.PORT}/shopping/listIngredients/${shoppingListIngredientID}`,
        {
          authorization,
          userID,
          purchasedBy,
          purchasedMeasurement,
          store,
        },
        { headers: { authorization } },
      );
      return data;
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-updateShoppingListIngredient* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-updateShoppingListIngredient', err.isOperational || false, err.severity || 2);
    }
  };

  share = async (options) => {
    const { userID, authorization, shoppingListID, invitedUserID } = options;

    try {
      // verify that the shoppingList exists and is in 'shopping' status
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select().filter('shoppingListID', 'eq', shoppingListID).single();
      if (shoppingListError) {
        throw errorGen(`*shoppingLists-share* Error sharing shoppingList: ${shoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!shoppingList) {
        throw errorGen(`*shoppingLists-share* Error sharing shoppingList: shoppingList does not exist`, 515, 'cannotComplete', false, 3);
      }
      if (shoppingList.status !== 'shopping') {
        throw errorGen(`*shoppingLists-share* Error sharing shoppingList: shoppingList is not in 'shopping' status`, 515, 'cannotComplete', false, 3);
      }

      // verify that we have a 'confirmed' friendship with the invited user
      const { data: friendship, error: friendshipError } = await db.from('friendships').select().filter('userID', 'eq', userID).filter('friend', 'eq', invitedUserID).filter('status', 'eq', 'confirmed').single();
      if (friendshipError) {
        throw errorGen(`*shoppingLists-share* Error sharing shoppingList: ${friendshipError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!friendship) {
        throw errorGen(`*shoppingLists-share* Error sharing shoppingList: friendship with invited user is not 'confirmed'`, 515, 'cannotComplete', false, 3);
      }

      // verify we don't already have a sharedShoppingList with the invited user
      const { data: existingSharedShoppingList, error: existingSharedShoppingListError } = await db.from('sharedShoppingLists').select().filter('userID', 'eq', userID).filter('invitedUserID', 'eq', invitedUserID).filter('shoppingListID', 'eq', shoppingListID);
      if (existingSharedShoppingListError) {
        throw errorGen(`*shoppingLists-share* Error sharing shoppingList: ${existingSharedShoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingSharedShoppingList.length > 0) {
        throw errorGen(`*shoppingLists-share* Error sharing shoppingList: shoppingList is already shared with invited user`, 515, 'cannotComplete', false, 3);
      }

      // create the sharedShoppingList
      const { data: sharedShoppingList, error: sharedShoppingListError } = await db.from('sharedShoppingLists').insert({ userID, shoppingListID, invitedUserID }).select().single();
      if (sharedShoppingListError) {
        throw errorGen(`*shoppingLists-share* Error sharing shoppingList: ${sharedShoppingListError.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      global.logger.info({ message: `*shoppingLists-share* Shared shoppingList ${shoppingListID} with ${invitedUserID}`, level: 6, timestamp: new Date().toISOString(), userID });
      return { shoppingListID: shoppingListID };
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-share* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-share', err.isOperational || false, err.severity || 2);
    }
  };

  unshare = async (options) => {
    const { userID, authorization, shoppingListID, invitedUserID } = options;

    try {
      global.logger.info(`*shoppingLists-unshare* Unsharing shoppingList ${shoppingListID} with ${invitedUserID}`);
      // attempt to remove any sharedShoppingLists with the invited user
      const { data: sharedShoppingLists, error: sharedShoppingListsError } = await db.from('sharedShoppingLists').delete().eq('userID', userID).eq('invitedUserID', invitedUserID).eq('shoppingListID', shoppingListID);
      if (sharedShoppingListsError) {
        throw errorGen(`*shoppingLists-unshare* Error unsharing shoppingList: ${sharedShoppingListsError.message}`, 513, 'failSupabaseDelete', true, 3);
      }

      return { shoppingListID: shoppingListID };
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-unshare* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-unshare', err.isOperational || false, err.severity || 2);
    }
  };

  refreshShoppingLists = async (options) => {
    console.log(`*shoppingLists-refreshShoppingLists* Refreshing shopping lists`);
    const { userID } = options;

    try {
      // check for and remove duplicate 'draft' shoppingLists. If more than one, delete all but oldest by shoppingListID
      const { data: draftShoppingLists, error: draftShoppingListsError } = await db.from('shoppingLists').select('shoppingListID').filter('userID', 'eq', userID).eq('status', 'draft');
      if (draftShoppingListsError) {
        throw errorGen(`*shoppingLists-refreshShoppingLists* Error getting draft shopping lists: ${draftShoppingListsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (draftShoppingLists.length > 1) {
        const sortedDraftShoppingLists = draftShoppingLists.sort((a, b) => a.shoppingListID - b.shoppingListID);
        const shoppingListIDsToDelete = sortedDraftShoppingLists.slice(1).map((dsl) => dsl.shoppingListID);
        const { data: deleteResults, error: deleteResultsError } = await db.from('shoppingLists').delete().in('shoppingListID', shoppingListIDsToDelete);
        if (deleteResultsError) {
          throw errorGen(`*shoppingLists-refreshShoppingLists* Error deleting duplicate draft shopping lists: ${deleteResultsError.message}`, 513, 'failSupabaseDelete', true, 3);
        }
      }

      // get all unfulfilled shoppingLists for the user
      const { data: shoppingLists, error: shoppingListsError } = await db.from('shoppingLists').select('shoppingListID, status, fulfilledDate, fulfilledMethod').filter('userID', 'eq', userID).eq('status', 'shopping');
      if (shoppingListsError) {
        throw errorGen(`*shoppingLists-refreshShoppingLists* Error getting shopping lists: ${shoppingListsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // for each list, get all shoppingListIngredients. If purchasedMeasurement >= needMeasurement for all ingredients, update the list to 'fulfilled'
      const listsToFulfill = [];
      for (let i = 0; i < shoppingLists.length; i++) {
        const shoppingList = shoppingLists[i];
        const { data: shoppingListIngredients, error: shoppingListIngredientsError } = await db.from('shoppingListIngredients').select('shoppingListIngredientID, needMeasurement, purchasedMeasurement').filter('shoppingListID', 'eq', shoppingList.shoppingListID).filter('deleted', 'eq', false);
        if (shoppingListIngredientsError) {
          throw errorGen(`*shoppingLists-refreshShoppingLists* Error getting shoppingListIngredients for shoppingList ${shoppingList.shoppingListID}: ${shoppingListIngredientsError.message}`, 511, 'failSupabaseSelect', true, 3);
        }

        if (shoppingListIngredients.every((sli) => sli.purchasedMeasurement >= sli.needMeasurement)) {
          listsToFulfill.push(shoppingList.shoppingListID);
        }
      }

      // update all lists that need to be fulfilled
      console.log(`*shoppingLists-refreshShoppingLists* Found ${listsToFulfill.length} shopping lists to fulfill`);
      const updatePromises = [];
      for (let i = 0; i < listsToFulfill.length; i++) {
        updatePromises.push(updateShoppingList({ userID, shoppingListID: listsToFulfill[i], status: 'fulfilled', fulfilledMethod: 'manual', fulfilledDate: new Date().toISOString() }));
      }
      await Promise.all(updatePromises);
    } catch (err) {
      throw errorGen(err.message || '*shoppingLists-refreshShoppingLists* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLists-refreshShoppingLists', err.isOperational || false, err.severity || 2);
    }
  };

  return {
    get: {
      byID: getShoppingListByID,
      all: getShoppingLists,
      shared: getShared,
    },
    share,
    unshare,
    create: createShoppingList,
    update: updateShoppingList,
    delete: deleteShoppingList,
    receiveItems,
    refreshShoppingLists,
  };
};
