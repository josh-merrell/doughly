async function getIngredients(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientIDs, name } = req.query;
  const returner = await p.get.all({ userID: req.userID, ingredientIDs, name });
  return res.json(returner);
}

async function getIngredientByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, ingredientID });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'ingredients' 'getIngredientByID': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function createIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name, lifespanDays, brand, purchaseUnit, gramRatio, needsReview } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
      name,
      lifespanDays,
      brand,
      purchaseUnit,
      gramRatio,
      needsReview,
    });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'ingredients' 'createIngredient': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function updateIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientID } = req.params;
  const { name, brand, lifespanDays, purchaseUnit, gramRatio } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      ingredientID,
      name,
      brand,
      lifespanDays,
      purchaseUnit,
      gramRatio,
    });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'ingredients' 'updateIngredient': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function deleteIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({ userID: req.userID, ingredientID, authorization });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'ingredients' 'deleteIngredient': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

module.exports = {
  getIngredients,
  getIngredientByID,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
