'use strict';

async function getOrderTasks(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, orderTaskIDs, orderID, recipeID, status } = req.query;
  const returner = await p.get.all({ cursor, limit, orderTaskIDs, orderID, recipeID, status });
  return res.json(returner);
}

async function getOrderTaskByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderTaskID } = req.params;
  const returner = await p.get.byID({ orderTaskID });
  return res.json(returner);
}

async function createOrderTask(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderID, recipeID, quantity, unitIncome } = req.body;
  const returner = await p.create({
    orderID,
    recipeID,
    quantity,
    unitIncome,
  });
  return res.json(returner);
}

async function updateOrderTask(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderTaskID } = req.params;
  const { quantity, status, unitIncome } = req.body;
  const returner = await p.update({
    orderTaskID,
    quantity,
    status,
    unitIncome,
  });
  return res.json(returner);
}

async function deleteOrderTask(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderTaskID } = req.params;
  const returner = await p.delete({
    orderTaskID,
  });
  return res.json(returner);
}

module.exports = {
  getOrderTasks,
  getOrderTaskByID,
  createOrderTask,
  updateOrderTask,
  deleteOrderTask,
};
