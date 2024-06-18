('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');
const { updater } = require('../../../db');
const { default: axios } = require('axios');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getShoppingListIngredientByID(options) {
    const { shoppingListIngredientID } = options;

    try {
      const { data: shoppingListIngredient, error } = await db
        .from('shoppingListIngredients')
        .select('shoppingListIngredientID, shoppingListID, ingredientID, needMeasurement, needUnit, source, purchasedMeasurement, purchasedUnit, store')
        .filter('shoppingListIngredientID', 'eq', shoppingListIngredientID)
        .filter('deleted', 'eq', false)
        .single();
      if (error) {
        throw errorGen(`Error getting shopping list ingredient ${shoppingListIngredientID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got shoppingListIngredient`, level: 6, timestamp: new Date().toISOString(), userID: shoppingListIngredient.userID || 0 });
      return shoppingListIngredient;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in listIngredients getShoppingListIngredientByID', err.code || 520, err.name || 'unhandledError_listIngredients-getShoppingListIngredientByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function getIngredientsByShoppingList(options) {
    const { shoppingListID } = options;

    try {
      const { data: shoppingListIngredients, error } = await db
        .from('shoppingListIngredients')
        .select('shoppingListIngredientID, shoppingListID, ingredientID, needMeasurement, needUnit, source, purchasedMeasurement, purchasedUnit, store')
        .filter('shoppingListID', 'eq', shoppingListID)
        .filter('deleted', 'eq', false);
      if (error) {
        throw errorGen(`Error getting shopping list ingredients: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: ``, level: 6, timestamp: new Date().toISOString(), userID: shoppingListIngredients[0].userID || 0 });
      return shoppingListIngredients;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in listIngredients getIngredientsByShoppingList', err.code || 520, err.name || 'unhandledError_listIngredients-getIngredientsByShoppingList', err.isOperational || false, err.severity || 2);
    }
  }

  async function createShoppingListIngredient(options) {
    const { userID, customID, authorization, shoppingListID, ingredientID, needMeasurement, needUnit, source } = options;

    try {
      if (!customID) {
        throw errorGen(`customID is missing, can't create shoppingListIngredient`, 510, 'dataValidationErr', false, 3);
      }

      //verify that provided shoppingList exists and is in draft status
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListID).filter('status', 'eq', 'draft');
      if (shoppingListError) {
        throw errorGen(`Error getting shoppingList: ${shoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (shoppingList.length === 0) {
        throw errorGen(`shoppingList does not exist or is not in draft status, can't create shoppingListIngredient`, 515, 'cannotComplete', false, 3);
      }

      //verify that provided ingredient exists
      const { data: ingredient, error: ingredientError } = await db.from('ingredients').select('ingredientID').filter('ingredientID', 'eq', ingredientID).filter('deleted', 'eq', false);
      if (ingredientError) {
        throw errorGen(`Error getting ingredient: ${ingredientError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (ingredient.length === 0) {
        throw errorGen(`ingredient does not exist, can't create shoppingListIngredient`, 515, 'cannotComplete', false, 3);
      }

      //verify no other shoppingListIngredient exists for this shoppingList and ingredient
      const { data: existingShoppingListIngredient, error: existingShoppingListIngredientError } = await db.from('shoppingListIngredients').select('shoppingListIngredientID').filter('shoppingListID', 'eq', shoppingListID).filter('ingredientID', 'eq', ingredientID).filter('deleted', 'eq', false);
      if (existingShoppingListIngredientError) {
        throw errorGen(`error getting existing shoppingListIngredients when creating shoppingListIngredient`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingShoppingListIngredient.length > 0) {
        throw errorGen(`this ingredient already exists on this shoppingList`, 515, 'cannotComplete', false, 3);
      }

      // create shoppingListIngredient
      const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').insert({ userID, shoppingListIngredientID: customID, shoppingListID, ingredientID, needMeasurement, needUnit, source }).select('*').single();
      if (shoppingListIngredientError) {
        throw errorGen(`Error creating shoppingListIngredient with ID ${customID}: ${shoppingListIngredientError.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      //add a 'addedIngredientToShoppingList' log
      await createShoppingLog(userID, authorization, 'addIngredientToShoppingList', Number(shoppingListIngredient.shoppingListIngredientID), Number(shoppingListID), null, null, `addedIngredientToShoppingList: ${shoppingListIngredient.shoppingListIngredientID}`);

      return { shoppingListIngredientID: shoppingListIngredient.shoppingListIngredientID };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in listIngredients createShoppingListIngredient', err.code || 520, err.name || 'unhandledError_listIngredients-createShoppingListIngredient', err.isOperational || false, err.severity || 2);
    }
  }

  async function updateShoppingListIngredient(options) {
    const { userID, authorization, shoppingListIngredientID, purchasedMeasurement, purchasedUnit, store } = options;

    try {
      //verify that provided shoppingListIngredient exists
      const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').select('*').filter('shoppingListIngredientID', 'eq', shoppingListIngredientID).filter('deleted', 'eq', false);
      if (shoppingListIngredientError) {
        throw errorGen(`Error getting shoppingListIngredient: ${shoppingListIngredientError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (shoppingListIngredient.length === 0) {
        throw errorGen(`shoppingListIngredient does not exist, can't update`, 515, 'cannotComplete', false, 3);
      }

      //verify that provided shoppingList exists and is not deleted
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID).filter('status', 'neq', 'deleted');
      if (shoppingListError) {
        throw errorGen(`Error getting shoppingList: ${shoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (shoppingList.length === 0) {
        throw errorGen(`shoppingList does not exist`, 515, 'cannotComplete', false, 3);
      }

      //update shoppingListIngredient
      const updateFields = {};
      if (purchasedMeasurement) updateFields.purchasedMeasurement = purchasedMeasurement;
      if (purchasedUnit) updateFields.purchasedUnit = purchasedUnit;
      if (store) updateFields.store = store;
      const updatedShoppingListIngredient = await updater(userID, authorization, 'shoppingListIngredientID', shoppingListIngredientID, 'shoppingListIngredients', updateFields);
      return updatedShoppingListIngredient;

      //add a 'updatedIngredientInShoppingList' log entry
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in listIngredients updateShoppingListIngredient', err.code || 520, err.name || 'unhandledError_listIngredients-updateShoppingListIngredient', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteShoppingListIngredient(options) {
    const { userID, authorization, shoppingListIngredientID } = options;

    try {
      //verify that provided shoppingListIngredient exists
      const { data: shoppingListIngredient, error: shoppingListIngredientError } = await db.from('shoppingListIngredients').select('*').filter('shoppingListIngredientID', 'eq', shoppingListIngredientID).filter('deleted', 'eq', false);
      if (shoppingListIngredientError) {
        throw errorGen(`Error getting shoppingListIngredient: ${shoppingListIngredientError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (shoppingListIngredient.length === 0) {
        throw errorGen(`shoppingListIngredient does not exist, can't delete`, 515, 'cannotComplete', false, 3);
      }

      //verify that provided shoppingList exists
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID, status').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID);
      if (shoppingListError) {
        throw errorGen(`Error getting shoppingList: ${shoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (shoppingList.length === 0) {
        throw errorGen(`shoppingList does not exist, cannot delete shoppingListIngredient`, 515, 'cannotComplete', false, 3);
      }

      //delete shoppingListIngredient
      const { error: deleteError } = await db.from('shoppingListIngredients').update({ deleted: true }).filter('shoppingListIngredientID', 'eq', shoppingListIngredientID);
      if (deleteError) {
        throw errorGen(`Error deleting shoppingListIngredient: ${deleteError.message}`, 513, 'failSupabaseUpdate', true, 3);
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
          throw errorGen(`Error getting remaining shoppingListIngredients: ${remainingShoppingListIngredientsError}`, 511, 'failSupabaseSelect', true, 3);
        }
        //if none remaining, delete any shoppingListRecipes and standalone ingredients, then set shoppingList status to 'draft'
        if (remainingShoppingListIngredients.length === 0) {
          //delete any shoppingListRecipes for this shoppingList using axios calls
          const { data: shoppingListRecipes, error: shoppingListRecipesError } = await db.from('shoppingListRecipes').select('shoppingListRecipeID').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID).filter('deleted', 'eq', false);
          if (shoppingListRecipesError) {
            throw errorGen(`Error getting shoppingListRecipes while clearing shoppingList ID: ${shoppingListIngredient[0].shoppingListID}: ${shoppingListRecipesError.message}`, 511, 'failSupabaseSelect', true, 3);
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
                throw errorGen(
                  deleteShoppingListRecipeError.message || `Error deleting shoppingListRecipe ID: ${shoppingListRecipes[i].shoppingListRecipeID}: ${deleteShoppingListRecipeError.message}`,
                  deleteShoppingListRecipeError.code || 520,
                  deleteShoppingListRecipeError.name || 'unhandledError_listIngredients-updateShoppingListIngredient',
                  deleteShoppingListRecipeError.isOperational || false,
                  deleteShoppingListRecipeError.severity || 2,
                );
              }
            }
          }

          //delete any standalone shoppingListIngredients for this shoppingList using axios calls
          const { data: shoppingListIngredients, error: shoppingListIngredientsError } = await db.from('shoppingListIngredients').select('shoppingListIngredientID').filter('shoppingListID', 'eq', shoppingListIngredient[0].shoppingListID).filter('deleted', 'eq', false);
          if (shoppingListIngredientsError) {
            throw errorGen(`Error getting standalone ingredients while clearing shoppingList ID: ${shoppingListIngredient[0].shoppingListID}: ${shoppingListIngredientsError.message}`, 511, 'failSupabaseSelect', true, 3);
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
                throw errorGen(
                  deleteShoppingListIngredientError.message || `Error deleting shoppingListIngredient ID: ${shoppingListRecipes[i].shoppingListRecipeID}: ${deleteShoppingListRecipeError.message}`,
                  deleteShoppingListIngredientError.code || 520,
                  deleteShoppingListIngredientError.name || 'unhandledError_listIngredients-deleteShoppingListIngredient',
                  deleteShoppingListIngredientError.isOperational || false,
                  deleteShoppingListIngredientError.severity || 2,
                );
              }
            }
          }

          const updatedShoppingList = await updater(userID, authorization, 'shoppingListID', shoppingList[0].shoppingListID, 'shoppingLists', { status: 'draft' });
          return updatedShoppingList;
        }
      }

      //add a 'deleted' log entry
      await createShoppingLog(userID, authorization, 'deleteIngredientFromShoppingList', Number(shoppingListIngredientID), Number(shoppingListIngredient[0].shoppingListID), null, null, `deletedIngredientFromShoppingList: ${shoppingListIngredientID}`);
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in listIngredients deleteShoppingListIngredient', err.code || 520, err.name || 'unhandledError_listIngredients-deleteShoppingListIngredient', err.isOperational || false, err.severity || 2);
    }
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
