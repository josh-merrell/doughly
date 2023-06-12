('use strict');

const { updater } = require('../../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    let q = db.from('recipeCategories').select().filter('userID', 'eq', options.userID).order('recipeCategoryID', { ascending: true });

    const { data: recipeCategories, error } = await q;

    if (error) {
      global.logger.info(`Error getting recipeCategories: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipeCategories`);
    return recipeCategories;
  }

  async function create(options) {
    const { userID, name } = options;

    //if name is not provided, return error
    if (!name) {
      global.logger.info(`Name is required`);
      return { error: `Name is required` };
    }

    const { data, error } = await db.from('recipeCategories').insert({ userID, name }).select('recipeCategoryID');

    if (error) {
      global.logger.info(`Error creating recipeCategory: ${error.message}`);
      return { error: error.message };
    }

    global.logger.info(`Created recipeCategory`);
    return data;
  }

  async function update(options) {
    //verify that the provided recipeCategoryID exists, return error if not
    const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', options.recipeCategoryID);

    if (error) {
      global.logger.info(`Error getting recipeCategory: ${error.message}`);
      return { error: error.message };
    }
    if (!recipeCategory.length) {
      global.logger.info(`RecipeCategory with provided ID (${options.recipeCategoryID}) does not exist`);
      return { error: `RecipeCategory with provided ID (${options.recipeCategoryID}) does not exist` };
    }

    //update recipeCategory
    const updateFields = {};
    for (let key in options) {
      if (key !== 'recipeCategoryID' && options[key]) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipeCategory = await updater('recipeCategoryID', options.recipeCategoryID, 'recipeCategories', updateFields);
      global.logger.info(`Updated recipeCategory`);
      return updatedRecipeCategory;
    } catch (error) {
      global.logger.info(`Error updating recipeCategory ID: ${options.recipeCategoryID}: ${error.message}`);
      return { error: `Error updating recipeCategory: ${error.message}` };
    }
  }

  async function deleteRecipeCategory(options) {
    //verify that the provided recipeCategoryID exists, return error if not
    const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', options.recipeCategoryID);

    if (error) {
      global.logger.info(`Error getting recipeCategory: ${error.message}`);
      return { error: error.message };
    }
    if (!recipeCategory.length) {
      global.logger.info(`RecipeCategory with provided ID (${options.recipeCategoryID}) does not exist`);
      return { error: `RecipeCategory with provided ID (${options.recipeCategoryID}) does not exist` };
    }

    //delete recipeCategory
    const { data, error: deleteError } = await db.from('recipeCategories').delete().match({ recipeCategoryID: options.recipeCategoryID });

    if (deleteError) {
      global.logger.info(`Error deleting recipeCategory: ${deleteError.message}`);
      return { error: deleteError.message };
    }

    global.logger.info(`Deleted recipeCategory`);
    return data;

    //db will nullify any recipe references to this category
  }

  return {
    get: {
      all: getAll,
    },
    create,
    update,
    delete: deleteRecipeCategory,
  };
};
