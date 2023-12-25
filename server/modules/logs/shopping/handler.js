'use strict';

async function getLogByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { logID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, logID });
  return res.json(returner);
}

async function getLogs(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { logIDs, subjectID, eventType, createdAfter, createdBefore } = req.query;
  const returner = await p.get.all({ userID: req.userID, logIDs, subjectID, eventType, createdAfter, createdBefore });
  return res.json(returner);
}

async function createLog(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { eventType, subjectID, associatedID, oldValue, newValue, message } = req.body;
  const { customID, userID } = req;
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
}

module.exports = {
  getLogByID,
  getLogs,
  createLog,
}