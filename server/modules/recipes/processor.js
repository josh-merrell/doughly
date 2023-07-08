('use strict');

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, recipeIDs, title, recipeCategoryID } = options;
    let q = db.from('recipes').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeID', { ascending: true });
    if (recipeIDs) {
      q = q.in('recipeID', recipeIDs);
    }
    if (title) {
      q = q.like('title', title);
    }
    if (recipeCategoryID) {
      q = q.filter('recipeCategoryID', 'eq', recipeCategoryID);
    }
    const { data: recipes, error } = await q;

    if (error) {
      global.logger.info(`Error getting recipes: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipes.length} recipes`);
    return recipes;
  }

  async function getByID(options) {
    const { recipeID } = options;
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipe: ${recipeID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipe`);
    return recipe;
  }

  async function create(options) {
    const { userID, title, servings, lifespanDays, recipeCategoryID } = options;

    if (!title) {
      global.logger.info(`Title is required`);
      return { error: `Title is required` };
    }
    if (!servings || servings < 0) {
      global.logger.info(`positive Servings integer is required`);
      return { error: `positive Servings integer is required` };
    }
    if (!lifespanDays || lifespanDays < 0) {
      global.logger.info(`positive LifespanDays integer is required`);
      return { error: `positive LifespanDays integer is required` };
    }

    //verify that the provided recipeCategoryID exists, return error if not
    if (recipeCategoryID) {
      const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', recipeCategoryID);
      if (error) {
        global.logger.info(`Error getting recipeCategory: ${error.message}`);
        return { error: error.message };
      }
      if (!recipeCategory.length) {
        global.logger.info(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist`);
        return { error: `Provided RecipeCategory ID:(${recipeCategoryID}) does not exist` };
      }
    }
    const { data: recipe, error } = await db.from('recipes').insert({ userID, title, servings, lifespanDays, recipeCategoryID }).select('recipeID').single();

    if (error) {
      global.logger.info(`Error creating recipe: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created recipe ID:${recipe.recipeID}`);
    return recipe;
  }

  async function update(options) {
    const { recipeID, recipeCategoryID } = options;
    //verify that the provided recipeID exists, return error if not
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID);

    if (error) {
      global.logger.info(`Error getting recipe: ${error.message}`);
      return { error: error.message };
    }
    if (!recipe.length) {
      global.logger.info(`Recipe with provided ID (${recipeID}) does not exist`);
      return { error: `Recipe with provided ID (${recipeID}) does not exist` };
    }

    //verify that the provided recipeCategoryID exists, return error if not
    if (recipeCategoryID) {
      const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', recipeCategoryID);
      if (error) {
        global.logger.info(`Error getting recipeCategory: ${error.message}`);
        return { error: error.message };
      }
      if (!recipeCategory.length) {
        global.logger.info(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist`);
        return { error: `Provided RecipeCategory ID:(${recipeCategoryID}) does not exist` };
      }
    }

    //verify that servings and lifespanDays are positive integers, if provided. Return error if not
    if (options.servings && options.servings < 1) {
      global.logger.info(`Servings should be positive integer`);
      return { error: `Servings should be positive integer` };
    }
    if (options.lifespanDays && options.lifespanDays < 1) {
      global.logger.info(`LifespanDays should be positive integer`);
      return { error: `LifespanDays should be positive integer` };
    }

    const updateFields = {};
    for (let key in options) {
      if (key !== 'recipeID' && options[key]) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipe = await updater('recipeID', recipeID, 'recipes', updateFields);
      global.logger.info(`Updated recipe ID:${recipeID}`);
      return updatedRecipe;
    } catch (error) {
      global.logger.info(`Error updating recipe: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteRecipe(options) {
    //verify that the provided recipeID exists, return error if not
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', options.recipeID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipe: ${error.message}`);
      return { error: error.message };
    }
    if (!recipe.length) {
      global.logger.info(`Recipe with provided ID (${options.recipeID}) does not exist`);
      return { error: `Recipe with provided ID (${options.recipeID}) does not exist` };
    }

    //delete recipe
    const { error: deleteError } = await db.from('recipes').update({ deleted: true }).eq('recipeID', options.recipeID);

    if (deleteError) {
      global.logger.info(`Error deleting recipe: ${deleteError.message}`);
      return { error: deleteError.message };
    }

    //db will cascade recipe deletion to recipeComponents, recipeSteps, recipeTools, recipeIngredients, stockProducts, orderTaskProducts, and recipeTags
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteRecipe,
  };
};
