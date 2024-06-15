'use strict';

async function getUserPushTokens(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  const returner = await p.get.userTokens({
    userID: req.userID,
    authorization,
  });
  return res.json(returner);
}

async function getOtherUserPushTokens(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { userID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.get.otherUser({
    userID,
    authorization,
  });
  return res.json(returner);
}

async function addPushToken(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { token } = req.body;
  const { authorization } = req.headers;
  const returner = await p.add.token({
    userID: req.userID,
    token,
    authorization,
  });
  return res.json(returner);
}

async function removePushToken(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { token } = req.params;
  const { authorization } = req.headers;
  const returner = await p.remove.token({
    userID: req.userID,
    token,
    authorization,
  });
  return res.json(returner);
}

async function removeUserPushTokens(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  const returner = await p.remove.userTokens({
    userID: req.userID,
    authorization,
  });
  return res.json(returner);
}

async function sendNotification(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { destTokens, type, data } = req.body;
  const { authorization } = req.headers;
  const returner = await p.send.notification({
    userID: req.userID,
    authorization,
    destTokens,
    type,
    data,
  });
  return res.json(returner);
}

module.exports = {
  getUserPushTokens,
  getOtherUserPushTokens,
  addPushToken,
  removePushToken,
  removeUserPushTokens,
  sendNotification,
};
