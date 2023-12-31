async function getSteps(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepIDs, title } = req.query;
  try {
    const returner = await p.get.all({ userID: req.userID, stepIDs, title });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'steps' 'getSteps': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getStepByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, stepID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'steps' 'getStepByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { title, description } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
      title,
      description,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'steps' 'createStep': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updateStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepID } = req.params;
  const { title, description } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      stepID,
      title,
      description,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'steps' 'updateStep': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteStep(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { stepID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({ authorization, userID: req.userID, stepID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'steps' 'deleteStep': ${e.message}`);
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
