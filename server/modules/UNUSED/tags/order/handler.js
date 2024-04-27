'use strict';

async function getOrderTags(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, orderTagIDs, orderID } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, orderTagIDs, orderID });
  return res.json(returner);
}

async function getOrderTagByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { tagID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, tagID });
  return res.json(returner);
}

async function createOrderTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { orderID, tagID } = req.body;
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
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
    userID: req.userID,
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
