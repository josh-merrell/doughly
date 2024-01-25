'use strict';

async function getLogByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { logID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, logID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeFeedback' 'getLogByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getLogs(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { userID, logIDs, recipeID, satisfaction, difficulty, createdAfter, createdBefore, onlyMe } = req.query;
  try {
    const returner = await p.get.all({ userID, onlyMe, recipeID, logIDs, satisfaction, difficulty, createdAfter, createdBefore });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeFeedback' 'getLogs': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createLog(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, satisfaction, difficulty, note, message } = req.body;
  const { customID, userID } = req;
  try {
    const returner = await p.create({
      customID,
      userID,
      recipeID,
      satisfaction,
      difficulty,
      note,
      message
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeFeedback' 'createLog': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getLogByID,
  getLogs,
  createLog,
};
