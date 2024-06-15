('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    let q = db.from('recipeCategories').select().filter('userID', 'eq', options.userID).order('recipeCategoryID', { ascending: true });

    const { data: recipeCategories, error } = await q;

    if (error) {
      global.logger.error(`Error getting recipeCategories: ${error.message}`);
      throw errorGen('Error getting recipeCategories', 400);
    }
    global.logger.info(`Got ${recipeCategories.length} recipeCategories`);
    return recipeCategories;
  }

  return {
    get: {
      all: getAll,
    },
  };
};
