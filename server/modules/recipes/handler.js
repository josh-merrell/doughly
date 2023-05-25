'use strict';

async function getRecipes(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, recipeIDs, title, recipeCategoryID } = req.query;
  const returner = await p.get.all({ cursor, limit, recipeIDs, title, recipeCategoryID });
  return res.json(returner);
}

async function getRecipeByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const returner = await p.get.byID({ recipeID });
  return res.json(returner);
}

async function createRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { title, servings, lifespanDays, recipeCategoryID } = req.body;
  const returner = await p.create({
    title,
    servings,
    lifespanDays,
    recipeCategoryID,
  });
  return res.json(returner);
}

async function updateRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const { title, servings, lifespanDays, recipeCategoryID } = req.body;
  const returner = await p.update({
    recipeID,
    recipeCategoryID,
    title,
    servings,
    lifespanDays,
  });
  return res.json(returner);
}

async function deleteRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const returner = await p.delete({
    recipeID,
  });
  return res.json(returner);
}

module.exports = {
  getRecipes,
  getRecipeByID,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
