'use strict';

async function getStockProducts(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, stockProductIDs, recipeID, productName } = req.query;
  const returner = await p.get.all({ cursor, limit, stockProductIDs, recipeID, productName });
  return res.json(returner);
}

async function getStockProductByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockProductID } = req.params;
  const returner = await p.get.byID({ stockProductID });
  return res.json(returner);
}

async function createStockProduct(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, productName, yield: recipeYield } = req.body;
  const returner = await p.create({
    recipeID,
    productName,
    recipeYield,
  });
  return res.json(returner);
}

async function updateStockProduct(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockProductID } = req.params;
  const { productName, yield: recipeYield } = req.body;
  const returner = await p.update({
    stockProductID,
    productName,
    recipeYield,
  });
  return res.json(returner);
}

async function deleteStockProduct(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockProductID } = req.params;
  const returner = await p.delete({
    stockProductID,
  });
  return res.json(returner);
}

module.exports = {
  getStockProducts,
  getStockProductByID,
  createStockProduct,
  updateStockProduct,
  deleteStockProduct,
};
