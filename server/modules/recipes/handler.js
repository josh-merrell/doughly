'use strict';

async function getRecipes(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, recipeIDs, title, recipeCategoryID } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, recipeIDs, title, recipeCategoryID });
  return res.json(returner);
}

async function getRecipeByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function createRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    title,
    servings,
    lifespanDays,
    recipeCategoryID,
    type,
    timePrep,
    timeBake,
    photoURL,
  });
  return res.json(returner);
}

async function updateRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const { title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = req.body;
  const returner = await p.update({
    userID: req.userID,
    recipeID,
    recipeCategoryID,
    title,
    type,
    servings,
    lifespanDays,
    timePrep,
    timeBake,
    photoURL,
  });
  return res.json(returner);
}

async function deleteRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    authorization,
    userID: req.userID,
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
