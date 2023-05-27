'use strict';

async function getOrderTags(req, res) {
  console.log(`HAS DB: ${req.client.db !== undefined}`);
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, orderTagIDs, orderID } = req.query;
  const returner = await p.get.all({ cursor, limit, orderTagIDs, orderID });
  return res.json(returner);
}

async function getOrderTagByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { tagID } = req.params;
  const returner = await p.get.byID({ tagID });
  return res.json(returner);
}

async function createOrderTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderID, tagID } = req.body;
  const returner = await p.create({
    orderID,
    tagID,
  });
  return res.json(returner);
}

async function deleteOrderTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderTagID } = req.params;
  const returner = await p.delete({
    orderTagID,
  });
  return res.json(returner);
}

module.exports = {
  getOrderTags,
  getOrderTagByID,
  createOrderTag,
  deleteOrderTag,
};
