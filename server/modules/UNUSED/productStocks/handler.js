'use strict';

async function getProductStocks(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { productStockIDs, stockProductID, producedDate, daysRemaining, status } = req.query;
  const returner = await p.get.all({ userID: req.userID, productStockIDs, stockProductID, producedDate, daysRemaining, status });
  return res.json(returner);
}

async function getProductStockByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { productStockID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, productStockID });
  return res.json(returner);
}

async function createProductStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockProductID, producedDate } = req.body;
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
    stockProductID,
    producedDate,
  });
  return res.json(returner);
}

async function updateProductStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { productStockID } = req.params;
  const { producedDate, daysRemaining, status } = req.body;
  const returner = await p.update({
    userID: req.userID,
    productStockID,
    producedDate,
    daysRemaining,
    status,
  });
  return res.json(returner);
}

async function deleteProductStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { productStockID } = req.params;
  const { reason } = req.body;
  const returner = await p.delete({
    userID: req.userID,
    productStockID,
    reason,
  });
  return res.json(returner);
}

module.exports = {
  getProductStocks,
  getProductStockByID,
  createProductStock,
  updateProductStock,
  deleteProductStock,
};
