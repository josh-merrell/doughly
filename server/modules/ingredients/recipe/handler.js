async function getRecipeIngredients(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientIDs, recipeID, ingredientID } = req.query;
  const returner = await p.get.all({ userID: req.userID, recipeIngredientIDs, recipeID, ingredientID });
  return res.json(returner);
}

async function getRecipeIngredientByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, recipeIngredientID });
  return res.json(returner);
}

async function createRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, ingredientID, measurementUnit, measurement, purchaseUnitRatio, preparation, RIneedsReview, component } = req.body;
  const { authorization } = req.headers;
  let userID;
  if (req.body.userID) {
    userID = req.body.userID;
  } else {
    userID = req.userID;
  }
  const { customID } = req;
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
    component,
    RIneedsReview,
  });
  return res.json(returner);
}

async function updateRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  const { measurementUnit, measurement, purchaseUnitRatio, preparation, component, RIneedsReview } = req.body;
  const { authorization } = req.headers;
  const returner = await p.update({
    userID: req.userID,
    authorization,
    recipeIngredientID,
    measurementUnit,
    measurement,
    purchaseUnitRatio,
    preparation,
    component,
    RIneedsReview,
  });
  return res.json(returner);
}

async function deleteRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({ userID: req.userID, recipeIngredientID, authorization });
  return res.json(returner);
}

async function getPurEst(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientName, measurementUnit, purchaseUnit } = req.body;
  const { authorization } = req.headers;
  const returner = await p.get.purEst({ userID: req.userID, authorization, ingredientName, measurementUnit, purchaseUnit });
  return res.json(returner);
}

module.exports = {
  getRecipeIngredients,
  getRecipeIngredientByID,
  createRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient,
  getPurEst,
};
