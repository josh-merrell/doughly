'use strict';

async function getRecipePreview(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  try {
    const returner = await p.get.recipePreview({
      recipeID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'linkPreviews' 'getRecipePreview': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getRecipePreview,
};
