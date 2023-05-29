async function getIngredients(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientIDs, name } = req.query;
  const returner = await p.get.all({ ingredientIDs, name });
  return res.json(returner);
}

async function getIngredientByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientID } = req.params;
  const returner = await p.get.byID({ ingredientID });
  return res.json(returner);
}

async function createIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name, lifespanDays, brand, purchaseUnit, gramRatio } = req.body;
  const returner = await p.create({
    name,
    lifespanDays,
    brand,
    purchaseUnit,
    gramRatio,
  });
  return res.json(returner);
}

async function updateIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientID } = req.params;
  const { name, brand, lifespanDays, purchaseUnit, gramRatio } = req.body;
  const returner = await p.update({
    ingredientID,
    name,
    brand,
    lifespanDays,
    purchaseUnit,
    gramRatio,
  });
  return res.json(returner);
}

async function deleteIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientID } = req.params;
  const returner = await p.delete({ ingredientID });
  return res.json(returner);
}

module.exports = {
  getIngredients,
  getIngredientByID,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
