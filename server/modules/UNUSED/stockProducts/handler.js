'use strict';

async function getStockProducts(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, stockProductIDs, recipeID, productName } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, stockProductIDs, recipeID, productName });
  return res.json(returner);
}

async function getStockProductByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockProductID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, stockProductID });
  return res.json(returner);
}

async function createStockProduct(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, productName, yield: recipeYield } = req.body;
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
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
    userID: req.userID,
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
    userID: req.userID,
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
