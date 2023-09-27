async function getSteps(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepIDs, title } = req.query;
  const returner = await p.get.all({ userID: req.userID, stepIDs, title });
  return res.json(returner);
}

async function getStepByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, stepID });
  return res.json(returner);
}

async function createStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { title, description } = req.body;
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
    title,
    description,
  });
  return res.json(returner);
}

async function updateStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepID } = req.params;
  const { title, description } = req.body;
  const returner = await p.update({
    userID: req.userID,
    stepID,
    title,
    description,
  });
  return res.json(returner);
}

async function deleteStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepID } = req.params;
  const returner = await p.delete({ userID: req.userID, stepID });
  return res.json(returner);
}

module.exports = {
  getSteps,
  getStepByID,
  createStep,
  updateStep,
  deleteStep,
};
