async function getRecipeIngredients(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientIDs, recipeID, ingredientID } = req.query;
  try {
    const returner = await p.get.all({ userID: req.userID, recipeIngredientIDs, recipeID, ingredientID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'ingredients' 'getRecipeIngredients': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getRecipeIngredientByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, recipeIngredientID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'ingredients' 'getRecipeIngredientByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio, preparation, needsReview } = req.body;
  const { authorization } = req.headers;
  let userID;
  if (req.body.userID) {
    userID = req.body.userID;
  } else {
    userID = req.userID;
  }
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID,
      recipeID,
      ingredientID,
      measurementUnit,
      measurement,
      purchaseUnitRatio,
      preparation,
      needsReview,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'ingredients' 'createRecipeIngredient': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updateRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  const { measurementUnit, measurement, purchaseUnitRatio, preparation } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      recipeIngredientID,
      measurementUnit,
      measurement,
      purchaseUnitRatio,
      preparation,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'ingredients' 'updateRecipeIngredient': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({ userID: req.userID, recipeIngredientID, authorization });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'ingredients' 'deleteRecipeIngredient': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getPurEst(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientName, measurementUnit, purchaseUnit } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.get.purEst({ userID: req.userID, authorization, ingredientName, measurementUnit, purchaseUnit});
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'ingredients' 'getPurEst': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getRecipeIngredients,
  getRecipeIngredientByID,
  createRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient,
  getPurEst,
};
