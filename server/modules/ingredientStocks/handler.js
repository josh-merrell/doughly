async function getIngredientStocks(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientStockIDs, ingredientID, purchasedBy } = req.query;
  const returner = await p.get.all({ userID: req.userID, ingredientStockIDs, ingredientID, purchasedBy });
  return res.json(returner);
}

async function getIngredientStockByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientStockID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, ingredientStockID });
  return res.json(returner);
}

async function createIngredientStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientID, purchasedDate, measurement } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    ingredientID,
    purchasedDate,
    measurement,
  });
  return res.json(returner);
}

async function updateIngredientStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientStockID } = req.params;
  const { purchasedDate, grams } = req.body;
  const { authorization } = req.headers;
  const returner = await p.update({
    userID: req.userID,
    authorization,
    ingredientStockID,
    purchasedDate,
    grams,
  });
  return res.json(returner);
}

async function deleteIngredientStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientStockID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({ authorization, userID: req.userID, ingredientStockID });
  return res.json(returner);
}

module.exports = {
  getIngredientStocks,
  getIngredientStockByID,
  createIngredientStock,
  updateIngredientStock,
  deleteIngredientStock,
};
