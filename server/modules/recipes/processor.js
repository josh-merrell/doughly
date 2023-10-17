('use strict');

const { default: axios } = require('axios');
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
    const { customID, userID, title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = options;
    const status = 'noIngredients';

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
    if (!timePrep || timePrep < 0) {
      global.logger.info(`positive TimePrep integer is required`);
      return { error: `positive TimePrep integer is required` };
    }
    if (timeBake && timeBake < 1) {
      global.logger.info(`positive TimeBake integer is required`);
      return { error: `positive TimeBake integer is required` };
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

    //create recipe
    const { data: recipe, error } = await db.from('recipes').insert({ recipeID: customID, userID, title, servings, lifespanDays, recipeCategoryID, status, timePrep, timeBake, photoURL, version: 1, type }).select().single();

    if (error) {
      global.logger.info(`Error creating recipe: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created recipe ID:${recipe.recipeID}`);
    // return recipe;
    return {
      recipeID: recipe.recipeID,
      title: recipe.title,
      servings: recipe.servings,
      lifespanDays: recipe.lifespanDays,
      recipeCategoryID: recipe.recipeCategoryID,
      status: recipe.status,
      timePrep: recipe.timePrep,
      timeBake: recipe.timeBake,
      photoURL: recipe.photoURL,
    };
  }

  async function update(options) {
    const { recipeID, recipeCategoryID, timePrep, timeBake, type } = options;
    //verify that the provided recipeID exists, return error if not
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID);
    console.log(`TYPE: ${type}`)

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

    //verify that servings, lifespanDays, timePrep, and timeBake are positive integers, if provided. Return error if not
    if (options.servings && options.servings < 1) {
      global.logger.info(`Servings should be positive integer`);
      return { error: `Servings should be positive integer` };
    }
    if (options.lifespanDays && options.lifespanDays < 1) {
      global.logger.info(`LifespanDays should be positive integer`);
      return { error: `LifespanDays should be positive integer` };
    }
    if (timePrep && timePrep < 1) {
      global.logger.info(`TimePrep should be positive integer`);
      return { error: `TimePrep should be positive integer` };
    }
    if (timeBake && timeBake < 1) {
      global.logger.info(`TimeBake should be positive integer`);
      return { error: `TimeBake should be positive integer` };
    }

    const updateFields = {};
    if (options.status) {
      //ensure provided status is valid value
      if (options.status !== 'noIngredients' && options.status !== 'noTools' && options.status !== 'noSteps' && options.status !== 'published') {
        global.logger.info(`Invalid status`);
        return { error: `Invalid status` };
      }
    }
    for (let key in options) {
      if (key !== 'recipeID' && options[key] !== undefined) {
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

    //if recipe has photoURL, delete photo from s3
    if (recipe[0].photoURL) {
      try {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/uploads/image`, { data: { userID: options.userID, photoURL: recipe[0].photoURL, type: 'recipe', id: options.recipeID }, headers: { authorization: options.authorization } });
        global.logger.info(`Deleted photo for recipeID ${options.recipeID}`);
      } catch (error) {
        global.logger.info(`Error deleting recipe photo: ${error.message}`);
        return { error: error.message };
      }
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
