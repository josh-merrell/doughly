('use strict');

const { createShoppingLog } = require('../../../services/dbLogger');

module.exports = ({ db }) => {
  async function getShoppingListRecipeByID (options) {
    const { shoppingListRecipeID } = options;
    const { data: shoppingListRecipe, error } = await db.from('shoppingListRecipes').select('shoppingListRecipeID, shoppingListID, recipeID, plannedDate').filter('shoppingListRecipeID', 'eq', shoppingListRecipeID).single();
    if (error) {
      global.logger.info(`Error getting shopping list recipe ${shoppingListRecipeID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info('Got shoppingListRecipe');
    return shoppingListRecipe;
  }

  async function getRecipesByShoppingList (options) {
    const { userID, shoppingListID } = options;
    const { data: shoppingListRecipes, error } = await db.from('shoppingListRecipes').select('shoppingListRecipeID, shoppingListID, recipeID, plannedDate').filter('shoppingListID', 'eq', shoppingListID).filter('deleted', 'eq', false);
    if (error) {
      global.logger.info(`Error getting shopping list recipes: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${shoppingListRecipes.length} recipes for shoppingList ${shoppingListID}`);
    return shoppingListRecipes;
  }

  async function createShoppingListRecipe (options) {
    const { userID, customID, authorization, shoppingListID, recipeID, plannedDate } = options;
    //verify that 'customID' exists on the request
    if (!customID) {
      global.logger.info('Error creating shoppingListRecipe: customID is missing');
      return { error: 'customID is missing' };
    }

    //verify that provided shoppingList exists and is in draft status
    const { data: shoppingList, error: shoppingListError } = await db.from('shoppingLists').select('shoppingListID').filter('shoppingListID', 'eq', shoppingListID).filter('status', 'eq', 'draft');
    if (shoppingListError) {
      global.logger.info(`Error creating shoppingListRecipe: ${shoppingListError.message}`);
      return { error: shoppingListError.message };
    }
    if (shoppingList.length === 0) {
      global.logger.info('Error creating shoppingListRecipe: shoppingList does not exist or is not in draft status');
      return { error: 'shoppingList does not exist or is not in draft status' };
    }

    //verify that provided recipe exists
    const { data: recipe, error: recipeError } = await db.from('recipes').select('recipeID').filter('recipeID', 'eq', recipeID).filter('deleted', 'eq', false);
    if (recipeError) {
      global.logger.info(`Error creating shoppingListRecipe: ${recipeError.message}`);
      return { error: recipeError.message };
    }
    if (recipe.length === 0) {
      global.logger.info('Error creating shoppingListRecipe: recipe does not exist');
      return { error: 'recipe does not exist' };
    }

    //verify no other shoppingListRecipe exists for this shoppingList and recipe
    const { data: existingShoppingListRecipe, error: existingShoppingListRecipeError } = await db.from('shoppingListRecipes').select('shoppingListRecipeID').filter('shoppingListID', 'eq', shoppingListID).filter('recipeID', 'eq', recipeID);
    if (existingShoppingListRecipeError) {
      global.logger.info(`Error getting existingShoppingListRecipes: ${existingShoppingListRecipeError.message}`);
      return { error: existingShoppingListRecipeError.message };
    }
    if (existingShoppingListRecipe.length > 0 && existingShoppingListRecipe[0].deleted === 'true') {
      //undelete the existing shoppingListRecipe
      const { error: undeleteError } = await db.from('shoppingListRecipes').update({ deleted: false }).eq('shoppingListRecipeID', existingShoppingListRecipe[0].shoppingListRecipeID);
      //log it
      await createShoppingLog(userID, authorization, 'undeleteRecipeFromShoppingList', Number(existingShoppingListRecipe[0].shoppingListRecipeID), Number(shoppingListID), null, null, `undeleted Recipe from ShoppingList: ${existingShoppingListRecipe[0].shoppingListRecipeID}`);
      global.logger.info(`Undeleted shoppingListRecipe ${existingShoppingListRecipe[0].shoppingListRecipeID}`);
      return { shoppingListRecipeID: existingShoppingListRecipe[0].shoppingListRecipeID };
    }
    if (existingShoppingListRecipe.length > 0) {
      global.logger.info('Error creating shoppingListRecipe: recipe already exists on this shoppingList');
      return { error: 'recipe already exists on this shoppingList' };
    }

    //create the shoppingListRecipe
    const { data: shoppingListRecipe, error: shoppingListRecipeError } = await db.from('shoppingListRecipes').insert({ userID, shoppingListRecipeID: customID, shoppingListID, recipeID, plannedDate }).select('shoppingListRecipeID, shoppingListID, recipeID, plannedDate').single();
    if (shoppingListRecipeError) {
      global.logger.info(`Error creating shoppingListRecipe with ID ${customID}: ${shoppingListRecipeError.message}`);
      return { error: shoppingListRecipeError.message };
    }
    //add a 'created' log entry
    await createShoppingLog(userID, authorization, 'addRecipeToShoppingList', Number(shoppingListRecipe.shoppingListRecipeID), Number(shoppingListID), null, null, `addedRecipeToShoppingList: ${shoppingListRecipe.shoppingListRecipeID}`);

    return { shoppingListRecipeID: shoppingListRecipe.shoppingListRecipeID };
  }

  async function deleteShoppingListRecipe (options) {
    const { userID, authorization, shoppingListRecipeID } = options;
    //verify that provided shoppingListRecipe exists
    const { data: shoppingListRecipe, error: shoppingListRecipeError } = await db.from('shoppingListRecipes').select('*').filter('shoppingListRecipeID', 'eq', shoppingListRecipeID).filter('deleted', 'eq', false);
    if (shoppingListRecipeError) {
      global.logger.info(`Error deleting shoppingListRecipe: ${shoppingListRecipeError.message}`);
      return { error: shoppingListRecipeError.message };
    }
    if (shoppingListRecipe.length === 0) {
      global.logger.info('Error deleting shoppingListRecipe: shoppingListRecipe does not exist');
      return { error: 'shoppingListRecipe does not exist' };
    }

    //delete the shoppingListRecipe
    const { error: deleteError } = await db.from('shoppingListRecipes').update({ deleted: true }).eq('shoppingListRecipeID', shoppingListRecipeID);
    if (deleteError) {
      global.logger.info(`Error deleting shoppingListRecipe: ${deleteError.message}`);
      return { error: deleteError.message };
    }
    //add a 'deleted' log entry
    await createShoppingLog( userID, authorization, 'deleteRecipeFromShoppingList', Number(shoppingListRecipeID), Number(shoppingListRecipe.shoppingListID), null, null, `deleted Recipe from ShoppingList: ${shoppingListRecipeID}`);

    return { success: true };
  }


  return {
    get: {
      by: {
        ID: getShoppingListRecipeByID,
        shoppingList: getRecipesByShoppingList,
      },
    },
    create: createShoppingListRecipe,
    delete: deleteShoppingListRecipe,
  }
}