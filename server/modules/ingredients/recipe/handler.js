async function getRecipeIngredients(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientIDs, recipeID, ingredientID } = req.query;
  const returner = await p.get.all({ recipeIngredientIDs, recipeID, ingredientID });
  return res.json(returner);
}

async function getRecipeIngredientByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  const returner = await p.get.byID({ recipeIngredientID });
  return res.json(returner);
}

async function createRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, ingredientID, measurementUnit, measurement } = req.body;
  const returner = await p.create({
    recipeID,
    ingredientID,
    measurementUnit,
    measurement,
  });
  return res.json(returner);
}

async function updateRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  const { measurementUnit, measurement } = req.body;
  const returner = await p.update({
    recipeIngredientID,
    measurementUnit,
    measurement,
  });
  return res.json(returner);
}

async function deleteRecipeIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeIngredientID } = req.params;
  const returner = await p.delete({ recipeIngredientID });
  return res.json(returner);
}

module.exports = {
  getRecipeIngredients,
  getRecipeIngredientByID,
  createRecipeIngredient,
  updateRecipeIngredient,
  deleteRecipeIngredient,
};
