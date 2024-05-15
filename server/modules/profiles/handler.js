'use strict';

async function getProfile(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  let { userID } = req.query;
  if (!userID) {
    userID = req.userID;
  }
  try {
    const returner = await p.getProfile({
      userID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'getProfile': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getFriends(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  let { friendStatus } = req.query;
  if (!friendStatus) {
    friendStatus = 'confirmed';
  }
  try {
    const returner = await p.getFriends({
      userID: req.userID,
      friendStatus,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'getFriends': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getFriend(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { friendUserID } = req.params;
  try {
    const returner = await p.getFriend({
      userID: req.userID,
      friendUserID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'getFriend': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getFollowers(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  try {
    const returner = await p.getFollowers({
      userID: req.userID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'getFollowers': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getFollower(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { followerUserID } = req.params;
  try {
    const returner = await p.getFollower({
      userID: req.userID,
      followerUserID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'getFollower': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getFollowing(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  try {
    const returner = await p.getFollowing({
      userID: req.userID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'getFollowing': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function searchProfiles(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { searchQuery } = req.query;
  try {
    const returner = await p.searchProfiles({
      userID: req.userID,
      searchQuery,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'searchProfiles': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteProfile(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { userID } = req.params;
  try {
    const returner = await p.deleteProfile({
      userID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'deleteProfile': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function populateAccount(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { userID } = req.params;
  try {
    const returner = await p.populateAccount({
      userID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'profiles' 'populateAccount': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getProfile,
  getFriends,
  getFriend,
  getFollowers,
  getFollower,
  getFollowing,
  searchProfiles,
  deleteProfile,
  populateAccount,
};
