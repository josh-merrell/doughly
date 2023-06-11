'use strict';

async function getTaskItems(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, taskItemIDs, orderID, recipeID, status } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, taskItemIDs, orderID, recipeID, status });
  return res.json(returner);
}

async function getTaskItemByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { taskItemID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, taskItemID });
  return res.json(returner);
}

async function createTaskItem(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderID, recipeID, quantity, unitIncome } = req.body;
  const returner = await p.create({
    userID: req.userID,
    orderID,
    recipeID,
    quantity,
    unitIncome,
  });
  return res.json(returner);
}

async function updateTaskItem(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { taskItemID } = req.params;
  const { quantity, status, unitIncome } = req.body;
  const returner = await p.update({
    userID: req.userID,
    taskItemID,
    quantity,
    status,
    unitIncome,
  });
  return res.json(returner);
}

async function deleteTaskItem(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { taskItemID } = req.params;
  const returner = await p.delete({
    userID: req.userID,
    taskItemID,
  });
  return res.json(returner);
}

module.exports = {
  getTaskItems,
  getTaskItemByID,
  createTaskItem,
  updateTaskItem,
  deleteTaskItem,
};
