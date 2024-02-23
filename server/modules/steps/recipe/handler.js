async function getSteps(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepIDs, recipeID, stepID } = req.query;
  try {
    const returner = await p.get.all({ userID: req.userID, recipeStepIDs, recipeID, stepID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeSteps' 'getSteps': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getStepByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, recipeStepID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeSteps' 'getStepByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, stepID, sequence, photoURL } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
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
  } catch (e) {
    global.logger.error(`'recipeSteps' 'createStep': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updateStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  const { authorization } = req.headers;
  const { sequence, photoURL } = req.body;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      recipeStepID,
      sequence,
      photoURL,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeSteps' 'updateStep': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeStepID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({ userID: req.userID, recipeStepID, authorization });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeSteps' 'deleteStep': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getSteps,
  getStepByID,
  createStep,
  updateStep,
  deleteStep,
};
