('use strict');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db, dbPublic }) => {
  async function recipePreview({ recipeID }) {
    try {
      const result = '';

      return result;
    } catch (e) {
      global.logger.error(`Error getting recipe link preview: ${e.message}`);
      throw errorGen(`Error getting recipe link preview: ${e.message}`, 400);
    }
  }
};
