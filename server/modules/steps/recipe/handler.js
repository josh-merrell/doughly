async function getSteps(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepIDs, recipeID, stepID } = req.query;
  const returner = await p.get.all({ recipeStepIDs, recipeID, stepID });
  return res.json(returner);
}

async function getStepByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  const returner = await p.get.byID({ recipeStepID });
  return res.json(returner);
}

async function createStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, stepID, sequence } = req.body;
  const returner = await p.create({
    recipeID,
    stepID,
    sequence,
  });
  return res.json(returner);
}

async function updateStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  const { sequence } = req.body;
  const returner = await p.update({
    recipeStepID,
    sequence,
  });
  return res.json(returner);
}

async function deleteStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  const returner = await p.delete({ recipeStepID });
  return res.json(returner);
}

module.exports = {
  getSteps,
  getStepByID,
  createStep,
  updateStep,
  deleteStep,
};
