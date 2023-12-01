'use strict';

async function getProfile(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  let { userID } = req.query;
  if (!userID) {
    userID = req.userID;
  }
  const returner = await p.getProfile({
    userID
  });
  return res.json(returner);
}

async function getFriends(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  let { friendStatus } = req.query;
  if (!friendStatus) {
    friendStatus = 'confirmed';
  }
  const returner = await p.getFriends({
    userID: req.userID,
    friendStatus,
  });
  return res.json(returner);
}

async function getFriend(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friendUserID } = req.params;
  const returner = await p.getFriend({
    userID: req.userID,
    friendUserID,
  });
  return res.json(returner);
}

async function getFollowers(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const returner = await p.getFollowers({
    userID: req.userID,
  });
  return res.json(returner);
}

async function getFollower(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { followerUserID } = req.params;
  const returner = await p.getFollower({
    userID: req.userID,
    followerUserID,
  });
  return res.json(returner);
}

async function getFollowing(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const returner = await p.getFollowing({
    userID: req.userID,
  });
  return res.json(returner);
}

async function searchProfiles(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { searchQuery } = req.query;
  const returner = await p.searchProfiles({
    userID: req.userID,
    searchQuery,
  });
  return res.json(returner);
}

module.exports = {
  getProfile,
  getFriends,
  getFriend,
  getFollowers,
  getFollower,
  getFollowing,
  searchProfiles,
};
