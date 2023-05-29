'use strict';

async function getProductStocks(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { productStockIDs, stockProductID, producedDate, daysRemaining, status } = req.query;
  const returner = await p.get.all({ productStockIDs, stockProductID, producedDate, daysRemaining, status });
  return res.json(returner);
}

async function getProductStockByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { productStockID } = req.params;
  const returner = await p.get.byID({ productStockID });
  return res.json(returner);
}

async function createProductStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockProductID, producedDate } = req.body;
  const returner = await p.create({
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
