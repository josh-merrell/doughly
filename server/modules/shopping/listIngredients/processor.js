('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');
const { updater } = require('../../../db');
const { default: axios } = require('axios');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getShoppingListIngredientByID(options) {
    const { shoppingListIngredientID } = options;
    const { data: shoppingListIngredient, error } = await db
      .from('shoppingListIngredients')
      .select('shoppingListIngredientID, shoppingListID, ingredientID, needMeasurement, needUnit, source, purchasedMeasurement, purchasedUnit, store')
      .filter('shoppingListIngredientID', 'eq', shoppingListIngredientID)
      .filter('deleted', 'eq', false)
      .single();
    if (error) {
      global.logger.error(`Error getting shopping list ingredient ${shoppingListIngredientID}: ${error.message}`);
      throw errorGen(`Error getting shopping list ingredient ${shoppingListIngredientID}`, 400);
    }
    global.logger.info('Got shoppingListIngredient');
    return shoppingListIngredient;
  }

  async function getIngredientsByShoppingList(options) {
    const { userID, shoppingListID } = options;
    const { data: shoppingListIngredients, error } = await db
      .from('shoppingListIngredients')
      .select('shoppingListIngredientID, shoppingListID, ingredientID, needMeasurement, needUnit, source, purchasedMeasurement, purchasedUnit, store')
      .filter('shoppingListID', 'eq', shoppingListID)
      .filter('deleted', 'eq', false);
    if (error) {
      global.logger.error(`Error getting shopping list ingredients: ${error.message}`);
      throw errorGen(`Error getting shopping list ingredients`, 400);
    }
    global.logger.info(`Got ${shoppingListIngredients.length} ingredients for shoppingList ${shoppingListID}`);
    return shoppingListIngredients;
  }

  async function createShoppingListIngredient(options) {
    const { userID, customID, authorization, shoppingListID, ingredientID, needMeasurement, needUnit, source } = options;
    if (!customID) {
      global.logger.error('customID is missing');
      throw errorGen('customID is missing', 400);
    }

    //verify that provided shoppingList exists and is in draft status
    const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListID).filter('status', 'eq', 'draft');
    if (shoppingListError) {
      global.logger.error(`Error getting shoppingList: ${shoppingListError.message}`);
      throw errorGen(`Error getting shoppingList: ${shoppingListError.message}`, 400);
    }
    if (shoppingList.length === 0) {
      global.logger.error('shoppingList does not exist or is not in draft status');
      throw errorGen('shoppingList does not exist or is not in draft status', 400);
    }

    //verify that provided ingredient exists
    const { data: ingredient, error: ingredientError } = await db.from('ingredients').select('ingredientID').filter('ingredientID', 'eq', ingredientID).filter('deleted', 'eq', false);
    if (ingredientError) {
      global.logger.error(`Error getting ingredient: ${ingredientError.message}`);
      throw errorGen(`Error getting ingredient: ${ingredientError.message}`, 400);
    }
    if (ingredient.length === 0) {
      global.logger.error(`ingredient does not exist`);
      throw errorGen(`ingredient does not exist`, 400);
    }

    //verify no other shoppingListIngredient exists for this shoppingList and ingredient
    const { data: existingShoppingListIngredient, error: existingShoppingListIngredientError } = await db.from('shoppingListIngredients').select('shoppingListIngredientID').filter('shoppingListID', 'eq', shoppingListID).filter('ingredientID', 'eq', ingredientID).filter('deleted', 'eq', false);
    if (existingShoppingListIngredientError) {
      global.logger.error(`error getting existing shoppingListIngredients`);
      throw errorGen(`error getting existing shoppingListIngredients`, 400);
    }
    if (existingShoppingListIngredient.length > 0) {
      global.logger.error(`this ingredient already exists on this shoppingList`);
      throw errorGen(`this ingredient already exists on this shoppingList`, 400);
    }

    // create shoppingListIngredient
    const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').insert({ userID, shoppingListIngredientID: customID, shoppingListID, ingredientID, needMeasurement, needUnit, source }).select('*').single();
    if (shoppingListIngredientError) {
      global.logger.error(`Error creating shoppingListIngredient with ID ${customID}: ${shoppingListIngredientError.message}`);
      throw errorGen(`Error creating shoppingListIngredient with ID ${customID}: ${shoppingListIngredientError.message}`, 400);
    }
    //add a 'addedIngredientToShoppingList' log
    await createShoppingLog(userID, authorization, 'addIngredientToShoppingList', Number(shoppingListIngredient.shoppingListIngredientID), Number(shoppingListID), null, null, `addedIngredientToShoppingList: ${shoppingListIngredient.shoppingListIngredientID}`);

    return { shoppingListIngredientID: shoppingListIngredient.shoppingListIngredientID };
  }

  async function updateShoppingListIngredient(options) {
    const { userID, authorization, shoppingListIngredientID, purchasedMeasurement, purchasedUnit, store } = options;

    //verify that provided shoppingListIngredient exists
    const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').select('*').filter('shoppingListIngredientID', 'eq', shoppingListIngredientID).filter('deleted', 'eq', false);
    if (shoppingListIngredientError) {
      global.logger.error(`Error getting shoppingListIngredient: ${shoppingListIngredientError.message}`);
      throw errorGen(`Error getting shoppingListIngredient: ${shoppingListIngredientError.message}`, 400);
    }
    if (shoppingListIngredient.length === 0) {
      global.logger.error('shoppingListIngredient does not exist');
      throw errorGen('shoppingListIngredient does not exist', 400);
    }

    //verify that provided shoppingList exists and is not deleted
    const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID).filter('status', 'neq', 'deleted');
    if (shoppingListError) {
      global.logger.error(`Error getting shoppingList: ${shoppingListError.message}`);
      throw errorGen(`Error getting shoppingList: ${shoppingListError.message}`, 400);
    }
    if (shoppingList.length === 0) {
      global.logger.error('shoppingList does not exist');
      throw errorGen('shoppingList does not exist', 400);
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
      global.logger.error(`Error updating shoppingListIngredient: ${error.message}`);
      throw errorGen(`Error updating shoppingListIngredient: ${error.message}`, 400);
    }

    //add a 'updatedIngredientInShoppingList' log entry
  }

  async function deleteShoppingListIngredient(options) {
    const { userID, authorization, shoppingListIngredientID } = options;

    //verify that provided shoppingListIngredient exists
    const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').select('*').filter('shoppingListIngredientID', 'eq', shoppingListIngredientID).filter('deleted', 'eq', false);
    if (shoppingListIngredientError) {
      global.logger.error(`Error getting shoppingListIngredient: ${shoppingListIngredientError.message}`);
      throw errorGen(`Error getting shoppingListIngredient: ${shoppingListIngredientError.message}`, 400);
    }
    if (shoppingListIngredient.length === 0) {
      global.logger.error('shoppingListIngredient does not exist');
      return { error: 'shoppingListIngredient does not exist' };
    }

    //verify that provided shoppingList exists
    const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID, status').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID);
    if (shoppingListError) {
      global.logger.error(`Error getting shoppingList: ${shoppingListError.message}`);
      throw errorGen(`Error getting shoppingList: ${shoppingListError.message}`, 400);
    }
    if (shoppingList.length === 0) {
      global.logger.error('shoppingList does not exist');
      return { error: 'shoppingList does not exist' };
    }

    //delete shoppingListIngredient
    const { error: deleteError } = await db.from('shoppingListIngredients').update({ deleted: true }).filter('shoppingListIngredientID', 'eq', shoppingListIngredientID);
    if (deleteError) {
      global.logger.error(`Error deleting shoppingListIngredient: ${deleteError.message}`);
      throw errorGen(`Error deleting shoppingListIngredient: ${deleteError.message}`, 400);
    }

    //if shoppingList is in 'shopping' status, get any remaining shoppingListIngredients
    if (shoppingList[0].status === 'shopping') {
      const { data: remainingShoppingListIngredients, error: remainingShoppingListIngredientsError } = await db
        .from('shoppingListIngredients')
        .select('shoppingListIngredientID')
        .filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID)
        .filter('deleted', 'eq', false)
        .is('store', null);
      if (remainingShoppingListIngredientsError) {
        global.logger.error(`Error getting remaining shoppingListIngredients: ${remainingShoppingListIngredientsError}`);
        throw errorGen(`Error getting remaining shoppingListIngredients: ${remainingShoppingListIngredientsError}`, 400);
      }
      //if none remaining, delete any shoppingListRecipes and standalone ingredients, then set shoppingList status to 'draft'
      if (remainingShoppingListIngredients.length === 0) {
        //delete any shoppingListRecipes for this shoppingList using axios calls
        const { data: shoppingListRecipes, error: shoppingListRecipesError } = await db.from('shoppingListRecipes').select('shoppingListRecipeID').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID).filter('deleted', 'eq', false);
        if (shoppingListRecipesError) {
          global.logger.error(`Error getting shoppingListRecipes while clearing shoppingList ID: ${shoppingListIngredient[0].shoppingListID}: ${shoppingListRecipesError.message}`);
          throw errorGen(`Error getting shoppingListRecipes while clearing shoppingList ID: ${shoppingListIngredient[0].shoppingListID}: ${shoppingListRecipesError.message}`, 400);
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
              throw errorGen(`Error deleting shoppingListRecipe ID: ${shoppingListRecipes[i].shoppingListRecipeID}: ${deleteShoppingListRecipeError.message}`, 400);
            }
          }
        }

        //delete any standalone shoppingListIngredients for this shoppingList using axios calls
        const { data: shoppingListIngredients, error: shoppingListIngredientsError } = await db.from('shoppingListIngredients').select('shoppingListIngredientID').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID).filter('deleted', 'eq', false);
        if (shoppingListIngredientsError) {
          global.logger.error(`Error getting standalone ingredients while clearing shoppingList ID: ${shoppingListIngredient[0].shoppingListID}: ${shoppingListIngredientsError.message}`);
          throw errorGen(`Error getting standalone ingredients while clearing shoppingList ID: ${shoppingListIngredient[0].shoppingListID}: ${shoppingListIngredientsError.message}`, 400);
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
              global.logger.errror(`Error deleting shoppingListIngredient ID: ${shoppingListIngredients[i].shoppingListIngredientID}: ${deleteShoppingListIngredientError.message}`);
              throw errorGen(`Error deleting shoppingListIngredient ID: ${shoppingListIngredients[i].shoppingListIngredientID}: ${deleteShoppingListIngredientError.message}`, 400);
            }
          }
        }

        const updatedShoppingList = await updater(userID, authorization, 'shoppingListID', shoppingList[0].shoppingListID, 'shoppingLists', { status: 'draft' });
        return updatedShoppingList;
      }
    }

    //add a 'deleted' log entry
    await createShoppingLog(userID, authorization, 'deleteIngredientFromShoppingList', Number(shoppingListIngredientID), Number(shoppingListIngredient[0].shoppingListID), null, null, `deletedIngredientFromShoppingList: ${shoppingListIngredientID}`);
  }

  return {
    get: {
      by: {
        ID: getShoppingListIngredientByID,
        shoppingList: getIngredientsByShoppingList,
      },
    },
    create: createShoppingListIngredient,
    update: updateShoppingListIngredient,
    delete: deleteShoppingListIngredient,
  };
};
