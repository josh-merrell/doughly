('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getShoppingListRecipeByID(options) {
    const { shoppingListRecipeID } = options;

    try {
      const { data: shoppingListRecipe, error } = await db.from('shoppingListRecipes').select('shoppingListRecipeID, shoppingListID, recipeID, plannedDate').filter('shoppingListRecipeID', 'eq', shoppingListRecipeID).single();
      if (error) {
        throw errorGen(`*listRecipes-getShoppingListRecipeByID* Error getting shopping list recipe ${shoppingListRecipeID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*listRecipes-getShoppingListRecipeByID* Got shoppingListRecipe`, level: 6, timestamp: new Date().toISOString(), userID: shoppingListRecipe.userID || 0 });
      return shoppingListRecipe;
    } catch (err) {
      throw errorGen(err.message || '*listRecipes-getShoppingListRecipeByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_listRecipes-getShoppingListRecipeByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function getRecipesByShoppingList(options) {
    const { userID, shoppingListID } = options;

    try {
      const { data: shoppingListRecipes, error } = await db.from('shoppingListRecipes').select('shoppingListRecipeID, shoppingListID, recipeID, plannedDate').filter('shoppingListID', 'eq', shoppingListID).filter('deleted', 'eq', false);
      if (error) {
        throw errorGen(`*listRecipes-getRecipesByShoppingList* Error getting shopping list recipes: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*listRecipes-getRecipesByShoppingList* Got ${shoppingListRecipes.length} recipes for shoppingList ${shoppingListID}`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      return shoppingListRecipes;
    } catch (err) {
      throw errorGen(err.message || '*listRecipes-getRecipesByShoppingList* Unhandled Error', err.code || 520, err.name || 'unhandledError_listRecipes-getRecipesByShoppingList', err.isOperational || false, err.severity || 2);
    }
  }

  async function getAllShoppingListRecipes(options) {
    const { userID } = options;

    try {
      const { data: shoppingListRecipes, error } = await db.from('shoppingListRecipes').select('shoppingListRecipeID, shoppingListID, recipeID, plannedDate').filter('deleted', 'eq', false);
      if (error) {
        throw errorGen(`*listRecipes-getAllShoppingListRecipes* Error getting all shopping list recipes: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*listRecipes-getAllShoppingListRecipes* Got ${shoppingListRecipes.length} shoppingListRecipes`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      return shoppingListRecipes;
    } catch (err) {
      throw errorGen(err.message || '*listRecipes-getAllShoppingListRecipes* Unhandled Error', err.code || 520, err.name || 'unhandledError_listRecipes-getAllShoppingListRecipes', err.isOperational || false, err.severity || 2);
    }
  }

  async function createShoppingListRecipe(options) {
    const { userID, customID, authorization, shoppingListID, recipeID, plannedDate } = options;

    try {
      //verify that 'customID' exists on the request
      if (!customID) {
        throw errorGen(`*listRecipes-createShoppingListRecipe* Error creating shoppingListRecipe: customID is missing`, 515, 'cannotComplete', false, 3);
      }

      //verify that provided shoppingList exists and is in draft status
      const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListID).filter('status', 'eq', 'draft');
      if (shoppingListError) {
        throw errorGen(`*listRecipes-createShoppingListRecipe* Error creating shoppingListRecipe: ${shoppingListError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (shoppingList.length === 0) {
        throw errorGen(`*listRecipes-createShoppingListRecipe* Error creating shoppingListRecipe: shoppingList does not exist or is not in draft status`, 515, 'cannotComplete', false, 3);
      }

      //verify that provided recipe exists
      const { data: recipe, error: recipeError } = await db.from('recipes').select('recipeID').filter('recipeID', 'eq', recipeID).filter('deleted', 'eq', false);
      if (recipeError) {
        throw errorGen(`*listRecipes-createShoppingListRecipe* Error creating shoppingListRecipe: ${recipeError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (recipe.length === 0) {
        throw errorGen(`*listRecipes-createShoppingListRecipe* Error creating shoppingListRecipe: recipe does not exist`, 515, 'cannotComplete', false, 3);
      }

      //verify no other shoppingListRecipe exists for this shoppingList and recipe
      const { data: existingShoppingListRecipe, error: existingShoppingListRecipeError } = await db.from('shoppingListRecipes').select().filter('shoppingListID', 'eq', shoppingListID).filter('recipeID', 'eq', recipeID);
      if (existingShoppingListRecipeError) {
        throw errorGen(`*listRecipes-createShoppingListRecipe* Error getting existingShoppingListRecipes: ${existingShoppingListRecipeError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingShoppingListRecipe.length > 0 && existingShoppingListRecipe[0].deleted == true) {
        //undelete the existing shoppingListRecipe, updating the plannedDate
        const { error: undeleteError } = await db.from('shoppingListRecipes').update({ deleted: false, plannedDate }).eq('shoppingListRecipeID', existingShoppingListRecipe[0].shoppingListRecipeID);
        //log it
        await createShoppingLog(userID, authorization, 'undeleteRecipeFromShoppingList', Number(existingShoppingListRecipe[0].shoppingListRecipeID), Number(shoppingListID), null, null, `undeleted Recipe from ShoppingList: ${existingShoppingListRecipe[0].shoppingListRecipeID}`);
        global.logger.info({ message: `*listRecipes-createShoppingListRecipe* Undeleted shoppingListRecipe ${existingShoppingListRecipe[0].shoppingListRecipeID}`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
        const result = {
          shoppingListRecipeID: existingShoppingListRecipe[0].shoppingListRecipeID,
          shoppingListID: existingShoppingListRecipe[0].shoppingListID,
          recipeID: existingShoppingListRecipe[0].recipeID,
          plannedDate: plannedDate,
        };
        return result;
      }
      if (existingShoppingListRecipe.length > 0) {
        throw errorGen(`*listRecipes-createShoppingListRecipe* Error creating shoppingListRecipe: recipe already exists on this shoppingList`, 515, 'cannotComplete', false, 3);
      }

      //create the shoppingListRecipe
      const { data: shoppingListRecipe, error: shoppingListRecipeError } = await db.from('shoppingListRecipes').insert({ userID, shoppingListRecipeID: customID, shoppingListID, recipeID, plannedDate }).select('shoppingListRecipeID, shoppingListID, recipeID, plannedDate').single();
      if (shoppingListRecipeError) {
        throw errorGen(`*listRecipes-createShoppingListRecipe* Error creating shoppingListRecipe with ID ${customID}: ${shoppingListRecipeError.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      //add a 'created' log entry
      await createShoppingLog(userID, authorization, 'addRecipeToShoppingList', Number(shoppingListRecipe.shoppingListRecipeID), Number(shoppingListID), null, null, `addedRecipeToShoppingList: ${shoppingListRecipe.shoppingListRecipeID}`);

      const result = {
        shoppingListRecipeID: shoppingListRecipe.shoppingListRecipeID,
        shoppingListID: shoppingListRecipe.shoppingListID,
        recipeID: shoppingListRecipe.recipeID,
        plannedDate: shoppingListRecipe.plannedDate,
      };
      return result;
    } catch (err) {
      throw errorGen(err.message || '*listRecipes-createShoppingListRecipe* Unhandled Error', err.code || 520, err.name || 'unhandledError_listRecipes-createShoppingListRecipe', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteShoppingListRecipe(options) {
    const { userID, authorization, shoppingListRecipeID } = options;

    try {
      //verify that provided shoppingListRecipe exists
      const { data: shoppingListRecipe, error: shoppingListRecipeError } = await db.from('shoppingListRecipes').select('*').filter('shoppingListRecipeID', 'eq', shoppingListRecipeID).filter('deleted', 'eq', false);
      if (shoppingListRecipeError) {
        throw errorGen(`*listRecipes-deleteShoppingListRecipe* Error deleting shoppingListRecipe: ${shoppingListRecipeError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (shoppingListRecipe.length === 0) {
        return { success: true };
      }

      //delete the shoppingListRecipe
      const { error: deleteError } = await db.from('shoppingListRecipes').update({ deleted: true }).eq('shoppingListRecipeID', shoppingListRecipeID);
      if (deleteError) {
        throw errorGen(`*listRecipes-deleteShoppingListRecipe* Error deleting shoppingListRecipe: ${deleteError.message}`, 513, 'failSupabaseUpdate', true, 3);
      }
      //add a 'deleted' log entry
      await createShoppingLog(userID, authorization, 'deleteRecipeFromShoppingList', Number(shoppingListRecipeID), Number(shoppingListRecipe.shoppingListID), null, null, `deleted Recipe from ShoppingList: ${shoppingListRecipeID}`);
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || '*listRecipes-deleteShoppingListRecipe* Unhandled Error', err.code || 520, err.name || 'unhandledError_listRecipes-deleteShoppingListRecipe', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    get: {
      by: {
        ID: getShoppingListRecipeByID,
        shoppingList: getRecipesByShoppingList,
      },
      all: getAllShoppingListRecipes,
    },
    create: createShoppingListRecipe,
    delete: deleteShoppingListRecipe,
  };
};
