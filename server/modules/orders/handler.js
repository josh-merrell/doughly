'use strict';

async function getOrders(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { orderIDs, clientID, name, scheduledDeliveryTimeRange, createdTimeRange, fulfilledTimeRange, fulfillment, status } = req.query;
  const returner = await p.get.all({
    userID: req.userID,
    cursor,
    limit,
    orderIDs,
    clientID,
    name,
    scheduledDeliveryTimeRange,
    createdTimeRange,
    fulfilledTimeRange,
    fulfillment,
    status,
  });
  return res.json(returner);
}

async function getOrderByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, orderID });
  return res.json(returner);
}

async function createOrder(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name, clientID, scheduledDeliveryTime, fulfillment, description } = req.body;
  const returner = await p.create({
    userID: req.userID,
    name,
    clientID,
    scheduledDeliveryTime,
    fulfillment,
    description,
  });
  return res.json(returner);
}

async function updateOrder(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderID } = req.params;
  const { scheduledDeliveryTime, description, name, fulfillment, fulfilledTime, status } = req.query;
  const returner = await p.update({
    userID: req.userID,
    orderID,
    scheduledDeliveryTime,
    description,
    name,
    fulfillment,
    fulfilledTime,
    status,
  });
  return res.json(returner);
}

async function deleteOrder(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderID } = req.params;
  const returner = await p.delete({ userID: req.userID, orderID });
  return res.json(returner);
}

module.exports = {
  getOrders,
  getOrderByID,
  createOrder,
  updateOrder,
  deleteOrder,
};
