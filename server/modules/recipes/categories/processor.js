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
      throw errorGen('Unhandled Error in recipeCategories', 520, 'unhandledError_recipeCategories-getAll', false, 2); //message, code, name, operational, severity
    }
  }

  return {
    get: {
      all: getAll,
    },
  };
};
