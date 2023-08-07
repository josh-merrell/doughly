('use strict');

const axios = require('axios');

const { updater } = require('../../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    let q = db.from('recipeCategories').select().filter('userID', 'eq', options.userID).eq('deleted', false).order('recipeCategoryID', { ascending: true });

    const { data: recipeCategories, error } = await q;

    if (error) {
      global.logger.info(`Error getting recipeCategories: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipeCategories.length} recipeCategories`);
    return recipeCategories;
  }

  async function create(options) {
    const { userID, name } = options;

    //if name is not provided, return error
    if (!name) {
      global.logger.info(`Name is required`);
      return { error: `Name is required` };
    }

    const { data: newRecipeCategory, error } = await db.from('recipeCategories').insert({ userID, name }).select().single();

    if (error) {
      global.logger.info(`Error creating recipeCategory: ${error.message}`);
      return { error: error.message };
    }

    global.logger.info(`Created recipeCategory ID ${newRecipeCategory.recipeCategoryID}`);
    return {
      recipeCategoryID: newRecipeCategory.recipeCategoryID,
      name: newRecipeCategory.name,
    };
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
      if (key !== 'recipeCategoryID' && options[key] !== undefined) {
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
    const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', options.recipeCategoryID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipeCategory: ${error.message}`);
      return { error: error.message };
    }
    if (!recipeCategory.length) {
      global.logger.info(`RecipeCategory with provided ID (${options.recipeCategoryID}) does not exist`);
      return { error: `RecipeCategory with provided ID (${options.recipeCategoryID}) does not exist` };
    }

    //collect list of recipes that reference this category
    const { data: recipes, error: recipeError } = await db.from('recipes').select().eq('recipeCategoryID', options.recipeCategoryID).eq('deleted', false);

    if (recipeError) {
      global.logger.info(`Error getting recipes associated with category to delete. Backing out: ${recipeError.message}`);
      return { error: recipeError.message };
    }
    if (recipes.length) {
      let otherCategoryID;
      //search db for category with name 'Other', selecting the recipeCategoryID
      const { data: otherCategory, error: otherCategoryError } = await db.from('recipeCategories').select().eq('name', 'Other').eq('userID', options.userID).eq('deleted', false);
      if (otherCategoryError) {
        global.logger.info(`Error getting 'Other' recipeCategory. Backing out from Category delete: ${otherCategoryError.message}`);
        return { error: otherCategoryError.message };
      }
      if (!otherCategory) {
        //create a new recipeCategory with name 'Other'
        const { data: newCategory, error: newCategoryError } = await axios.post(`${process.env.API_URL}/recipeCategories`, { userID: options.userID, name: 'Other' });
        if (newCategoryError) {
          global.logger.info(`Error creating new 'Other' recipeCategory: ${newCategoryError.message}`);
          return { error: newCategoryError.message };
        }
        otherCategoryID = newCategory.recipeCategoryID;
      } else {
        otherCategoryID = otherCategory.recipeCategoryID;
      }
      //Move any recipes in category to delete to 'Other' category
      const promises = recipes.map((recipe) => {
        return axios.patch(`${process.env.API_URL}/recipes/${recipe.recipeID}`, { recipeCategoryID: otherCategoryID });
      });
      const { data: updatedRecipes, error: updateError } = await Promise.all(promises);
      if (updateError) {
        global.logger.info(`Error moving recipes from category to be deleted. Backing out: ${updateError.message}`);
        return { error: updateError.message };
      }
      global.logger.info(`Moved ${updatedRecipes.length} recipes to 'Other' category to allow for deletion of Category: ${options.recipeCategoryID}`);
    }

    //delete recipeCategory
    const { data, error: deleteError } = await db.from('recipeCategories').update({ deleted: true }).match({ recipeCategoryID: options.recipeCategoryID });

    if (deleteError) {
      global.logger.info(`Error deleting recipeCategory: ${deleteError.message}`);
      return { error: deleteError.message };
    }

    global.logger.info(`Deleted recipeCategory: ${options.recipeCategoryID}`);
    return data;

    //db will nullify any remaining recipe references to this category.
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
