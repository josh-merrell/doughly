async function getIngredientStocks(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientStockIDs, ingredientID, purchasedBy } = req.query;
  const returner = await p.get.all({ ingredientStockIDs, ingredientID, purchasedBy });
  return res.json(returner);
}

async function getIngredientStockByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientStockID } = req.params;
  const returner = await p.get.byID({ ingredientStockID });
  return res.json(returner);
}

async function createIngredientStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientID, purchasedBy, purchasedDate, measurement } = req.body;
  const returner = await p.create({
    ingredientID,
    purchasedBy,
    purchasedDate,
    measurement,
  });
  return res.json(returner);
}

async function updateIngredientStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientStockID } = req.params;
  const { purchasedBy, purchasedDate, measurement } = req.body;
  const returner = await p.update({
    ingredientStockID,
    purchasedBy,
    purchasedDate,
    measurement,
  });
  return res.json(returner);
}

async function deleteIngredientStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { ingredientStockID } = req.params;
  const returner = await p.delete({ ingredientStockID });
  return res.json(returner);
}

module.exports = {
  getIngredientStocks,
  getIngredientStockByID,
  createIngredientStock,
  updateIngredientStock,
  deleteIngredientStock,
};
