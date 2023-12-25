'use strict';

async function getFriendships(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit } = req.query;
  const { friendIDs, name, sourceUserID } = req.query;
  const returner = await p.get.all({
    userID: req.userID,
    sourceUserID,
    cursor,
    limit,
    friendIDs,
    name,
  });
  return res.json(returner);
}

async function getFriendshipByID(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friendID } = req.params;
  const returner = await p.get.by.ID({
    userID: req.userID,
    friendID,
  });
  return res.json(returner);
}

async function createFriendship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friend, status } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    friend,
    status,
  });
  return res.json(returner);
}

async function updateFriendship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friendshipID } = req.params;
  const { status } = req.body;
  const { authorization } = req.headers;
  const returner = await p.update({
    userID: req.userID,
    authorization,
    friendshipID,
    status,
  });
  return res.json(returner);
}

async function deleteFriendship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friendshipID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    authorization,
    friendshipID,
  });
  return res.json(returner);
}

module.exports = {
  getFriendships,
  getFriendshipByID,
  createFriendship,
  updateFriendship,
  deleteFriendship,
};
