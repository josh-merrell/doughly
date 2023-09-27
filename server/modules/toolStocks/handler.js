'use strict';

async function getToolStocks(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockIDs, toolID, purchasedBy } = req.query;
  const returner = await p.get.all({ userID: req.userID, toolStockIDs, toolID, purchasedBy });
  return res.json(returner);
}

async function getToolStockByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, toolStockID });
  return res.json(returner);
}

async function createToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID, purchasedBy, purchaseDate, quantity } = req.body;
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
    toolID,
    purchasedBy,
    purchaseDate,
    quantity,
  });
  return res.json(returner);
}

async function updateToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockID } = req.params;
  const { purchasedBy, purchaseDate } = req.body;
  const returner = await p.update({
    userID: req.userID,
    toolStockID,
    purchasedBy,
    purchaseDate,
  });
  return res.json(returner);
}

async function deleteToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockID } = req.params;
  const returner = await p.delete({
    userID: req.userID,
    toolStockID,
  });
  return res.json(returner);
}

module.exports = {
  getToolStocks,
  getToolStockByID,
  createToolStock,
  updateToolStock,
  deleteToolStock,
};
