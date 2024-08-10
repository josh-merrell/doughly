('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    try {
      let q = db.from('recipeCategories').select().filter('userID', 'eq', options.userID).order('recipeCategoryID', { ascending: true });

      const { data: recipeCategories, error } = await q;

      if (error) {
        throw errorGen(`Error getting recipeCategories: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*categories-getAll* Got ${recipeCategories.length} recipeCategories`, level: 6, timestamp: new Date().toISOString(), userID: options.userID });
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
