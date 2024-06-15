'use strict';

async function getMessages(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  const returner = await p.get.all({
    userID: req.userID,
    authorization,
  });
  return res.json(returner);
}

async function acknowledgeMessage(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { message } = req.body;
  const { authorization } = req.headers;
  const returner = await p.acknowledge({
    userID: req.userID,
    message,
    authorization,
  });
  return res.json(returner);
}

async function addMessage(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { message } = req.body;
  const { authorization } = req.headers;
  const returner = await p.add({
    userID: req.userID,
    message,
    authorization,
  });
  return res.json(returner);
}

async function deleteMessage(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { message } = req.body;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    message,
    authorization,
  });
  return res.json(returner);
}

async function welcome(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  const returner = await p.addWelcomeMessage({
    userID: req.userID,
    authorization,
  });
  return res.json(returner);
}

module.exports = {
  getMessages,
  acknowledgeMessage,
  deleteMessage,
  addMessage,
  welcome,
};
