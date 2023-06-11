'use strict';

async function getStockItems(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, stockItemIDs, orderID, stockProductID, stockStatus } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, stockItemIDs, orderID, stockProductID, stockStatus });
  return res.json(returner);
}

async function getStockItemByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockItemID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, stockItemID });
  return res.json(returner);
}

async function createStockItem(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderID, stockProductID, quantity, unitIncome } = req.body;
  const returner = await p.create({
    userID: req.userID,
    orderID,
    stockProductID,
    quantity,
    unitIncome,
  });
  return res.json(returner);
}

async function updateStockItem(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockItemID } = req.params;
  const { quantity, unitIncome } = req.body;
  const returner = await p.update({
    userID: req.userID,
    stockItemID,
    quantity,
    unitIncome,
  });
  return res.json(returner);
}

async function deleteStockItem(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stockItemID } = req.params;
  const returner = await p.delete({
    userID: req.userID,
    stockItemID,
  });
  return res.json(returner);
}

module.exports = {
  getStockItems,
  getStockItemByID,
  createStockItem,
  updateStockItem,
  deleteStockItem,
};
