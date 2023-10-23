async function getSteps(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepIDs, recipeID, stepID } = req.query;
  const returner = await p.get.all({ userID: req.userID, recipeStepIDs, recipeID, stepID });
  return res.json(returner);
}

async function getStepByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, recipeStepID });
  return res.json(returner);
}

async function createStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, stepID, sequence, photoURL } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    recipeID,
    stepID,
    sequence,
    photoURL,
  });
  return res.json(returner);
}

async function updateStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  const { sequence, photoURL } = req.body;
  const returner = await p.update({
    userID: req.userID,
    recipeStepID,
    sequence,
    photoURL,
  });
  return res.json(returner);
}

async function deleteStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({ userID: req.userID, recipeStepID, authorization });
  return res.json(returner);
}

module.exports = {
  getSteps,
  getStepByID,
  createStep,
  updateStep,
  deleteStep,
};
