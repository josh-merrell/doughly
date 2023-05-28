'use strict';

async function getRecipeTools(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeToolIDs, recipeID, toolID } = req.query;
  const returner = await p.get.all({ recipeToolIDs, recipeID, toolID });
  return res.json(returner);
}

async function getRecipeToolByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeToolID } = req.params;
  const returner = await p.get.byID({ recipeToolID });
  return res.json(returner);
}

async function createRecipeTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, toolID, quantity } = req.body;
  const returner = await p.create({
    recipeID,
    toolID,
    quantity,
  });
  return res.json(returner);
}

async function updateRecipeTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeToolID } = req.params;
  const { quantity } = req.body;
  const returner = await p.update({
    recipeToolID,
    quantity,
  });
  return res.json(returner);
}

async function deleteRecipeTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeToolID } = req.params;
  const returner = await p.delete({
    recipeToolID,
  });
  return res.json(returner);
}

module.exports = {
  getRecipeTools,
  getRecipeToolByID,
  createRecipeTool,
  updateRecipeTool,
  deleteRecipeTool,
};
