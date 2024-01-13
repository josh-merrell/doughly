('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');
const { updater } = require('../../../db');
const { default: axios } = require('axios');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getShoppingListByID(options) {
    const { shoppingListID } = options;
    const { data: shoppingList, error } = await db.from('shoppingLists').select('shoppingListID, status, fulfilledDate, fulfilledMethod').where('shoppingListID', shoppingListID).single();
    if (error) {
      global.logger.error(`Error getting shopping list ${shoppingListID}: ${error.message}`);
      throw errorGen(`Error getting shopping list ${shoppingListID}`, 400);
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
  }

  async function createShoppingList(options) {
    const { userID, customID, authorization } = options;
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
  }

  async function updateShoppingList(options) {
    const { userID, authorization, shoppingListID, status, fulfilledMethod } = options;

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

    try {
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
    } catch (error) {
      global.logger.error(`Error updating shoppingList with ID: ${shoppingListID}: ${error.message}`);
      throw errorGen(`Error updating shoppingList with ID: ${shoppingListID}`, 400);
    }
  }

  async function deleteShoppingList(options) {
    const { userID, authorization, shoppingListID } = options;

    //verify that the provided shoppingListID exists
    const { data: existingShoppingList, error: existingShoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListID).single();
    if (existingShoppingListError) {
      global.logger.error(`Error getting shoppingList: ${existingShoppingListError.message}`);
      throw errorGen(`Error getting shoppingList`, 400);
    }
    if (!existingShoppingList) {
      global.logger.error('Error deleting shoppingList: shoppingList does not exist');
      throw errorGen('shoppingList does not exist', 400);
    }

    //delete any shoppingListRecipes for this shoppingList using axios calls
    const { data: shoppingListRecipes, error: shoppingListRecipesError } = await db.from('shoppingListRecipes').select('shoppingListRecipeID').filter('shoppingListID', 'eq', shoppingListID).filter('deleted', 'eq', false);
    if (shoppingListRecipesError) {
      global.logger.error(`Error getting shoppingListRecipes while clearing shoppingList ID: ${shoppingListID}: ${shoppingListRecipesError.message}`);
      throw errorGen(`Error getting shoppingListRecipes while clearing shoppingList ID: ${shoppingListID}`, 400);
    }
    if (shoppingListRecipes.length > 0) {
      for (let i = 0; i < shoppingListRecipes.length; i++) {
        const { error: deleteShoppingListRecipeError } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/shopping/listRecipes/${shoppingListRecipes[i].shoppingListRecipeID}`, {
          data: {
            userID: userID,
            authorization: authorization,
          },
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        });
        if (deleteShoppingListRecipeError) {
          global.logger.error(`Error deleting shoppingListRecipe ID: ${shoppingListRecipes[i].shoppingListRecipeID}: ${deleteShoppingListRecipeError.message}`);
          throw errorGen(`Error deleting shoppingListRecipe ID: ${shoppingListRecipes[i].shoppingListRecipeID}`, 400);
        }
      }
    }

    //delete any standalone shoppingListIngredients for this shoppingList using axios calls
    const { data: shoppingListIngredients, error: shoppingListIngredientsError } = await db.from('shoppingListIngredients').select('shoppingListIngredientID').filter('shoppingListID', 'eq', shoppingListID).filter('deleted', 'eq', false).filter('source', 'eq', 'standalone');
    if (shoppingListIngredientsError) {
      global.logger.error(`Error getting standalone ingredients while clearing shoppingList ID: ${shoppingListID}: ${shoppingListIngredientsError.message}`);
      throw errorGen(`Error getting standalone ingredients while clearing shoppingList ID: ${shoppingListID}`, 400);
    }
    if (shoppingListIngredients.length > 0) {
      for (let i = 0; i < shoppingListIngredients.length; i++) {
        const { error: deleteShoppingListIngredientError } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/shopping/listIngredients/${shoppingListIngredients[i].shoppingListIngredientID}`, {
          data: {
            userID: userID,
            authorization: authorization,
          },
          headers: {
            'Content-Type': 'application/json',
            authorization: 'override',
          },
        });
        if (deleteShoppingListIngredientError) {
          global.logger.error(`Error deleting shoppingListIngredient ID: ${shoppingListIngredients[i].shoppingListIngredientID}: ${deleteShoppingListIngredientError.message}`);
          throw errorGen(`Error deleting shoppingListIngredient ID: ${shoppingListIngredients[i].shoppingListIngredientID}`, 400);
        }
      }
    }

    //we don't actually delete the list, we just remove the child recipes and standalone ingredients
    return { shoppingListID: shoppingListID };
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
