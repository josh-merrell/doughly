'use strict';

async function getRecipeComponents(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, recipeComponentIDs, recipeID } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, recipeComponentIDs, recipeID });
  return res.json(returner);
}

async function getRecipeComponentByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeComponentID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, recipeComponentID });
  return res.json(returner);
}

async function createRecipeComponent(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, componentID, componentAdvanceDays } = req.body;
  const returner = await p.create({
    userID: req.userID,
    recipeID,
    componentID,
    componentAdvanceDays,
  });
  return res.json(returner);
}

async function updateRecipeComponent(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeComponentID } = req.params;
  const { componentAdvanceDays } = req.body;
  const returner = await p.update({
    userID: req.userID,
    recipeComponentID,
    componentAdvanceDays,
  });
  return res.json(returner);
}

async function deleteRecipeComponent(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeComponentID } = req.params;
  const returner = await p.delete({
    userID: req.userID,
    recipeComponentID,
  });
  return res.json(returner);
}

module.exports = {
  getRecipeComponents,
  getRecipeComponentByID,
  createRecipeComponent,
  updateRecipeComponent,
  deleteRecipeComponent,
};
