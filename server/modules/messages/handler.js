'use strict';

async function getMessages(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  try {
    const returner = await p.get.all({
      userID: req.userID,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'messages' 'getMessages': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function acknowledgeMessage(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { message } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.acknowledge({
      userID: req.userID,
      message,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'messages' 'acknowledgeMessage': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function addMessage(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { message } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.add({
      userID: req.userID,
      message,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'messages' 'addMessage': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteMessage(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { message } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      userID: req.userID,
      message,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'messages' 'deleteMessage': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function welcome(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  try {
    const returner = await p.addWelcomeMessage({
      userID: req.userID,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'messages' 'welcome': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getMessages,
  acknowledgeMessage,
  deleteMessage,
  addMessage,
  welcome
};
