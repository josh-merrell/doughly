'use strict';

async function getFriendships(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit } = req.query;
  const { friendIDs, name, sourceUserID } = req.query;
  try {
    const returner = await p.get.all({
      userID: req.userID,
      sourceUserID,
      cursor,
      limit,
      friendIDs,
      name,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'friendships' 'getFriendships': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getFriendshipByID(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friendID } = req.params;
  try {
    const returner = await p.get.by.ID({
      userID: req.userID,
      friendID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'friendships' 'getFriendshipByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createFriendship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friend, status } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
      friend,
      status,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'friendships' 'createFriendship': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updateFriendship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friendshipID } = req.params;
  const { status } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      friendshipID,
      status,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'friendships' 'updateFriendship': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteFriendship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friendshipID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      userID: req.userID,
      authorization,
      friendshipID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'friendships' 'deleteFriendship': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getFriendships,
  getFriendshipByID,
  createFriendship,
  updateFriendship,
  deleteFriendship,
};
