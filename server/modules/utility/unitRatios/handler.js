'use strict';

async function checkForRatio(req, res) {
  const p = require('./processor')();
  const { material, unitA, unitB } = req.query;
  try {
    const returner = await p.checkForRatio({ material, unitA, unitB });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'unitRatios' 'checkForRatio': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getAllDraftRatios(req, res) {
  const p = require('./processor')();
  try {
    const returner = await p.getAllDraftRatios();
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'unitRatios' 'getAllDraftRatios': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function addUnitRatio(req, res) {
  const p = require('./processor')();
  const { material, unitA, unitB, ratio } = req.body;
  try {
    const returner = await p.addUnitRatio({ material, unitA, unitB, ratio });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'unitRatios' 'addUnitRatio': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function batchUpdateRatios(req, res) {
  const p = require('./processor')();
  console.log(`BODY KEYS: ${Object.keys(req.body)}`)
  const { ratios } = req.body;
  try {
    const returner = await p.batchUpdateRatios({ ratios });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'unitRatios' 'batchUpdateRatios': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  checkForRatio,
  getAllDraftRatios,
  addUnitRatio,
  batchUpdateRatios,
};