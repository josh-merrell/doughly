'use strict';

async function checkForRatio(req, res) {
  const p = require('./processor')();
  const { material, unitA, unitB } = req.query;
  const returner = await p.checkForRatioProcessor({ material, unitA, unitB });
  return res.json(returner);
}

async function getUnitRatio(req, res) {
  const p = require('./processor')();
  const { material, unitA, unitB } = req.query;
  const { authorization } = req.headers;
  const returner = await p.getUnitRatioProcessor({ material, unitA, unitB, authorization, userID: req.userID });
  return res.json(returner);
}

async function getAllDraftRatios(req, res) {
  const p = require('./processor')();
  const returner = await p.getAllDraftRatiosProcessor();
  return res.json(returner);
}

async function addUnitRatio(req, res) {
  const p = require('./processor')();
  const { material, unitA, unitB, ratio } = req.body;
  const returner = await p.addUnitRatioProcesser({ material, unitA, unitB, ratio });
  return res.json(returner);
}

async function batchUpdateRatios(req, res) {
  const p = require('./processor')();
  console.log(`BODY KEYS: ${Object.keys(req.body)}`);
  const { ratios } = req.body;
  const returner = await p.batchUpdateRatiosProcessor({ ratios });
  return res.json(returner);
}

module.exports = {
  checkForRatio,
  getUnitRatio,
  getAllDraftRatios,
  addUnitRatio,
  batchUpdateRatios,
};
