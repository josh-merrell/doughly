'use strict';

async function getLogByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { logID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, logID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingLogs' 'getLogByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getLogs(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { logIDs, subjectID, eventType, createdAfter, createdBefore } = req.query;
  try {
    const returner = await p.get.all({ userID: req.userID, logIDs, subjectID, eventType, createdAfter, createdBefore });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingLogs' 'getLogs': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createLog(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { eventType, subjectID, associatedID, oldValue, newValue, message } = req.body;
  const { customID, userID } = req;
  try {
    const returner = await p.create({
      subjectID,
      customID,
      userID,
      eventType,
      associatedID,
      oldValue,
      newValue,
      message,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingLogs' 'createLog': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getLogByID,
  getLogs,
  createLog,
};
