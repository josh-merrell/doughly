'use strict';

async function getUserPushTokens(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  try {
    const returner = await p.get.userTokens({
      userID: req.userID,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'pushNotifications' 'getUserPushTokens': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function addPushToken(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { token } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.add.token({
      userID: req.userID,
      token,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'pushNotifications' 'addPushToken': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function removePushToken(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { token } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.remove.token({
      userID: req.userID,
      token,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'pushNotifications' 'removePushToken': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function removeUserPushTokens(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  try {
    const returner = await p.remove.userTokens({
      userID: req.userID,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'pushNotifications' 'removeUserPushTokens': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getUserPushTokens,
  addPushToken,
  removePushToken,
  removeUserPushTokens,
};
