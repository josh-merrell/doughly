'use strict';

async function getFollowships(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit } = req.query;
  const { followshipIDs, name } = req.query;
  const returner = await p.get.all({
    userID: req.userID,
    cursor,
    limit,
    followshipIDs,
    name,
  });
  return res.json(returner);
}

async function getFollowers(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit } = req.query;
  const returner = await p.get.followers({
    userID: req.userID,
    cursor,
    limit,
  });
  return res.json(returner);
}

async function getFollowshipByID(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { followshipID } = req.params;
  const returner = await p.get.by.ID({
    userID: req.userID,
    followshipID,
  });
  return res.json(returner);
}

async function createFollowship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { following } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    following,
  });
  return res.json(returner);
}

async function deleteFollowship(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { followshipID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    authorization,
    followshipID,
  });
  return res.json(returner);
}

module.exports = {
  getFollowships,
  getFollowshipByID,
  createFollowship,
  deleteFollowship,
  getFollowers,
};
