'use strict';

async function getRecipeTools(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeToolIDs, recipeID, toolID } = req.query;
  try {
    const returner = await p.get.all({ userID: req.userID, recipeToolIDs, recipeID, toolID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeTools' 'getTools': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getRecipeToolByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeToolID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, recipeToolID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeTools' 'getToolByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createRecipeTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, toolID, quantity } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
      recipeID,
      toolID,
      quantity,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeTools' 'createTool': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updateRecipeTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeToolID } = req.params;
  const { authorization } = req.headers;
  const { quantity } = req.body;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      recipeToolID,
      quantity,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeTools' 'updateTool': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteRecipeTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeToolID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      userID: req.userID,
      recipeToolID,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeTools' 'deleteTool': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getRecipeTools,
  getRecipeToolByID,
  createRecipeTool,
  updateRecipeTool,
  deleteRecipeTool,
};
