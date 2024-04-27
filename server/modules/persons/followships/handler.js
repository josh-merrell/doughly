'use strict';

async function getFollowships(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit } = req.query;
  const { followshipIDs, name } = req.query;
  try {
    const returner = await p.get.all({
      userID: req.userID,
      cursor,
      limit,
      followshipIDs,
      name,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'followships' 'getFollowships': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getFollowers(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit } = req.query;
  try {
    const returner = await p.get.followers({
      userID: req.userID,
      cursor,
      limit,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'followships' 'getFollowers': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getFollowshipByID(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { followshipID } = req.params;
  try {
    const returner = await p.get.by.ID({
      userID: req.userID,
      followshipID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'followships' 'getFollowshipByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createFollowship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { following } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
      following,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'followships' 'createFollowship': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteFollowship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { followshipID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      userID: req.userID,
      authorization,
      followshipID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'followships' 'deleteFollowship': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getFollowships,
  getFollowshipByID,
  createFollowship,
  deleteFollowship,
  getFollowers,
};
