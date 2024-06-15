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
  const { userID, logIDs, recipeID, satisfaction, difficulty, createdAfter, createdBefore, onlyMe } = req.query;
  const returner = await p.get.all({ userID, onlyMe, recipeID, logIDs, satisfaction, difficulty, createdAfter, createdBefore });
  return res.json(returner);
}

async function createLog(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, satisfaction, difficulty, note, message } = req.body;
  const { customID, userID } = req;
  const returner = await p.create({
    customID,
    userID,
    recipeID,
    satisfaction,
    difficulty,
    note,
    message,
  });
  return res.json(returner);
}

module.exports = {
  getLogByID,
  getLogs,
  createLog,
};
