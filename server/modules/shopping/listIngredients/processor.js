('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');
const { updater } = require('../../../db');

module.exports = ({ db }) => {
  async function getShoppingListIngredientByID (options) {
    const { shoppingListIngredientID } = options;
    const { data: shoppingListIngredient, error } = await db.from('shoppingListIngredients').select('shoppingListIngredientID, shoppingListID, ingredientID, needMeasurement, needUnit, source, purchasedMeasurement, purchasedUnit, store').filter('shoppingListIngredientID', 'eq', shoppingListIngredientID).filter('deleted', 'eq', false).single();
    if (error) {
      global.logger.info(`Error getting shopping list ingredient ${shoppingListIngredientID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info('Got shoppingListIngredient');
    return shoppingListIngredient;
  }

  async function getIngredientsByShoppingList (options) {
    const { userID, shoppingListID } = options;
    const { data: shoppingListIngredients, error } = await db.from('shoppingListIngredients').select('shoppingListIngredientID, shoppingListID, ingredientID, needMeasurement, needUnit, source, purchasedMeasurement, purchasedUnit, store').filter('shoppingListID', 'eq', shoppingListID).filter('deleted', 'eq', false);
    if (error) {
      global.logger.info(`Error getting shopping list ingredients: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${shoppingListIngredients.length} ingredients for shoppingList ${shoppingListID}`);
    return shoppingListIngredients;
  }

  async function createShoppingListIngredient (options) {
    const { userID, customID, authorization, shoppingListID, ingredientID, needMeasurement, needUnit, source } = options;
    if (!customID) {
      global.logger.info('Error creating shoppingListIngredient: customID is missing');
      return { error: 'customID is missing' };
    }

    //verify that provided shoppingList exists and is in draft status
    const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListID).filter('status', 'eq', 'draft');
    if (shoppingListError) {
      global.logger.info(`Error creating shoppingListIngredient: ${shoppingListError.message}`);
      return { error: shoppingListError.message };
    }
    if (shoppingList.length === 0) {
      global.logger.info('Error creating shoppingListIngredient: shoppingList does not exist or is not in draft status');
      return { error: 'shoppingList does not exist or is not in draft status' };
    }

    //verify that provided ingredient exists
    const { data: ingredient, error: ingredientError } = await db.from('ingredients').select('ingredientID').filter('ingredientID', 'eq', ingredientID).filter('deleted', 'eq', false);
    if (ingredientError) {
      global.logger.info(`Error creating shoppingListIngredient: ${ingredientError.message}`);
      return { error: ingredientError.message };
    }
    if (ingredient.length === 0) {
      global.logger.info('Error creating shoppingListIngredient: ingredient does not exist');
      return { error: 'ingredient does not exist' };
    }

    //verify no other shoppingListIngredient exists for this shoppingList and ingredient
    const { data: existingShoppingListIngredient, error: existingShoppingListIngredientError } = await db.from('shoppingListIngredients').select('shoppingListIngredientID').filter('shoppingListID', 'eq', shoppingListID).filter('ingredientID', 'eq', ingredientID).filter('deleted', 'eq', false);
    if (existingShoppingListIngredientError) {
      global.logger.info(`Error creating shoppingListIngredient: ${existingShoppingListIngredientError.message}`);
      return { error: existingShoppingListIngredientError.message };
    }
    if (existingShoppingListIngredient.length > 0) {
      global.logger.info('Error creating shoppingListIngredient: shoppingListIngredient already exists');
      return { error: 'shoppingListIngredient already exists' };
    }

    //create shoppingListIngredient
    const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').insert({ userID, shoppingListIngredientID: customID, shoppingListID, ingredientID, needMeasurement, needUnit, source }).select('*').single();
    if (shoppingListIngredientError) {
      global.logger.info(`Error creating shoppingListIngredient: ${shoppingListIngredientError.message}`);
      return { error: shoppingListIngredientError.message };
    }
    //add a 'addedIngredientToShoppingList' log
    await createShoppingLog(userID, authorization, 'addIngredientToShoppingList', Number(shoppingListIngredient.shoppingListIngredientID), Number(shoppingListID), null, null, `addedIngredientToShoppingList: ${shoppingListIngredient.shoppingListIngredientID}`);

    return { shoppingListIngredientID: shoppingListIngredient.shoppingListIngredientID };
  }

  async function updateShoppingListIngredient (options) {
    const { userID, authorization, shoppingListIngredientID, purchasedMeasurement, purchasedUnit, store } = options;

    //verify that provided shoppingListIngredient exists
    const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').select('*').filter('shoppingListIngredientID', 'eq', shoppingListIngredientID).filter('deleted', 'eq', false);
    if (shoppingListIngredientError) {
      global.logger.info(`Error updating shoppingListIngredient: ${shoppingListIngredientError.message}`);
      return { error: shoppingListIngredientError.message };
    }
    if (shoppingListIngredient.length === 0) {
      global.logger.info('Error updating shoppingListIngredient: shoppingListIngredient does not exist');
      return { error: 'shoppingListIngredient does not exist' };
    }

    //verify that provided shoppingList exists and is not deleted
    const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID).filter('status', 'neq', 'deleted');
    if (shoppingListError) {
      global.logger.info(`Error updating shoppingListIngredient: ${shoppingListError.message}`);
      return { error: shoppingListError.message };
    }
    if (shoppingList.length === 0) {
      global.logger.info('Error updating shoppingListIngredient: shoppingList does not exist');
      return { error: 'shoppingList does not exist' };
    }

    //update shoppingListIngredient
    const updateFields = {};
    if (purchasedMeasurement) updateFields.purchasedMeasurement = purchasedMeasurement;
    if (purchasedUnit) updateFields.purchasedUnit = purchasedUnit;
    if (store) updateFields.store = store;
    try {
      const updatedShoppingListIngredient = await updater(userID, authorization, 'shoppingListIngredientID', shoppingListIngredientID, 'shoppingListIngredients', updateFields);
      return updatedShoppingListIngredient;
    } catch (error) {
      global.logger.info(`Error updating shoppingListIngredient: ${error.message}`);
      return { error: error.message };
    }

    //add a 'updatedIngredientInShoppingList' log entry
  }

  async function deleteShoppingListIngredient (options) {
    const { userID, authorization, shoppingListIngredientID } = options;

    //verify that provided shoppingListIngredient exists
    const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').select('*').filter('shoppingListIngredientID', 'eq', shoppingListIngredientID).filter('deleted', 'eq', false);
    if (shoppingListIngredientError) {
      global.logger.info(`Error deleting shoppingListIngredient: ${shoppingListIngredientError.message}`);
      return { error: shoppingListIngredientError.message };
    }
    if (shoppingListIngredient.length === 0) {
      global.logger.info('Error deleting shoppingListIngredient: shoppingListIngredient does not exist');
      return { error: 'shoppingListIngredient does not exist' };
    }

    //verify that provided shoppingList exists and is in draft status
    const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID).filter('status', 'eq', 'draft');
    if (shoppingListError) {
      global.logger.info(`Error deleting shoppingListIngredient: ${shoppingListError.message}`);
      return { error: shoppingListError.message };
    }
    if (shoppingList.length === 0) {
      global.logger.info('Error deleting shoppingListIngredient: shoppingList does not exist or is not in draft status');
      return { error: 'shoppingList does not exist or is not in draft status' };
    }

    //delete shoppingListIngredient
    const { error: deleteError } = await db.from('shoppingListIngredients').update({ deleted: true }).filter('shoppingListIngredientID', 'eq', shoppingListIngredientID);
    if (deleteError) {
      global.logger.info(`Error deleting shoppingListIngredient: ${deleteError.message}`);
      return { error: deleteError.message };
    }
    //add a 'deleted' log entry
    await createShoppingLog(userID, authorization, 'deleteIngredientFromShoppingList', Number(shoppingListIngredientID), Number(shoppingListIngredient[0].shoppingListID), null, null, `deletedIngredientFromShoppingList: ${shoppingListIngredientID}`);
  }

  return {
    get: {
      by: {
        ID: getShoppingListIngredientByID,
        shoppingList: getIngredientsByShoppingList,
      }
    },
    create: createShoppingListIngredient,
    update: updateShoppingListIngredient,
    delete: deleteShoppingListIngredient,
  }
}