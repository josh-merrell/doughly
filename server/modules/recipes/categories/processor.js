('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    try {
      let q = db.from('recipeCategories').select().filter('userID', 'eq', options.userID).order('recipeCategoryID', { ascending: true });

      const { data: recipeCategories, error } = await q;

      if (error) {
        global.logger.error(`Error getting recipeCategories: ${error.message}`);
        throw errorGen('Error getting recipeCategories', 400);
      }
      global.logger.info(`Got ${recipeCategories.length} recipeCategories`);
      return recipeCategories;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeCategories getAll', err.code || 520, err.name || 'unhandledError_recipeCategories-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    get: {
      all: getAll,
    },
  };
};
