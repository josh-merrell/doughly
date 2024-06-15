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

//CREATE ONE ENTRY FOR ALL QUANTITY PROVIDED
async function createToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID, quantity } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    userID: req.userID,
    customID,
    authorization,
    toolID,
    quantity,
  });
  return res.json(returner);
}

async function updateToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockID } = req.params;
  const { authorization } = req.headers;
  const { purchasedBy, purchaseDate, quantity } = req.body;
  const returner = await p.update({
    userID: req.userID,
    authorization,
    toolStockID,
    purchasedBy,
    purchaseDate,
    quantity,
  });
  return res.json(returner);
}

async function deleteToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    toolStockID,
    authorization,
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
