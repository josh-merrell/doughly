async function getSteps(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepIDs, title } = req.query;
  const returner = await p.get.all({ stepIDs, title });
  return res.json(returner);
}

async function getStepByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepID } = req.params;
  const returner = await p.get.byID({ stepID });
  return res.json(returner);
}

async function createStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { title, description } = req.body;
  const returner = await p.create({
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
  const returner = await p.delete({ stepID });
  return res.json(returner);
}

module.exports = {
  getSteps,
  getStepByID,
  createStep,
  updateStep,
  deleteStep,
};
